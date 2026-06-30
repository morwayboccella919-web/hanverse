# Stream: Infra (codex/hanverse-infra)
# Responsibility: Docker Compose + Redis + Cloudflare R2 + CI/CD

## Tech Stack
- Docker + Docker Compose
- Redis 7 (Queue + Cache + Rate Limiter)
- PostgreSQL 16 (dev), Supabase (prod)
- Cloudflare R2 (audio + report storage)
- GitHub Actions (CI/CD)

## Tasks (Priority Order)
P0: Docker Compose orchestration (all 5 services)
P0: Redis configuration (Queue DB0 / Cache DB1 / RateLimit DB2)
P0: Cloudflare R2 bucket + Lifecycle Policy (7-day auto-delete)
P1: Supabase project setup + connection string
P1: GitHub Actions CI pipeline (lint + test + build)
P2: Environment variables template
P2: Production deployment config (Coolify / VPS)

## Docker Services
1. postgres — PostgreSQL 16 with auto-schema init
2. redis — Redis 7 for Queue + Cache
3. backend — NestJS API
4. ai-worker — Python Worker
5. (frontend runs separately via npm run dev)

## Redis Namespace
DB0: BullMQ Queue (assessment + practice jobs)
DB1: Session cache + API response cache
DB2: Rate limiter counters

## R2 Lifecycle Policy
Audio files: delete after 7 days
Reports: keep indefinitely (or until user deletion)
Share cards: keep until user deletion

## Convention
Branch: codex/hanverse-infra
Provide connection URLs as output for other streams
Never depend on other streams being "done"
