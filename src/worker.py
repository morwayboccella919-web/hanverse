"""HanVerse AI Worker — Main entry point.

Consumes assessment jobs from Redis queue "assessment:queue",
processes audio through the scoring pipeline, and writes results to PostgreSQL.
"""

import json
import logging
import os
import signal
import sys
import time
import uuid
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras
import redis

from scoring_engine import ScoringEngine
from whisper_client import WhisperClient
from gpt_explainer import GPTExplainer
from practice_generator import PracticeGenerator

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hanverse")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
QUEUE_KEY = "assessment:queue"
PRACTICE_QUEUE_KEY = "practice:queue"
POLL_TIMEOUT = 5  # seconds for BLPOP

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hanverse.worker")

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
_shutdown = False


def _handle_shutdown(signum, frame):
    global _shutdown
    logger.info("Received shutdown signal (%s), finishing current job...", signum)
    _shutdown = True


signal.signal(signal.SIGINT, _handle_shutdown)
signal.signal(signal.SIGTERM, _handle_shutdown)

# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
class AssessmentPipeline:
    """Orchestrates the full assessment flow."""

    def __init__(self, db_conn, whisper: WhisperClient, explainer: GPTExplainer):
        self.engine = ScoringEngine()
        self.whisper = whisper
        self.explainer = explainer
        self.db = db_conn

    def process(self, job: dict) -> dict:
        """Process a single assessment job and return the result dict."""
        assessment_id = job["assessment_id"]
        audio_url = job["audio_url"]
        reference_text = job["reference_text"]
        reference_pinyin = job["reference_pinyin"]

        logger.info("Processing assessment %s", assessment_id)

        # 1) Run Whisper ASR
        asr_result = self.whisper.transcribe(audio_url)
        asr_text = asr_result.get("text", "")
        asr_segments = asr_result.get("segments", [])

        # 2) Run scoring
        scores = self.engine.score(
            reference_text=reference_text,
            reference_pinyin=reference_pinyin,
            asr_text=asr_text,
            asr_segments=asr_segments,
        )

        # 3) Generate explanation (GPT — does NOT score)
        explanation = self.explainer.explain(
            reference_text=reference_text,
            error_phonemes=scores["error_phonemes"],
            hsk_level=scores["hsk_estimate"],
        )

        return {
            "status": "done",
            "pronunciation_score": scores["pronunciation"],
            "tone_score": scores["tone"],
            "fluency_score": scores["fluency"],
            "overall_score": scores["overall"],
            "hsk_estimate": scores["hsk_estimate"],
            "cefr_estimate": scores["cefr_estimate"],
            "error_phonemes": scores["error_phonemes"],
            "explanation": explanation,
            "report_data": scores["report_data"],
        }

    def write_result(self, assessment_id: str, result: dict, duration_ms: int):
        """Write the completed assessment result to PostgreSQL."""
        cur = self.db.cursor()
        cur.execute(
            """
            UPDATE assessments
            SET status = %(status)s,
                pronunciation_score = %(pronunciation_score)s,
                tone_score = %(tone_score)s,
                fluency_score = %(fluency_score)s,
                overall_score = %(overall_score)s,
                hsk_estimate = %(hsk_estimate)s,
                cefr_estimate = %(cefr_estimate)s,
                error_phonemes = %(error_phonemes)s,
                explanation = %(explanation)s,
                report_data = %(report_data)s,
                processing_duration_ms = %(processing_duration_ms)s,
                updated_at = %(updated_at)s
            WHERE id = %(id)s
            """,
            {
                "id": assessment_id,
                "status": result["status"],
                "pronunciation_score": result["pronunciation_score"],
                "tone_score": result["tone_score"],
                "fluency_score": result["fluency_score"],
                "overall_score": result["overall_score"],
                "hsk_estimate": result["hsk_estimate"],
                "cefr_estimate": result["cefr_estimate"],
                "error_phonemes": json.dumps(result["error_phonemes"]),
                "explanation": result["explanation"],
                "report_data": json.dumps(result["report_data"]),
                "processing_duration_ms": duration_ms,
                "updated_at": datetime.now(timezone.utc),
            },
        )
        self.db.commit()
        cur.close()
        logger.info("Assessment %s written to DB", assessment_id)

    def mark_failed(self, assessment_id: str, error_msg: str):
        """Mark an assessment as failed with an error message."""
        cur = self.db.cursor()
        cur.execute(
            """
            UPDATE assessments
            SET status = 'failed',
                explanation = %(error)s,
                updated_at = %(updated_at)s
            WHERE id = %(id)s
            """,
            {
                "id": assessment_id,
                "error": error_msg,
                "updated_at": datetime.now(timezone.utc),
            },
        )
        self.db.commit()
        cur.close()
        logger.error("Assessment %s marked failed: %s", assessment_id, error_msg)


# ---------------------------------------------------------------------------
# Worker loop
# ---------------------------------------------------------------------------
def main():
    logger.info("HanVerse AI Worker starting...")

    # Connect to Redis
    r = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        r.ping()
    except redis.ConnectionError as exc:
        logger.fatal("Cannot connect to Redis at %s: %s", REDIS_URL, exc)
        sys.exit(1)

    # Connect to PostgreSQL
    db = psycopg2.connect(DATABASE_URL)
    db.autocommit = False

    # Initialise pipeline components
    whisper = WhisperClient(api_key=OPENAI_API_KEY)
    explainer = GPTExplainer(api_key=OPENAI_API_KEY)
    pipeline = AssessmentPipeline(db, whisper, explainer)

    logger.info("Worker ready, listening on queue '%s'", QUEUE_KEY)

    while not _shutdown:
        try:
            # Block until a job arrives
            result = r.blpop(QUEUE_KEY, timeout=POLL_TIMEOUT)
            if result is None:
                # Timeout — just loop back (health check opportunity)
                continue

            _, raw_job = result
            job = json.loads(raw_job)
            assessment_id = job.get("assessment_id")
            if not assessment_id:
                logger.warning("Received job without assessment_id, skipping")
                continue

            logger.info("Dequeued assessment %s", assessment_id)

            # Mark as processing
            cur = db.cursor()
            cur.execute(
                "UPDATE assessments SET status = 'processing', updated_at = %s WHERE id = %s",
                (datetime.now(timezone.utc), assessment_id),
            )
            db.commit()
            cur.close()

            t_start = time.monotonic()

            try:
                result_data = pipeline.process(job)
                duration_ms = int((time.monotonic() - t_start) * 1000)
                pipeline.write_result(assessment_id, result_data, duration_ms)
            except Exception as exc:
                duration_ms = int((time.monotonic() - t_start) * 1000)
                logger.exception("Job %s failed after %d ms", assessment_id, duration_ms)
                pipeline.mark_failed(assessment_id, str(exc))

        except (redis.ConnectionError, psycopg2.OperationalError) as exc:
            logger.error("Infrastructure error: %s — retrying in 5s", exc)
            time.sleep(5)
        except Exception:
            logger.exception("Unexpected error in worker loop")

    logger.info("Worker shutting down gracefully.")
    r.close()
    db.close()


if __name__ == "__main__":
    main()
