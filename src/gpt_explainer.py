"""HanVerse — GPT Explanation Module.

Generates natural-language feedback about pronunciation errors.
GPT is used ONLY for explanation — NEVER for scoring.
All scores come from deterministic algorithms in scoring_engine.py.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger("hanverse.gpt_explainer")


class GPTExplainer:
    """OpenAI GPT client that explains learner errors in plain language.

    Invariant: GPT never participates in scoring. It receives finalised
    scores, error lists, and produces pedagogical explanations only.
    """

    SYSTEM_PROMPT = """You are a Mandarin Chinese pronunciation coach.
Given a reference sentence, a list of pronunciation errors the learner made,
and their estimated HSK level, explain:
1. What went wrong with each error (in simple terms)
2. How to fix it (tongue position, tone contour, etc.)
3. One practice tip

Rules:
- Write in a friendly, encouraging tone
- Be concise (3-6 sentences total)
- Use pinyin with tone marks for examples
- Match your explanation level to the learner's HSK level
- NEVER mention scores or numerical ratings — just explain the errors
"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    def explain(
        self,
        reference_text: str,
        error_phonemes: dict,
        hsk_level: str,
    ) -> str:
        """Generate a natural-language explanation of pronunciation errors.

        Parameters
        ----------
        reference_text : str
            The sentence the user attempted (汉字).
        error_phonemes : dict
            Contract-compliant error list with 'tone' and 'pronunciation' keys.
        hsk_level : str
            Estimated HSK level, e.g. "HSK3".

        Returns
        -------
        str — A paragraph explaining errors and how to improve.
        """
        if not self.api_key:
            logger.warning("No OpenAI API key — returning mock explanation")
            return self._mock_explain(reference_text, error_phonemes)

        try:
            return self._api_explain(reference_text, error_phonemes, hsk_level)
        except Exception as exc:
            logger.exception("GPT API call failed: %s", exc)
            return self._mock_explain(reference_text, error_phonemes)

    def _api_explain(
        self,
        reference_text: str,
        error_phonemes: dict,
        hsk_level: str,
    ) -> str:
        """Call OpenAI GPT API for explanation."""
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key)

        errors_text = self._format_errors(error_phonemes)
        user_prompt = (
            f"Reference sentence: {reference_text}\n"
            f"Learner errors:\n{errors_text}\n"
            f"Learner HSK level: {hsk_level}\n\n"
            "Explain what went wrong and how to improve (no scores or ratings)."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=300,
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    @staticmethod
    def _format_errors(error_phonemes: dict) -> str:
        """Format error_phonemes dict into human-readable text for the prompt."""
        lines = []

        tone_errors = error_phonemes.get("tone", [])
        if tone_errors:
            lines.append("Tone errors:")
            for e in tone_errors:
                lines.append(
                    f"  - {e.get('syllable','?')}: "
                    f"expected {e.get('expected','?')} tone, "
                    f"got {e.get('actual','?')} tone"
                )

        pron_errors = error_phonemes.get("pronunciation", [])
        if pron_errors:
            lines.append("Pronunciation errors:")
            for e in pron_errors:
                lines.append(
                    f"  - {e.get('syllable','?')}: "
                    f"{e.get('type','?')} — {e.get('detail','?')}"
                )

        if not lines:
            lines.append("No errors — excellent pronunciation!")

        return "\n".join(lines)

    @staticmethod
    def _mock_explain(reference_text: str, error_phonemes: dict) -> str:
        """Generate a deterministic mock explanation without calling the API."""
        tone_errors = error_phonemes.get("tone", [])
        pron_errors = error_phonemes.get("pronunciation", [])

        if not tone_errors and not pron_errors:
            return (
                f"Great job! Your pronunciation of \"{reference_text}\" "
                "is very clear. Keep practising to maintain your accuracy."
            )

        parts = [f"For the sentence \"{reference_text}\":"]

        if tone_errors:
            for e in tone_errors[:2]:
                syl = e.get("syllable", "")
                exp = e.get("expected", "")
                act = e.get("actual", "")
                parts.append(
                    f"Pay attention to the tone on '{syl}' — "
                    f"you used a {act} tone instead of the expected {exp} tone."
                )

        if pron_errors:
            for e in pron_errors[:2]:
                syl = e.get("syllable", "")
                detail = e.get("detail", "")
                parts.append(f"Try to articulate '{syl}' more clearly.")

        if tone_errors:
            parts.append(
                "Practise tone pairs (e.g. mā-má-mǎ-mà) "
                "to build muscle memory for pitch changes."
            )
        if pron_errors:
            parts.append(
                "Slow down and practise syllable by syllable, "
                "focusing on the correct initial and final sounds."
            )

        return " ".join(parts)
