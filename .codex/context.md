# Stream: Frontend (codex/hanverse-frontend)
# Responsibility: Next.js 14 UI + Mock API + Page Components

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- State: Zustand
- Charts: ECharts

## API Contract
Read contracts/api-contract.yaml — shared in main repo.
All API calls use Mock layer initially. Real integration in Day 4-5.

## Tasks (Priority Order)
P0: Scaffold Next.js + TypeScript + Tailwind + shadcn/ui
P0: Implement Mock API layer (src/lib/mock-api.ts)
P1: Landing Page
P1: Question Selection + Recording Page
P1: Waiting/Processing Page (polling animation)
P1: Report Page (ECharts visualization)
P1: Practice Page (discrimination/shadowing/fluency)
P2: Stripe Payment integration

## Routes
/ → Landing
/questions → Select sentence to read
/record/:questionId → Recording + upload
/waiting/:assessmentId → Polling status
/report/:assessmentId → Full report
/practice/:practiceId → Practice tasks
/payment → Credit packages

## Mock Strategy
Create src/lib/mock-api.ts that intercepts all fetch calls.
Use contracts/api-contract.yaml for response shape.

## Convention
Branch: codex/hanverse-frontend
Never edit contracts/ — those live in main repo master
Never depend on other streams being "done"
