# HanVerse Day 1 Plan — July 10, 2026

## Morning (9:00)
- [ ] Double-click "HanVerse Kickoff" on desktop
- [ ] Verify all 6 branches on GitHub
- [ ] Check Docker: `docker compose up -d`
- [ ] Run: `& .codex\monitor.ps1`

## Day 1 Tasks
1. Frontend: verify dev server runs (`npm run dev`)
2. Backend: verify NestJS starts (`npm run start:dev`)
3. AI Worker: verify Python imports + tests pass (`pytest`)
4. Database: verify PostgreSQL schema applies cleanly
5. Infra: verify Docker Compose all services healthy

## After Each Commit
- Git hook auto-sends Feishu notification
- Git hook auto-pushes to GitHub (if VPN on)

## Evening (18:00)
- Run monitor → Feishu daily report
- Check GitHub for any failed pushes
- Note blockers for Day 2

## Commands Reference
```
# Start all services
cd C:\Users\Administrator\Documents\language education app\docker
docker compose up -d

# Check progress
powershell .codex\monitor.ps1

# Push manually
powershell .codex\push-gui.ps1
```
