# Stream: Backend (codex/hanverse-backend)
# Responsibility: NestJS API + Auth + Business Logic + Redis Queue

## Tech Stack
- NestJS + TypeScript
- Prisma ORM (PostgreSQL)
- BullMQ (Redis Queue)
- JWT Auth

## API Contract
Implement: contracts/api-contract.yaml
Push to: contracts/ai-worker-contract.yaml (assessment_job structure)

## Tasks (Priority Order)
P0: Scaffold NestJS + TypeScript + Prisma
P0: Auth Module (email OAuth + JWT)
P0: Question Bank Module (CRUD + seed data loader)
P0: Assessment Module (POST upload / GET status / GET report / history)
P1: Practice Module (generate from assessment / submit / result)
P1: Streak Middleware (check last_active_date on each request)
P1: CostGovern Middleware (credit check + rate limit + IP abuse)
P1: Payment Module (Stripe Session + Webhook)
P2: BullMQ Queue integration (push assessment_job to Redis)

## Database
Schema: contracts/db-schema.sql (shared)
Connection: DATABASE_URL from env

## Queue Contract
When assessment is created → push to Redis queue "assessment:queue"
Job structure: assessment_job from contracts/ai-worker-contract.yaml
Worker response: reads back from PostgreSQL assessments table

## Convention
Branch: codex/hanverse-backend
Never depend on Frontend being done — return proper API responses
Test with curl / Postman, not waiting for UI
