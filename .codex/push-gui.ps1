Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "HanVerse GitHub Push"
$form.Size = New-Object System.Drawing.Size(520, 420)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)

# Title
$title = New-Object System.Windows.Forms.Label
$title.Text = "HanVerse GitHub Push"
$title.Font = New-Object System.Drawing.Font("Microsoft YaHei", 14, [System.Drawing.FontStyle]::Bold)
$title.Size = New-Object System.Drawing.Size(480, 30)
$title.Location = New-Object System.Drawing.Point(20, 15)
$form.Controls.Add($title)

# Subtitle
$sub = New-Object System.Windows.Forms.Label
$sub.Text = "morwayboccella919-web/hanverse"
$sub.ForeColor = [System.Drawing.Color]::Gray
$sub.Size = New-Object System.Drawing.Size(480, 20)
$sub.Location = New-Object System.Drawing.Point(20, 45)
$form.Controls.Add($sub)

# Status box
$box = New-Object System.Windows.Forms.RichTextBox
$box.Size = New-Object System.Drawing.Size(460, 200)
$box.Location = New-Object System.Drawing.Point(20, 75)
$box.Font = New-Object System.Drawing.Font("Consolas", 9)
$box.ReadOnly = $true
$box.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$box.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($box)

function Write-Box($text) {
    $box.AppendText("$text`n")
    $box.ScrollToCaret()
}

# Refresh button
$refreshBtn = New-Object System.Windows.Forms.Button
$refreshBtn.Text = "Refresh Status"
$refreshBtn.Size = New-Object System.Drawing.Size(140, 35)
$refreshBtn.Location = New-Object System.Drawing.Point(20, 290)
$refreshBtn.Add_Click({
    $box.Clear()
    $repo = "C:\Users\Administrator\Documents\language education app"
    $branches = @("master", "codex/hanverse-frontend", "codex/hanverse-backend", "codex/hanverse-ai-worker", "codex/hanverse-database", "codex/hanverse-infra")
    
    Write-Box "=== Git Branches ==="
    foreach ($b in $branches) {
        $log = (git -C $repo log --oneline -1 $b 2>&1)
        $ahead = (git -C $repo rev-list --count origin/$b..$b 2>&1)
        if ($LASTEXITCODE -ne 0) { $ahead = "not pushed" }
        $icon = if ($ahead -eq "0") { "[OK]" } else { "[>>]" }
        Write-Box "$icon $b | $log | ahead: $ahead"
    }
    
    Write-Box ""
    Write-Box "Tip: VPN on = push works. VPN off = blocked."
})
$form.Controls.Add($refreshBtn)

# Push All button
$pushBtn = New-Object System.Windows.Forms.Button
$pushBtn.Text = "Push All to GitHub"
$pushBtn.Size = New-Object System.Drawing.Size(160, 35)
$pushBtn.Location = New-Object System.Drawing.Point(170, 290)
$pushBtn.BackColor = [System.Drawing.Color]::FromArgb(46, 160, 67)
$pushBtn.ForeColor = [System.Drawing.Color]::White
$pushBtn.Add_Click({
    $box.Clear()
    $repo = "C:\Users\Administrator\Documents\language education app"
    $branches = @("master", "codex/hanverse-frontend", "codex/hanverse-backend", "codex/hanverse-ai-worker", "codex/hanverse-database", "codex/hanverse-infra")
    
    Write-Box "Pushing all branches..."
    Write-Box ""
    
    foreach ($b in $branches) {
        Write-Box ">>> $b"
        $result = (git -C $repo push origin $b 2>&1)
        Write-Box $result
        Write-Box ""
    }
    
    Write-Box "--- Done ---"
    
    # Also try to refresh status
    $box.AppendText("`n=== Updated Status ===`n")
    foreach ($b in $branches) {
        $log = (git -C $repo log --oneline -1 $b 2>&1)
        $ahead = (git -C $repo rev-list --count origin/$b..$b 2>&1)
        if ($LASTEXITCODE -ne 0) { $ahead = "?" }
        $icon = if ($ahead -eq "0") { "[OK]" } else { "[>>]" }
        Write-Box "$icon $b | $log | ahead: $ahead"
    }
})
$form.Controls.Add($pushBtn)

# Push Master only
$pushMasterBtn = New-Object System.Windows.Forms.Button
$pushMasterBtn.Text = "Push Master Only"
$pushMasterBtn.Size = New-Object System.Drawing.Size(140, 35)
$pushMasterBtn.Location = New-Object System.Drawing.Point(340, 290)
$pushMasterBtn.Add_Click({
    $box.Clear()
    Write-Box "Pushing master..."
    $result = (git -C "C:\Users\Administrator\Documents\language education app" push origin master 2>&1)
    Write-Box $result
})
$form.Controls.Add($pushMasterBtn)

# Initial load
$refreshBtn.PerformClick()

$form.ShowDialog() | Out-Null
