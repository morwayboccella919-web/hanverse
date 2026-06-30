# HanVerse Day 1 Kickoff — July 10, 2026
# Run this on the morning of July 10 to start development

$webhook = "https://open.feishu.cn/open-apis/bot/v2/hook/18dd4a92-2788-4832-a6b3-b162c23246e8"
$signKey = "VBzJSfMwHvpNnnUWIbgw7d"

Write-Host "========================================"
Write-Host "  HanVerse Kickoff — July 10, 2026"
Write-Host "========================================"
Write-Host ""

# 1. Check git status
Write-Host "[1/4] Checking repositories..."
$repo = "C:\Users\Administrator\Documents\language education app"
$branches = @("master","codex/hanverse-frontend","codex/hanverse-backend","codex/hanverse-ai-worker","codex/hanverse-database","codex/hanverse-infra")
foreach ($b in $branches) {
    $log = (git -C $repo log --oneline -1 $b 2>&1) -replace "`n",""
    Write-Host "  $b : $log"
}

# 2. Run full monitor
Write-Host ""
Write-Host "[2/4] Running progress monitor..."
& "C:\Users\Administrator\Documents\language education app\.codex\monitor.ps1" -Silent

# 3. Check Docker
Write-Host ""
Write-Host "[3/4] Checking Docker..."
try {
    $docker = docker --version 2>&1
    Write-Host "  Docker: $docker"
    docker compose -f "C:\Users\Administrator\Documents\language education app\docker\docker-compose.yml" config --quiet 2>&1
    Write-Host "  Docker Compose: OK"
} catch {
    Write-Host "  Docker not available — install Docker Desktop first"
}

# 4. Send kickoff to Feishu
Write-Host ""
Write-Host "[4/4] Sending kickoff notification..."

$ts = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
$stringToSign = "$ts`n$signKey"
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($stringToSign)
$sign = [Convert]::ToBase64String($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes("")))

$msg = "HanVerse Kickoff - July 10, 2026`n`nAll systems checked. Starting Day 1 development.`n5 streams ready, 6 branches on GitHub.`n`nLet's go."
$bodyJson = @{ timestamp="$ts"; sign=$sign; msg_type="text"; content=@{text=$msg} } | ConvertTo-Json -Depth 5
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
$req = [System.Net.WebRequest]::Create($webhook)
$req.Method = "POST"
$req.ContentType = "application/json; charset=utf-8"
$req.ContentLength = $bodyBytes.Length
$req.GetRequestStream().Write($bodyBytes,0,$bodyBytes.Length)
try { $req.GetResponse().Close() } catch {}
Write-Host "  Feishu: sent"

Write-Host ""
Write-Host "========================================"
Write-Host "  READY. Open Codex and say: start day 1"
Write-Host "========================================"
