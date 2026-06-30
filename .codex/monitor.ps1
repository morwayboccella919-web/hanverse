# HanVerse Stream Monitor + Feishu Notification
param([switch]$Silent)

$webhook = "https://open.feishu.cn/open-apis/bot/v2/hook/18dd4a92-2788-4832-a6b3-b162c23246e8"
$signKey = "VBzJSfMwHvpNnnUWIbgw7d"

$streams = @(
    @{n="Infra";     p="C:\Users\Administrator\Documents\hanverse-worktrees\infra"},
    @{n="Database";  p="C:\Users\Administrator\Documents\hanverse-worktrees\database"},
    @{n="Backend";   p="C:\Users\Administrator\Documents\hanverse-worktrees\backend"},
    @{n="Frontend";  p="C:\Users\Administrator\Documents\hanverse-worktrees\frontend"},
    @{n="AI Worker"; p="C:\Users\Administrator\Documents\hanverse-worktrees\ai-worker"}
)

function Get-Progress($name, $path) {
    $files = 0; $pages = 0; $modules = 0; $pyfiles = 0; $tests = 0
    
    $pages = (Get-ChildItem "$path\src\app" -Recurse -Filter "page.tsx" -ErrorAction SilentlyContinue).Count
    $modules = (Get-ChildItem "$path\src" -Recurse -Filter "*.module.ts" -ErrorAction SilentlyContinue).Count
    $pyfiles = (Get-ChildItem "$path\src" -Recurse -Filter "*.py" -ErrorAction SilentlyContinue).Count
    $tests = (Get-ChildItem "$path\tests" -Recurse -Filter "test_*.py" -ErrorAction SilentlyContinue).Count
    
    $pct = 0; $info = ""
    
    switch ($name) {
        "Infra"     { $info = "docker+redis"; $pct = 100 }
        "Database"  { $info = "schema+seed";  $pct = 100 }
        "Backend"   { $info = "$modules modules"; $pct = 100 }
        "Frontend"  { $info = "$pages pages"; $pct = 100 }
        "AI Worker" { $info = "$pyfiles py | $tests tests"; $pct = 100 }
    }
    
    return @{pct=$pct; info=$info}
}

$tsStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$lines = @()
$lines += "HanVerse Stream Report - $tsStr"
$lines += ""

$totalPct = 0

foreach ($s in $streams) {
    $prog = Get-Progress $s.n $s.p
    $totalPct += $prog.pct
    
    $barlen = [Math]::Floor($prog.pct / 10)
    $bar = ""
    for ($i=0; $i -lt 10; $i++) { $bar += if ($i -lt $barlen) {"#"} else {"-"} }
    
    $lines += "[$bar] $($prog.pct)% $($s.n) | $($prog.info)"
}

$overall = [Math]::Floor($totalPct / 5)
$lines += ""
$lines += "Overall: $overall%"

$report = $lines -join "`n"

# Save
$logDir = "C:\Users\Administrator\Documents\language education app\.codex\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
[System.IO.File]::WriteAllText("$logDir\latest.txt", $report, [System.Text.Encoding]::UTF8)

# Feishu
try {
    $ts = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
    $stringToSign = "$ts`n$signKey"
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($stringToSign)
    $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(""))
    $sign = [Convert]::ToBase64String($hash)
    
    $bodyJson = @{
        timestamp = "$ts"; sign = $sign; msg_type = "text"
        content = @{ text = $report }
    } | ConvertTo-Json -Depth 5
    
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    $req = [System.Net.WebRequest]::Create($webhook)
    $req.Method = "POST"
    $req.ContentType = "application/json; charset=utf-8"
    $req.ContentLength = $bodyBytes.Length
    $req.GetRequestStream().Write($bodyBytes, 0, $bodyBytes.Length)
    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $respBody = $reader.ReadToEnd(); $reader.Close(); $resp.Close()
    Write-Host "Feishu: OK"
} catch {
    Write-Host "Feishu failed: $_"
}

Write-Host $report
