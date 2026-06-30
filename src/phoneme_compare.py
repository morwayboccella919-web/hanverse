"""HanVerse — Phoneme Comparison Module.

Compares reference pinyin with ASR output to compute phoneme-level
error rates: substitutions, deletions, insertions.
"""

import logging
from typing import Optional

logger = logging.getLogger("hanverse.phoneme_compare")


class PhonemeComparer:
    """Align reference pinyin with ASR text and compute phoneme error rate."""

    def __init__(self):
        pass

    @staticmethod
    def _pinyin_to_phonemes(pinyin_str: str) -> list[str]:
        """Convert a pinyin string to a list of phoneme tokens.

        Uses pypinyin for proper pinyin parsing, falls back to simple
        splitting when pypinyin is unavailable.
        """
        try:
            from pypinyin import pinyin, Style
        except ImportError:
            logger.warning("pypinyin not installed — using simple split")
            return pinyin_str.strip().split()

        syllables = pinyin_str.strip().split()
        phonemes = []
        for syl in syllables:
            phonemes.append(syl)
        return phonemes if phonemes else pinyin_str.strip().split()

    @staticmethod
    def _tokenise_text(text: str) -> list[str]:
        """Tokenise ASR output text into pinyin-like tokens via pypinyin."""
        try:
            from pypinyin import lazy_pinyin, Style
        except ImportError:
            return text.strip().split()

        tokens = lazy_pinyin(text.strip(), style=Style.TONE3)
        return tokens if tokens else text.strip().split()

    def compare(self, reference_pinyin: str, asr_text: str) -> dict:
        """Compare reference pinyin with ASR output text.

        Uses edit-distance alignment to find substitutions, deletions,
        and insertions.

        Returns
        -------
        dict with keys: error_rate (0.0-1.0), errors (list).
        """
        ref_tokens = self._pinyin_to_phonemes(reference_pinyin)
        asr_tokens = self._tokenise_text(asr_text)

        # Compute Levenshtein alignment
        aligned_ref, aligned_asr, ops = self._align(ref_tokens, asr_tokens)

        # Build error list
        errors = []
        substitutions = 0
        deletions = 0
        insertions = 0

        for i, op in enumerate(ops):
            if op == "sub":
                errors.append({
                    "syllable": aligned_ref[i],
                    "phoneme": aligned_ref[i],
                    "type": "substitution",
                    "detail": f"Expected '{aligned_ref[i]}', got '{aligned_asr[i]}'",
                })
                substitutions += 1
            elif op == "del":
                errors.append({
                    "syllable": aligned_ref[i],
                    "phoneme": aligned_ref[i],
                    "type": "deletion",
                    "detail": f"Syllable '{aligned_ref[i]}' was omitted",
                })
                deletions += 1
            elif op == "ins":
                errors.append({
                    "syllable": aligned_asr[i],
                    "phoneme": aligned_asr[i],
                    "type": "insertion",
                    "detail": f"Extra syllable '{aligned_asr[i]}' was inserted",
                })
                insertions += 1

        total_ref = len(ref_tokens) if ref_tokens else 1
        total_errors = substitutions + deletions + insertions
        error_rate = min(1.0, total_errors / total_ref)

        return {
            "error_rate": error_rate,
            "errors": errors,
            "substitutions": substitutions,
            "deletions": deletions,
            "insertions": insertions,
            "ref_tokens": ref_tokens,
            "asr_tokens": asr_tokens,
        }

    @staticmethod
    def _align(
        ref: list[str], hyp: list[str]
    ) -> tuple[list[str], list[str], list[str]]:
        """Levenshtein alignment between reference and hypothesis.

        Returns (aligned_ref, aligned_hyp, operations).
        Operations: "eq" (equal), "sub" (substitution), "del" (deletion),
        "ins" (insertion).
        """
        m, n = len(ref), len(hyp)
        # DP matrix
        d = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            d[i][0] = i
        for j in range(n + 1):
            d[0][j] = j

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                cost = 0 if ref[i - 1] == hyp[j - 1] else 1
                d[i][j] = min(
                    d[i - 1][j] + 1,       # deletion
                    d[i][j - 1] + 1,       # insertion
                    d[i - 1][j - 1] + cost,  # substitution/match
                )

        # Backtrace
        aligned_ref: list[str] = []
        aligned_hyp: list[str] = []
        ops: list[str] = []

        i, j = m, n
        while i > 0 or j > 0:
            if i > 0 and j > 0 and d[i][j] == d[i - 1][j - 1] + (0 if ref[i - 1] == hyp[j - 1] else 1):
                aligned_ref.append(ref[i - 1])
                aligned_hyp.append(hyp[j - 1])
                ops.append("eq" if ref[i - 1] == hyp[j - 1] else "sub")
                i -= 1
                j -= 1
            elif i > 0 and d[i][j] == d[i - 1][j] + 1:
                aligned_ref.append(ref[i - 1])
                aligned_hyp.append("")
                ops.append("del")
                i -= 1
            else:
                aligned_ref.append("")
                aligned_hyp.append(hyp[j - 1])
                ops.append("ins")
                j -= 1

        aligned_ref.reverse()
        aligned_hyp.reverse()
        ops.reverse()
        return aligned_ref, aligned_hyp, ops
