# HanVerse Quick-Start Script
# Usage: .\docker\start.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HanVerse — Local Dev Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Docker is running
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running. Please start Docker Desktop first."
    }
} catch {
    Write-Host "ERROR: Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}
Write-Host "  Docker is running." -ForegroundColor Green

# 2. Ensure .env exists
Write-Host "[2/4] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  Created .env from .env.example (edit with real values before production use)" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No .env.example found. Create .env manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "  .env already exists." -ForegroundColor Green
}

# 3. Start services
Write-Host "[3/4] Starting services (docker compose up -d)..." -ForegroundColor Yellow
docker compose up -d --wait 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to start services. Check logs with: docker compose logs" -ForegroundColor Red
    exit 1
}
Write-Host "  Services started." -ForegroundColor Green

# 4. Print connection info
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HanVerse is running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Services:" -ForegroundColor White
Write-Host "    Backend API:  http://localhost:3000" -ForegroundColor White
Write-Host "    PostgreSQL:   postgresql://hanverse:hanverse_dev@localhost:5432/hanverse" -ForegroundColor White
Write-Host "    Redis:        redis://localhost:6379" -ForegroundColor White
Write-Host "      DB0: BullMQ Queue" -ForegroundColor DarkGray
Write-Host "      DB1: Session/API Cache" -ForegroundColor DarkGray
Write-Host "      DB2: Rate Limiter" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Commands:" -ForegroundColor White
Write-Host "    docker compose logs -f       # Tail all logs" -ForegroundColor DarkGray
Write-Host "    docker compose logs backend  # Backend logs only" -ForegroundColor DarkGray
Write-Host "    docker compose down          # Stop everything" -ForegroundColor DarkGray
Write-Host "    .\docker\start.ps1           # Restart" -ForegroundColor DarkGray
Write-Host ""
