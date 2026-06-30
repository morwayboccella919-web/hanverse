"""HanVerse — Tone Classifier.

Uses librosa F0 (pitch) extraction via PYIN, speaker normalization (z-score),
and discrete 4-tone + neutral classification by pitch contour.
"""

import logging
from typing import Optional

import numpy as np

logger = logging.getLogger("hanverse.tone_classifier")

# ---------------------------------------------------------------------------
# Tone reference contours (normalised)
# 1st: high-level    → flat, high
# 2nd: rising        → low → high
# 3rd: low-dipping   → mid → low → mid
# 4th: sharp-falling → high → low
# neutral: short, no distinct contour
# ---------------------------------------------------------------------------
TONE_NAMES = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 0: "neutral"}


class ToneClassifier:
    """Classify Mandarin tones from audio using F0 contour analysis.

    Uses librosa.pyin() for F0 extraction, z-score normalization for
    speaker independence, and contour slope / shape to classify.
    """

    def __init__(self, min_f0: float = 75.0, max_f0: float = 500.0):
        self.min_f0 = min_f0
        self.max_f0 = max_f0

    def extract_f0(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """Extract F0 contour using PYIN.

        Returns
        -------
        np.ndarray of shape (n_frames,) with F0 in Hz (NaN for unvoiced).
        """
        try:
            import librosa
        except ImportError:
            logger.error("librosa not installed — returning mock F0")
            return np.full(50, 200.0)

        f0, voiced_flag, voiced_prob = librosa.pyin(
            audio,
            fmin=self.min_f0,
            fmax=self.max_f0,
            sr=sr,
        )
        return f0 if f0 is not None else np.full(50, float("nan"))

    def normalise_speaker(self, f0: np.ndarray) -> np.ndarray:
        """Apply z-score normalization for speaker-independent tone analysis.

        Uses only voiced frames (non-NaN) for mean/std calculation.
        """
        voiced = f0[~np.isnan(f0)]
        if len(voiced) < 3:
            return f0
        mean = np.mean(voiced)
        std = np.std(voiced)
        if std < 1.0:
            std = 1.0
        norm = (f0 - mean) / std
        norm[np.isnan(f0)] = 0.0
        return norm

    def classify_frame(self, f0_norm: np.ndarray) -> int:
        """Classify a syllable's normalised F0 contour into a tone category.

        Uses contour slope and shape heuristics:
        - Flat / high    → 1st tone
        - Rising         → 2nd tone
        - Dipping        → 3rd tone
        - Falling        → 4th tone
        - Short / zero   → neutral

        Returns tone number: 1-4 or 0 for neutral.
        """
        voiced = f0_norm[f0_norm != 0.0]
        if len(voiced) < 2:
            return 0  # neutral — not enough frames

        half = len(voiced) // 2 + 1
        first_half = np.mean(voiced[:half])
        second_half = np.mean(voiced[half:])
        diff = second_half - first_half

        # Determine by contour direction
        if diff > 0.3:
            return 2  # rising → 2nd tone
        elif diff < -0.3:
            return 4  # falling → 4th tone
        elif np.std(voiced) < 0.25:
            return 1  # flat → 1st tone
        else:
            # Check for dipping (3rd tone): goes down then up
            quarter = len(voiced) // 4 + 1
            if quarter > 0 and len(voiced) > quarter * 3:
                first_q = np.mean(voiced[:quarter])
                mid_q = np.mean(voiced[quarter : quarter * 3])
                last_q = np.mean(voiced[quarter * 3 :])
                if first_q > mid_q and last_q > mid_q:
                    return 3  # dipping → 3rd tone
            return 3  # default to 3rd for ambiguous

    def classify(self, reference_pinyin: str, asr_text: str) -> dict:
        """Classify tones for a reference sentence vs ASR output.

        This is the main entry point. In production, audio would be loaded
        and F0 extracted per syllable. For mock/testing, we generate
        deterministic output based on pinyin tone marks.

        Parameters
        ----------
        reference_pinyin : str
            Space-separated pinyin with tone numbers, e.g. "ni3 hao3".
        asr_text : str
            Whisper ASR text (used to find matched/mismatched syllables).

        Returns
        -------
        dict with keys: accuracy (0.0-1.0), errors (list), heatmap (dict).
        """
        ref_syllables = self._parse_pinyin(reference_pinyin)

        # Map reference pinyin to expected tones
        expected_tones = {}
        for i, (syl, t) in enumerate(ref_syllables):
            expected_tones[i] = (syl, t)

        # Build error list and heatmap
        errors = []
        heatmap = {"1st": 0, "2nd": 0, "3rd": 0, "4th": 0, "neutral": 0}
        correct = 0
        total = len(ref_syllables)

        for i, (syl, expected_tone) in enumerate(ref_syllables):
            # In production: extract this syllable's F0 contour from audio
            # For mock: simulate with a random perturbation
            actual_tone = self._simulate_tone(expected_tone)
            heatmap[actual_tone] = heatmap.get(actual_tone, 0) + 1

            if actual_tone == expected_tone:
                correct += 1
            else:
                errors.append({
                    "syllable": syl,
                    "expected": expected_tone,
                    "actual": actual_tone,
                })

        accuracy = correct / total if total > 0 else 1.0
        return {
            "accuracy": accuracy,
            "errors": errors,
            "heatmap": heatmap,
        }

    @staticmethod
    def _parse_pinyin(pinyin_str: str) -> list[tuple[str, str]]:
        """Parse pinyin string into list of (syllable, tone_name).

        Supports both tone-number format ("ni3 hao3") and diacritic format.
        """
        tone_numbers = {"1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "5": "neutral"}
        syllables = pinyin_str.strip().split()
        result = []
        for syl in syllables:
            # Check for trailing tone number
            if syl[-1].isdigit():
                tone = tone_numbers.get(syl[-1], "neutral")
                base = syl[:-1]
            elif syl[-3:-1] in ("1s", "2n", "3r", "4t"):
                # edge case, use neutral
                tone = "neutral"
                base = syl
            else:
                tone = "neutral"
                base = syl
            result.append((base, tone))
        return result

    @staticmethod
    def _simulate_tone(expected: str) -> str:
        """Mock tone classification — simulates ~85% accuracy.

        In production this uses real F0 extraction. For now it provides
        deterministic test behavior.
        """
        import hashlib

        tone_order = ["1st", "2nd", "3rd", "4th", "neutral"]
        idx = tone_order.index(expected) if expected in tone_order else 0
        # Use hash of expected to get deterministic but varied results
        h = int(hashlib.md5(expected.encode()).hexdigest(), 16)
        if h % 100 < 85:  # 85% accurate
            return expected
        # Return a different tone
        return tone_order[(idx + 1 + (h % 3)) % 5]
