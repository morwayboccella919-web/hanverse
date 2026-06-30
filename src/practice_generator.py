"""HanVerse — Practice Generator.

Generates targeted practice tasks from the error list produced during
assessment. Tasks include tone discrimination, shadowing, and fluency drills.
"""

import hashlib
import logging
import random
from typing import Optional

logger = logging.getLogger("hanverse.practice_generator")

# ---------------------------------------------------------------------------
# Tone pair templates for discrimination tasks
# ---------------------------------------------------------------------------
TONE_PAIRS = {
    ("1st", "2nd"): ({"pinyin": "mā", "tone": "1st"}, {"pinyin": "má", "tone": "2nd"}),
    ("1st", "3rd"): ({"pinyin": "mā", "tone": "1st"}, {"pinyin": "mǎ", "tone": "3rd"}),
    ("1st", "4th"): ({"pinyin": "mā", "tone": "1st"}, {"pinyin": "mà", "tone": "4th"}),
    ("2nd", "3rd"): ({"pinyin": "má", "tone": "2nd"}, {"pinyin": "mǎ", "tone": "3rd"}),
    ("2nd", "4th"): ({"pinyin": "má", "tone": "2nd"}, {"pinyin": "mà", "tone": "4th"}),
    ("3rd", "4th"): ({"pinyin": "mǎ", "tone": "3rd"}, {"pinyin": "mà", "tone": "4th"}),
}


class PracticeGenerator:
    """Generate practice tasks from assessment error lists."""

    MAX_TASKS = 6

    def generate(
        self,
        assessment_id: str,
        error_phonemes: dict,
        reference_text: str,
    ) -> list[dict]:
        """Generate practice tasks from an error list.

        Parameters
        ----------
        assessment_id : str
            UUID of the assessment this practice is based on.
        error_phonemes : dict
            Error list with 'tone' and 'pronunciation' keys.
        reference_text : str
            The original sentence the user was asked to read.

        Returns
        -------
        list[dict] — Each dict has type, instruction, options, answer, syllable.
        """
        tasks: list[dict] = []
        rng = self._seeded_rng(assessment_id)

        tone_errors = error_phonemes.get("tone", [])
        pron_errors = error_phonemes.get("pronunciation", [])

        # --- Tone discrimination tasks ---
        for err in tone_errors[:3]:
            tasks.append(self._build_discrimination(err, rng))

        # --- Shadowing tasks ---
        for err in tone_errors[:3]:
            syl = err.get("syllable", "")
            if syl:
                tasks.append(self._build_shadowing(syl, err.get("expected", "1st")))

        # --- Fluency task ---
        if reference_text:
            tasks.append(self._build_fluency(reference_text))

        # --- Shadowing for pronunciation errors ---
        for err in pron_errors[:2]:
            syl = err.get("syllable", "")
            if syl:
                tasks.append({
                    "type": "shadowing",
                    "instruction": (
                        f"Listen and repeat the syllable '{syl}'. "
                        f"Focus on clear articulation: {err.get('detail', '')}"
                    ),
                    "syllable": syl,
                })

        # Limit total tasks
        return tasks[: self.MAX_TASKS]

    # ------------------------------------------------------------------
    # Task builders
    # ------------------------------------------------------------------

    @staticmethod
    def _build_discrimination(err: dict, rng: random.Random) -> dict:
        """Build a tone discrimination (multiple choice) task."""
        expected = err.get("expected", "1st")
        actual = err.get("actual", "neutral")
        syl = err.get("syllable", "ma")

        # Pick a distracter pair containing the learner's actual tone
        pair_key = tuple(sorted([expected, actual]))
        pair = TONE_PAIRS.get(pair_key)
        if not pair:
            # Find any pair containing expected or actual
            for k, v in TONE_PAIRS.items():
                if expected in k or actual in k:
                    pair = v
                    break

        if pair:
            options = [
                f"{pair[0]['pinyin']} ({pair[0]['tone']} tone)",
                f"{pair[1]['pinyin']} ({pair[1]['tone']} tone)",
            ]
            answer = next(
                o for o in options if o.endswith(f"({expected} tone)")
            )
        else:
            options = [f"{syl} ({expected} tone)", f"{syl} ({actual} tone)"]
            answer = options[0]

        # Shuffle options
        shuffled = options[:]
        rng.shuffle(shuffled)

        return {
            "type": "discrimination",
            "instruction": (
                f"Listen to the syllable '{syl}'. "
                f"Which tone do you hear?"
            ),
            "options": shuffled,
            "answer": answer,
            "syllable": syl,
        }

    @staticmethod
    def _build_shadowing(syllable: str, expected_tone: str) -> dict:
        """Build a shadowing (listen and repeat) task."""
        tone_map = {"1st": "mā", "2nd": "má", "3rd": "mǎ", "4th": "mà", "neutral": "ma"}
        example = tone_map.get(expected_tone, "mā")

        return {
            "type": "shadowing",
            "instruction": (
                f"Listen and repeat after the speaker. "
                f"Focus on the {expected_tone} tone of '{syllable}'. "
                f"Example pattern: {example}"
            ),
            "syllable": syllable,
        }

    @staticmethod
    def _build_fluency(reference_text: str) -> dict:
        """Build a fluency (read-aloud) task."""
        return {
            "type": "fluency",
            "instruction": (
                f"Read the full sentence aloud at a natural pace: "
                f"\"{reference_text}\". Try to keep speech smooth "
                "with minimal pauses between words."
            ),
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _seeded_rng(seed: str) -> random.Random:
        """Create a deterministic RNG from a string seed."""
        h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
        return random.Random(h)
