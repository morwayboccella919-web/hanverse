# Git post-commit hook — auto notify Feishu
$webhook = "https://open.feishu.cn/open-apis/bot/v2/hook/18dd4a92-2788-4832-a6b3-b162c23246e8"
$signKey = "VBzJSfMwHvpNnnUWIbgw7d"

$branch = (git branch --show-current)
$commit = (git log --oneline -1)
$author = (git log -1 --format="%an")
$time = Get-Date -Format "HH:mm:ss"

$msg = "HanVerse [$branch]`n$commit`n`nby $author @ $time"

$ts = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
$stringToSign = "$ts`n$signKey"
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($stringToSign)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(""))
$sign = [Convert]::ToBase64String($hash)

$body = @{ timestamp="$ts"; sign=$sign; msg_type="text"; content=@{text=$msg} } | ConvertTo-Json -Depth 5
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$req = [System.Net.WebRequest]::Create($webhook)
$req.Method = "POST"
$req.ContentType = "application/json; charset=utf-8"
$req.ContentLength = $bodyBytes.Length
$req.GetRequestStream().Write($bodyBytes, 0, $bodyBytes.Length)
try { $req.GetResponse().Close() } catch {}
