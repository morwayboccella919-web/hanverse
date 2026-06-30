# HanVerse Parallel Development Automations

## Streams

### 1. Daily Infra Check (9:00)
- Trigger: Daily at 9:00 AM Asia/Shanghai
- Action: Check C:\Users\Administrator\Documents\hanverse-worktrees\infra status
- Task: Continue Docker Compose setup, verify Redis/Postgres connectivity
- Goal: Docker compose up works without errors

### 2. Daily Database Check (9:05)
- Trigger: Daily at 9:05 AM Asia/Shanghai
- Action: Check C:\Users\Administrator\Documents\hanverse-worktrees\database status
- Task: Continue schema refinement, fill HSK seed data
- Goal: All 6 tables created, HSK1-4 seed data complete

### 3. Daily Backend Check (9:10)
- Trigger: Daily at 9:10 AM Asia/Shanghai
- Action: Check C:\Users\Administrator\Documents\hanverse-worktrees\backend status
- Task: Continue NestJS module implementation, run npm test
- Goal: All API endpoints return proper responses

### 4. Daily Frontend Check (9:15)
- Trigger: Daily at 9:15 AM Asia/Shanghai
- Action: Check C:\Users\Administrator\Documents\hanverse-worktrees\frontend status
- Task: Continue Next.js page development, test with Mock API
- Goal: All 6 pages render correctly

### 5. Daily AI Worker Check (9:20)
- Trigger: Daily at 9:20 AM Asia/Shanghai
- Action: Check C:\Users\Administrator\Documents\hanverse-worktrees\ai-worker status
- Task: Continue Python scoring engine, run pytest
- Goal: All scoring modules pass unit tests

### 6. Daily Integration Gate (18:00)
- Trigger: Daily at 6:00 PM Asia/Shanghai
- Action: Check all 5 worktrees for new commits
- Task: Verify contract consistency across streams
- Output: Daily progress summary

## Independent Stream Rules
1. Frontend: Mock ALL API calls. Never block on backend.
2. Backend: Test with curl/Postman. Never block on frontend.
3. AI Worker: Test with fake audio files. Never block on real user data.
4. Database: Run SQL directly. Never block on ORM.
5. Infra: Docker Compose is the only truth. Never block on code.
