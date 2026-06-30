"""HanVerse — Deterministic Scoring Engine.

Computes pronunciation, tone, and fluency scores using deterministic
algorithms. GPT is NEVER used for scoring — only deterministic analysis.
"""

import logging
from dataclasses import dataclass, field
from typing import Optional

from tone_classifier import ToneClassifier
from phoneme_compare import PhonemeComparer
from fluency_calc import FluencyCalculator

logger = logging.getLogger("hanverse.scoring_engine")

# ---------------------------------------------------------------------------
# HSK ↔ Score range mapping
# ---------------------------------------------------------------------------
HSK_BANDS = [
    (90, 100, "HSK5-6", "C1-C2"),
    (75, 89,  "HSK4",   "B2"),
    (60, 74,  "HSK3",   "B1"),
    (40, 59,  "HSK2",   "A2"),
    (0,  39,  "HSK1",   "A1"),
]


def _map_hsk(score: float) -> tuple[str, str]:
    for lo, hi, hsk, cefr in HSK_BANDS:
        if lo <= score <= hi:
            return hsk, cefr
    return "HSK1", "A1"


# ---------------------------------------------------------------------------
# Scoring Engine
# ---------------------------------------------------------------------------
class ScoringEngine:
    """Orchestrates all scoring sub-modules."""

    def __init__(
        self,
        tone_classifier: Optional[ToneClassifier] = None,
        phoneme_comparer: Optional[PhonemeComparer] = None,
        fluency_calculator: Optional[FluencyCalculator] = None,
    ):
        self.tone = tone_classifier or ToneClassifier()
        self.phoneme = phoneme_comparer or PhonemeComparer()
        self.fluency = fluency_calculator or FluencyCalculator()

    def score(
        self,
        reference_text: str,
        reference_pinyin: str,
        asr_text: str,
        asr_segments: list[dict],
    ) -> dict:
        """Run the full scoring pipeline.

        Parameters
        ----------
        reference_text : str
            The sentence the user was supposed to read (汉字).
        reference_pinyin : str
            Space-separated pinyin, e.g. "nǐ hǎo".
        asr_text : str
            Whisper ASR output text.
        asr_segments : list[dict]
            Whisper word-level segments with timestamps.

        Returns
        -------
        dict with keys: pronunciation, tone, fluency, overall,
                        hsk_estimate, cefr_estimate,
                        error_phonemes, report_data
        """
        # 1) Pronunciation = phoneme error rate
        phoneme_result = self.phoneme.compare(reference_pinyin, asr_text)
        pronunciation_score = max(0.0, 100.0 - phoneme_result["error_rate"] * 100.0)

        # 2) Tone accuracy using librosa F0 analysis
        tone_result = self.tone.classify(reference_pinyin, asr_text)
        tone_score = tone_result["accuracy"] * 100.0

        # 3) Fluency from ASR timestamps
        fluency_result = self.fluency.calculate(asr_segments, reference_text)
        fluency_score = fluency_result["score"]

        # 4) Overall
        overall = 0.4 * pronunciation_score + 0.3 * tone_score + 0.3 * fluency_score

        # 5) HSK / CEFR mapping
        hsk, cefr = _map_hsk(overall)

        # Build error_phonemes (contract-compliant)
        error_phonemes = {
            "tone": tone_result.get("errors", []),
            "pronunciation": phoneme_result.get("errors", []),
        }

        # Build report_data
        report_data = {
            "tone_heatmap": tone_result.get("heatmap", {}),
            "fluency_detail": {
                "speech_rate_wpm": fluency_result.get("speech_rate_wpm", 0),
                "pause_count": fluency_result.get("pause_count", 0),
                "avg_pause_ms": fluency_result.get("avg_pause_ms", 0),
            },
            "suggestions": self._generate_suggestions(
                pronunciation_score, tone_score, fluency_score
            ),
        }

        return {
            "pronunciation": round(pronunciation_score, 2),
            "tone": round(tone_score, 2),
            "fluency": round(fluency_score, 2),
            "overall": round(overall, 2),
            "hsk_estimate": hsk,
            "cefr_estimate": cefr,
            "error_phonemes": error_phonemes,
            "report_data": report_data,
        }

    @staticmethod
    def _generate_suggestions(pron: float, tone: float, fluency: float) -> list[str]:
        """Generate deterministic suggestions based on score breakdown."""
        suggestions = []
        scores = [("pronunciation", pron), ("tone", tone), ("fluency", fluency)]
        scores.sort(key=lambda x: x[1])

        weakest = scores[0]
        if weakest[0] == "pronunciation":
            suggestions.append("Focus on clear articulation of initials and finals.")
        elif weakest[0] == "tone":
            suggestions.append("Practice tone pairs to improve pitch accuracy.")
        elif weakest[0] == "fluency":
            suggestions.append("Try to speak at a natural, steady pace with fewer pauses.")

        if scores[1][1] < 60:
            suggestions.append(f"Work on your {scores[1][0]} for better overall fluency.")
        if pron >= 80 and tone >= 80 and fluency >= 80:
            suggestions.append("Great job! Try more complex sentences to challenge yourself.")

        return suggestions
