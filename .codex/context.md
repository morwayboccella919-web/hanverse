# Stream: Database (codex/hanverse-database)
# Responsibility: PostgreSQL Schema + Seed Data + Migrations

## Tech Stack
- PostgreSQL 16
- SQL (raw) for schema definition
- Prisma migration (optional, for ORM usage by Backend)

## Output
Schema file: contracts/db-schema.sql (shared, but developed here)
Seed data: HSK1-4 question bank (30+ sentences each level)
Migration scripts for version tracking

## Tasks (Priority Order)
P0: Finalize SQL Schema (users / questions / assessments / practices / orders / share_cards / audit_logs)
P0: HSK1 seed data (30 sentences with pinyin + tone distribution)
P0: HSK2 seed data (30 sentences)
P0: HSK3 seed data (30 sentences)
P0: HSK4 seed data (30 sentences)
P1: Index optimization (analyze query patterns)
P1: Migration scripts (versioned SQL files)
P2: Performance test with 100K+ rows

## Tables
1. users — auth, credits, streak, xp
2. questions — question bank with pinyin + tone distribution
3. assessments — scoring results + error details
4. practices — practice tasks + scores
5. orders — Stripe payment records
6. share_cards — generated share images
7. audit_logs — compliance tracking

## Convention
Branch: codex/hanverse-database
Worktree: hanverse-worktrees/database/
Schema is source of truth — all other streams read from it
