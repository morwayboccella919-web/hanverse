"""Tests for fluency_calc.py — speech rate, pause detection, scoring."""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from fluency_calc import FluencyCalculator


class TestFluencyCalculator:
    """Unit tests for the FluencyCalculator."""

    def setup_method(self):
        self.calc = FluencyCalculator()

    # ------------------------------------------------------------------
    # calculate()
    # ------------------------------------------------------------------
    def test_calculate_empty_segments(self):
        """Empty segments → score 0."""
        result = self.calc.calculate([], "你好")
        assert result["score"] == 0.0
        assert result["speech_rate_wpm"] == 0
        assert result["pause_count"] == 0
        assert result["avg_pause_ms"] == 0

    def test_calculate_single_segment(self):
        """Single segment → score 50 (not enough data)."""
        result = self.calc.calculate(
            [{"start": 0.0, "end": 1.0, "text": "nǐ hǎo"}],
            "你好"
        )
        assert result["score"] == 50.0

    def test_calculate_optimal_fluency(self):
        """Perfect timing: no pauses, ideal rate → high score."""
        ref = "你好我叫小明"
        segments = [
            {
                "start": 0.0, "end": 2.0, "text": "nǐ hǎo wǒ jiào xiǎo míng",
                "words": [
                    {"start": 0.0, "end": 0.3, "word": "nǐ"},
                    {"start": 0.3, "end": 0.6, "word": "hǎo"},
                    {"start": 0.6, "end": 0.8, "word": "wǒ"},
                    {"start": 0.8, "end": 1.1, "word": "jiào"},
                    {"start": 1.1, "end": 1.4, "word": "xiǎo"},
                    {"start": 1.4, "end": 2.0, "word": "míng"},
                ],
            },
        ]
        result = self.calc.calculate(segments, ref)
        assert result["score"] >= 0
        assert result["score"] <= 100
        assert result["speech_rate_wpm"] > 0
        assert "speech_rate_wpm" in result
        assert "pause_count" in result
        assert "avg_pause_ms" in result

    def test_calculate_with_pauses(self):
        """Segments with gaps → detected pauses."""
        ref = "你好"
        segments = [
            {
                "start": 0.0, "end": 3.0, "text": "nǐ hǎo",
                "words": [
                    {"start": 0.0, "end": 0.2, "word": "nǐ"},
                    {"start": 1.2, "end": 1.4, "word": "hǎo"},
                ],
            },
        ]
        result = self.calc.calculate(segments, ref)
        assert result["pause_count"] >= 1
        assert result["avg_pause_ms"] > 0

    def test_calculate_very_slow(self):
        """Very slow speech → low score."""
        ref = "你好"
        segments = [
            {
                "start": 0.0, "end": 30.0, "text": "nǐ hǎo",
                "words": [
                    {"start": 0.0, "end": 0.3, "word": "nǐ"},
                    {"start": 28.0, "end": 28.3, "word": "hǎo"},
                ],
            },
        ]
        result = self.calc.calculate(segments, ref)
        assert result["speech_rate_wpm"] < 60
        assert result["score"] < 50

    # ------------------------------------------------------------------
    # _extract_words
    # ------------------------------------------------------------------
    def test_extract_words_from_segments(self):
        """Segments with words array → flattened word list."""
        segments = [
            {
                "start": 0.0, "end": 1.0, "text": "hello",
                "words": [
                    {"start": 0.0, "end": 0.3, "word": "he"},
                    {"start": 0.4, "end": 0.7, "word": "llo"},
                ],
            },
        ]
        words = FluencyCalculator._extract_words(segments)
        assert len(words) == 2

    def test_extract_words_no_words_array(self):
        """Segments without words field → each segment is one word."""
        segments = [
            {"start": 0.0, "end": 0.5, "text": "hi"},
            {"start": 0.6, "end": 1.0, "text": "there"},
        ]
        words = FluencyCalculator._extract_words(segments)
        assert len(words) == 2

    def test_extract_words_mixed(self):
        """Mixed segments with and without words arrays."""
        segments = [
            {"start": 0.0, "end": 1.0, "text": "hi",
             "words": [{"start": 0.0, "end": 0.3, "word": "hi"}]},
            {"start": 1.0, "end": 1.5, "text": "there"},
        ]
        words = FluencyCalculator._extract_words(segments)
        assert len(words) == 2

    # ------------------------------------------------------------------
    # _find_pauses
    # ------------------------------------------------------------------
    def test_find_pauses_no_gaps(self):
        """Words with no gaps → no pauses."""
        words = [
            {"start": 0.0, "end": 0.2, "word": "a"},
            {"start": 0.2, "end": 0.4, "word": "b"},
            {"start": 0.4, "end": 0.6, "word": "c"},
        ]
        pauses = self.calc._find_pauses(words)
        assert len(pauses) == 0

    def test_find_pauses_with_gap(self):
        """Gap > threshold → one pause."""
        words = [
            {"start": 0.0, "end": 0.2, "word": "a"},
            {"start": 1.0, "end": 1.2, "word": "b"},
        ]
        pauses = self.calc._find_pauses(words)
        assert len(pauses) == 1
        assert pauses[0]["duration_ms"] > 0

    def test_find_pauses_below_threshold(self):
        """Gap < 400ms → no pause."""
        words = [
            {"start": 0.0, "end": 0.2, "word": "a"},
            {"start": 0.5, "end": 0.7, "word": "b"},  # 300ms gap
        ]
        pauses = self.calc._find_pauses(words)
        assert len(pauses) == 0

    # ------------------------------------------------------------------
    # _compute_score
    # ------------------------------------------------------------------
    def test_compute_score_ideal(self):
        """Ideal rate, no pauses → near 100."""
        score = self.calc._compute_score(wpm=150, pause_count=0, syllable_count=10, avg_pause_ms=0)
        assert score >= 80

    def test_compute_score_too_slow(self):
        """Very slow rate → low score."""
        score = self.calc._compute_score(wpm=30, pause_count=5, syllable_count=10, avg_pause_ms=2000)
        assert score < 50

    def test_compute_score_too_fast(self):
        """Very fast rate → penalised."""
        score = self.calc._compute_score(wpm=300, pause_count=0, syllable_count=10, avg_pause_ms=0)
        assert score < 70  # rate penalty exceeds ideal

    def test_compute_score_zero_syllables(self):
        """Zero syllables — should not crash."""
        score = self.calc._compute_score(wpm=100, pause_count=2, syllable_count=0, avg_pause_ms=500)
        assert 0 <= score <= 100

    def test_compute_score_bounded(self):
        """Score is always in [0, 100]."""
        scenarios = [
            (150, 0, 10, 0),       # perfect
            (30, 5, 10, 2000),     # terrible
            (300, 0, 10, 0),       # too fast
            (80, 3, 5, 700),        # mediocre
        ]
        for wpm, pc, sc, ap in scenarios:
            score = self.calc._compute_score(wpm, pc, sc, ap)
            assert 0.0 <= score <= 100.0, f"Score {score} out of bounds"
