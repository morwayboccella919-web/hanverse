"""HanVerse — Fluency Calculator.

Computes speech rate (words per minute), pause count, and average
pause duration from Whisper ASR segment timestamps.
"""

import logging
from typing import Optional

logger = logging.getLogger("hanverse.fluency_calc")


class FluencyCalculator:
    """Analyse fluency from ASR word-level timestamp segments."""

    # Target ranges for a "natural" speaker
    IDEAL_WPM_MIN = 120   # words per minute lower bound
    IDEAL_WPM_MAX = 180   # words per minute upper bound
    PAUSE_THRESHOLD_MS = 400  # silence ≥ 400 ms counts as a pause
    MAX_ACCEPTABLE_PAUSES_PER_SYLLABLE = 0.5

    def __init__(self):
        pass

    def calculate(
        self, segments: list[dict], reference_text: str
    ) -> dict:
        """Calculate fluency metrics from ASR segments.

        Parameters
        ----------
        segments : list[dict]
            Whisper word-level segments with 'start' and 'end' keys (seconds).
        reference_text : str
            The expected text (used for syllable count).

        Returns
        -------
        dict with keys: score (0-100), speech_rate_wpm, pause_count,
                        avg_pause_ms.
        """
        if not segments:
            return {
                "score": 0.0,
                "speech_rate_wpm": 0,
                "pause_count": 0,
                "avg_pause_ms": 0,
            }

        # Extract word timings from segments
        words = self._extract_words(segments)

        if not words or len(words) < 2:
            return {
                "score": 50.0,
                "speech_rate_wpm": 0,
                "pause_count": 0,
                "avg_pause_ms": 0,
            }

        total_duration_s = words[-1]["end"] - words[0]["start"]
        word_count = len(words)

        # Speech rate (words per minute)
        if total_duration_s > 0:
            wpm = (word_count / total_duration_s) * 60.0
        else:
            wpm = 0.0

        # Pause analysis
        pauses = self._find_pauses(words)
        pause_count = len(pauses)
        avg_pause_ms = (
            sum(p["duration_ms"] for p in pauses) / len(pauses)
            if pauses
            else 0.0
        )

        # Score computation
        syllable_count = len(reference_text.replace(" ", ""))
        score = self._compute_score(wpm, pause_count, syllable_count, avg_pause_ms)

        return {
            "score": round(score, 2),
            "speech_rate_wpm": round(wpm, 1),
            "pause_count": pause_count,
            "avg_pause_ms": round(avg_pause_ms, 1),
        }

    @staticmethod
    def _extract_words(segments: list[dict]) -> list[dict]:
        """Extract word-level entries from Whisper segments.

        Whisper returns segments, each with optional 'words' array.
        If 'words' is missing, treat each segment as one word.
        """
        words = []
        for seg in segments:
            if "words" in seg and seg["words"]:
                words.extend(seg["words"])
            else:
                words.append({
                    "start": seg.get("start", 0.0),
                    "end": seg.get("end", 0.0),
                    "word": seg.get("text", ""),
                })
        return sorted(words, key=lambda w: w["start"])

    def _find_pauses(self, words: list[dict]) -> list[dict]:
        """Identify pauses between consecutive words."""
        pauses = []
        for i in range(len(words) - 1):
            gap_s = words[i + 1]["start"] - words[i]["end"]
            gap_ms = gap_s * 1000.0
            if gap_ms >= self.PAUSE_THRESHOLD_MS:
                pauses.append({
                    "between": f"'{words[i].get('word', '')}' → '{words[i + 1].get('word', '')}'",
                    "duration_ms": round(gap_ms, 1),
                })
        return pauses

    def _compute_score(
        self,
        wpm: float,
        pause_count: int,
        syllable_count: int,
        avg_pause_ms: float,
    ) -> float:
        """Compute a 0-100 fluency score.

        Factors:
        - Speech rate: ideal range 120-180 wpm → 50 points
        - Pauses: fewer is better → 30 points
        - Pause duration: shorter average is better → 20 points
        """
        # Speech rate sub-score (0-50)
        if self.IDEAL_WPM_MIN <= wpm <= self.IDEAL_WPM_MAX:
            rate_score = 50.0
        elif wpm < self.IDEAL_WPM_MIN:
            # Too slow — scale linearly
            rate_score = max(0.0, (wpm / self.IDEAL_WPM_MIN) * 50.0)
        else:
            # Too fast — scale down
            overshoot = (wpm - self.IDEAL_WPM_MAX) / self.IDEAL_WPM_MAX
            rate_score = max(0.0, 50.0 * (1.0 - min(1.0, overshoot)))

        # Pause count sub-score (0-30)
        if syllable_count == 0:
            pause_score_count = 30.0
        else:
            pause_ratio = pause_count / syllable_count
            if pause_ratio <= 0.2:
                pause_score_count = 30.0
            elif pause_ratio <= 0.5:
                pause_score_count = 30.0 * (1.0 - (pause_ratio - 0.2) / 0.3)
            else:
                pause_score_count = max(0.0, 30.0 * (1.0 - pause_ratio))

        # Pause duration sub-score (0-20)
        if avg_pause_ms <= 500:
            dur_score = 20.0
        elif avg_pause_ms <= 1000:
            dur_score = 20.0 * (1.0 - (avg_pause_ms - 500) / 500)
        else:
            dur_score = max(0.0, 20.0 * (1.0 - (avg_pause_ms - 1000) / 2000))

        total = rate_score + pause_score_count + dur_score
        return min(100.0, max(0.0, total))
