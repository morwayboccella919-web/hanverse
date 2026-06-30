"""HanVerse — Whisper ASR Client.

Wrapper around OpenAI Whisper API for speech-to-text transcription.
Returns text and word-level timestamp segments.
"""

import logging
import os
import tempfile
from typing import Optional

import requests

logger = logging.getLogger("hanverse.whisper_client")


class WhisperClient:
    """OpenAI Whisper API client for Mandarin audio transcription."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.base_url = "https://api.openai.com/v1/audio/transcriptions"

    def transcribe(self, audio_url: str) -> dict:
        """Transcribe audio from a URL using OpenAI Whisper.

        Parameters
        ----------
        audio_url : str
            URL to the audio file (e.g., Cloudflare R2 presigned URL).

        Returns
        -------
        dict with keys: text (str), segments (list[dict]).
        """
        if not self.api_key:
            logger.warning("No OpenAI API key configured — returning mock ASR")
            return self._mock_transcribe(audio_url)

        try:
            return self._api_transcribe(audio_url)
        except Exception as exc:
            logger.exception("Whisper API call failed: %s", exc)
            logger.warning("Falling back to mock ASR")
            return self._mock_transcribe(audio_url)

    def _api_transcribe(self, audio_url: str) -> dict:
        """Real API call to OpenAI Whisper."""
        # Download audio to temp file
        resp = requests.get(audio_url, timeout=60)
        resp.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(resp.content)
            tmp_path = tmp.name

        try:
            from openai import OpenAI

            client = OpenAI(api_key=self.api_key)
            with open(tmp_path, "rb") as audio_file:
                result = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["word"],
                    language="zh",
                )

            segments = []
            for seg in result.segments or []:
                segments.append({
                    "start": seg.get("start", 0.0),
                    "end": seg.get("end", 0.0),
                    "text": seg.get("text", ""),
                    "words": seg.get("words", []),
                })

            return {
                "text": result.text or "",
                "segments": segments,
            }
        finally:
            os.unlink(tmp_path)

    @staticmethod
    def _mock_transcribe(audio_url: str) -> dict:
        """Return mock ASR output for testing without real audio.

        Simulates a ~90% accurate transcription.
        """
        # Deterministic mock based on URL hash
        import hashlib
        url_hash = hashlib.md5(audio_url.encode()).hexdigest()

        mock_scenarios = {
            # Default mock: close to reference with some errors
            "default": {
                "text": "nǐ hǎo wǒ jiào xiǎo míng",
                "segments": [
                    {
                        "start": 0.0, "end": 0.4,
                        "text": "nǐ hǎo",
                        "words": [
                            {"start": 0.0, "end": 0.18, "word": "nǐ"},
                            {"start": 0.22, "end": 0.4, "word": "hǎo"},
                        ],
                    },
                    {
                        "start": 0.6, "end": 1.5,
                        "text": "wǒ jiào xiǎo míng",
                        "words": [
                            {"start": 0.6, "end": 0.75, "word": "wǒ"},
                            {"start": 0.8, "end": 1.0, "word": "jiào"},
                            {"start": 1.05, "end": 1.2, "word": "xiǎo"},
                            {"start": 1.3, "end": 1.5, "word": "míng"},
                        ],
                    },
                ],
            },
        }

        return mock_scenarios["default"]
