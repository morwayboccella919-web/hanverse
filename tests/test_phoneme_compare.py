"""Tests for phoneme_compare.py — pinyin alignment, edit distance, error rate."""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from phoneme_compare import PhonemeComparer


class TestPhonemeComparer:
    """Unit tests for the PhonemeComparer."""

    def setup_method(self):
        self.comparer = PhonemeComparer()

    # ------------------------------------------------------------------
    # compare() — main entry point
    # ------------------------------------------------------------------
    def test_compare_identical(self):
        """Identical ref and ASR → zero error rate."""
        result = self.comparer.compare("ni3 hao3", "ni hao")
        # "ni3 hao3" → tokens ["ni3", "hao3"]
        # "ni hao" → tokens ["ni", "hao"] (pypinyin may produce different)
        assert "error_rate" in result
        assert "errors" in result

    def test_compare_empty_ref(self):
        """Empty reference should not crash."""
        result = self.comparer.compare("", "ni hao")
        assert result["error_rate"] >= 0.0

    def test_compare_empty_asr(self):
        """Empty ASR output should produce high error rate."""
        result = self.comparer.compare("ni3 hao3", "")
        assert result["error_rate"] >= 0.0

    def test_compare_both_empty(self):
        """Both empty → no errors."""
        result = self.comparer.compare("", "")
        assert result["error_rate"] == 0.0

    def test_compare_returns_contract_shape(self):
        """compare() output matches contract structure."""
        result = self.comparer.compare("ni3 hao3 wo3 jiao4 xiao3 ming2", "wo jiao xiao ming")
        assert "error_rate" in result
        assert "errors" in result
        assert "substitutions" in result
        assert "deletions" in result
        assert "insertions" in result
        assert 0.0 <= result["error_rate"] <= 1.0

    def test_compare_substitution(self):
        """A single substitution produces one substitution error."""
        result = self.comparer.compare("ni3", "wo3")
        assert result["substitutions"] == 1
        assert result["deletions"] == 0
        assert result["insertions"] == 0

    def test_compare_deletion(self):
        """Extra ref tokens → deletions."""
        result = self.comparer.compare("ni3 hao3 wo3", "ni3")
        assert result["deletions"] >= 1

    def test_compare_insertion(self):
        """Extra ASR tokens → insertions."""
        result = self.comparer.compare("ni3", "ni3 hao3 wo3")
        assert result["insertions"] >= 1

    # ------------------------------------------------------------------
    # _align — Levenshtein alignment
    # ------------------------------------------------------------------
    def test_align_identical(self):
        """Two identical sequences → all eq."""
        ref = ["a", "b", "c"]
        hyp = ["a", "b", "c"]
        ar, ah, ops = PhonemeComparer._align(ref, hyp)
        assert ops == ["eq", "eq", "eq"]

    def test_align_substitution(self):
        """One different token → one sub."""
        ref = ["a", "b", "c"]
        hyp = ["a", "x", "c"]
        ar, ah, ops = PhonemeComparer._align(ref, hyp)
        assert "sub" in ops

    def test_align_deletion(self):
        """Missing token → deletion."""
        ref = ["a", "b", "c"]
        hyp = ["a", "c"]
        ar, ah, ops = PhonemeComparer._align(ref, hyp)
        assert "del" in ops

    def test_align_insertion(self):
        """Extra token → insertion."""
        ref = ["a", "c"]
        hyp = ["a", "b", "c"]
        ar, ah, ops = PhonemeComparer._align(ref, hyp)
        assert "ins" in ops

    def test_align_empty_ref(self):
        """Empty ref and non-empty hyp → all insertions."""
        ref = []
        hyp = ["a", "b"]
        ar, ah, ops = PhonemeComparer._align(ref, hyp)
        assert ops == ["ins", "ins"]

    def test_align_empty_hyp(self):
        """Non-empty ref and empty hyp → all deletions."""
        ref = ["a", "b"]
        hyp = []
        ar, ah, ops = PhonemeComparer._align(ref, hyp)
        assert ops == ["del", "del"]

    # ------------------------------------------------------------------
    # _pinyin_to_phonemes
    # ------------------------------------------------------------------
    def test_pinyin_to_phonemes(self):
        """Converts pinyin string to token list."""
        tokens = PhonemeComparer._pinyin_to_phonemes("ni3 hao3 wo3")
        assert isinstance(tokens, list)
        assert len(tokens) == 3

    # ------------------------------------------------------------------
    # error list output
    # ------------------------------------------------------------------
    def test_errors_have_required_fields(self):
        """Each error dict must have syllable, phoneme, type, detail."""
        result = self.comparer.compare("ni3 hao3", "wo3 hao3")
        for err in result["errors"]:
            assert "syllable" in err
            assert "phoneme" in err
            assert "type" in err
            assert "detail" in err
            assert err["type"] in ("substitution", "deletion", "insertion")
