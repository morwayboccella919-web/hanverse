# Stream: AI Worker (codex/hanverse-ai-worker)
# Responsibility: Python Scoring Engine + AI Pipeline

## Tech Stack
- Python 3.12
- librosa (F0 extraction, tone classification)
- pypinyin (phoneme alignment)
- redis-py (queue consumer)
- psycopg2 (PostgreSQL)
- OpenAI SDK (Whisper ASR + GPT explanation)

## Contract
Implement: contracts/ai-worker-contract.yaml
Consumes from: Redis Queue "assessment:queue" and "practice:queue"

## Tasks (Priority Order)
P0: Scaffold Python Worker (Redis consumption loop + supervisor)
P0: Tone Classification Module (librosa F0 → discrete 4-tone bucketing + speaker normalization)
P0: Phoneme Compare Module (pypinyin alignment vs ASR output)
P0: Fluency Calc Module (speech rate + pause analysis from ASR timestamps)
P1: Whisper API integration
P1: GPT Explanation Module (only explains errors, does NOT score)
P1: Practice Generator (error_phonemes → practice tasks)
P2: pytest unit tests for scoring accuracy

## Scoring Algorithm
pronunciation = phoneme_error_rate → map to 0-100
tone = discrete_tone_accuracy → map to 0-100
fluency = speech_rate + pause_score → map to 0-100
overall = 0.4*pronunciation + 0.3*tone + 0.3*fluency

## HSK Mapping
90-100 → HSK5-6 / C1-C2
75-89 → HSK4 / B2
60-74 → HSK3 / B1
40-59 → HSK2 / A2
0-39 → HSK1 / A1

## GPT Role
ONLY generates explanation text. Never participates in scoring.
Input: reference_text + error list + hsk_level
Output: natural language tips for improvement

## Convention
Branch: codex/hanverse-ai-worker
Test with fake audio + reference text, not waiting for real backend
Never depend on Frontend or Backend being "done"
