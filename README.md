# HanVerse — AI Chinese Pronunciation Evaluation Engine

AI-powered Chinese speaking evaluation and scoring engine.
Users record speech → AI scores pronunciation/tone/fluency → HSK/CEFR report → practice weak points.

## Architecture

```
Next.js 14 (Frontend) → NestJS API → Redis Queue (BullMQ) → Python AI Worker
                                                                    ↓
                                                          Whisper + Scoring Engine + GPT
```

## Project Structure

```
language education app/          ← Main repo (contracts + infra)
├── contracts/                   ← Shared API contracts + DB schema
├── docker/                      ← Docker Compose for local dev
├── .codex/                      ← Codex automations
└── .github/workflows/           ← CI/CD

hanverse-worktrees/              ← Parallel development streams
├── frontend/                    ← Next.js 14 (codex/hanverse-frontend)
├── backend/                     ← NestJS API (codex/hanverse-backend)
├── ai-worker/                   ← Python Worker (codex/hanverse-ai-worker)
├── database/                    ← SQL + Migrations (codex/hanverse-database)
└── infra/                       ← DevOps (codex/hanverse-infra)
```

## Quick Start

```bash
# Start all services
cd docker
docker compose up -d

# Frontend: http://localhost:3001
# Backend:  http://localhost:3000
# Redis:    localhost:6379
# Postgres: localhost:5432
```

## Development Streams

| Stream | Branch | Tech | Key Files |
|--------|--------|------|-----------|
| Frontend | `codex/hanverse-frontend` | Next.js 14 + TypeScript + Tailwind | `hanverse-worktrees/frontend/` |
| Backend | `codex/hanverse-backend` | NestJS + BullMQ + Prisma | `hanverse-worktrees/backend/` |
| AI Worker | `codex/hanverse-ai-worker` | Python + librosa + Redis | `hanverse-worktrees/ai-worker/` |
| Database | `codex/hanverse-database` | PostgreSQL SQL | `hanverse-worktrees/database/` |
| Infra | `codex/hanverse-infra` | Docker + CI/CD | `hanverse-worktrees/infra/` |

## API Contract

See `contracts/api-contract.yaml` for the full Frontend ↔ Backend interface.
See `contracts/ai-worker-contract.yaml` for the Backend ↔ AI Worker interface.

## Pricing

Per-assessment pricing (no subscription):
- Free: 1 assessment/day
- Single: $0.99
- 5-Pack: $3.99
- 10-Pack: $7.99
- 30-Pack: $19.99
- 100-Pack: $49.99
