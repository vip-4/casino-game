# deploy.ps1 - publish the h5-game-geo-router Worker (module + bindings)
#
# The Worker fronts every *.vip01.cc.cd / *.us.ci / *.cc.cd / *.indevs.in / *.ccwu.cc zone
# in the account and routes each request to a regional Pages origin.
#
# Run:
#   $env:CLOUDFLARE_API_TOKEN  = "<token>"
#   $env:CLOUDFLARE_ACCOUNT_ID = "33717d3e6845f08352ee14d9d672e273"
#   powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/deploy.ps1
#
# Optional: -RemoveBinding <name> drops a binding from the published script.
#   powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/deploy.ps1 -RemoveBinding ENABLE_CACHE_API
#
# The script reads the CURRENT bindings from the API and only overrides what changed,
# so KV namespace ids / R2 bucket names / geo settings are never lost.

param(
  [string[]]$RemoveBinding = @()
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$tok = if ($env:CLOUDFLARE_API_TOKEN) { $env:CLOUDFLARE_API_TOKEN } else { '' }
$acc = if ($env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID } else { '' }
if (-not $tok -or -not $acc) {
  Write-Output 'Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID first.'
  exit 1
}

$name = 'h5-game-geo-router'
$src  = Join-Path $root ($name + '.js')
if (-not (Test-Path $src)) { Write-Output "Missing $src"; exit 1 }

$api = "https://api.cloudflare.com/client/v4/accounts/$acc/workers/scripts/$name"

Write-Output '=== read current settings ==='
$s = curl.exe -s "$api/settings" -H "Authorization: Bearer $tok"
$sj = (($s -join "`n")) | ConvertFrom-Json
if (-not $sj.success) { Write-Output (($s -join ' ') -replace "`r?`n", ' '); exit 1 }
$st = $sj.result

$bindings = @()
foreach ($b in $st.bindings) {
  if ($RemoveBinding -contains $b.name) {
    Write-Output ('  - removing binding: ' + $b.name)
    continue
  }
  if ($b.type -eq 'plain_text') {
    $bindings += @{ name = $b.name; type = 'plain_text'; text = [string]$b.text }
  } elseif ($b.type -eq 'kv_namespace') {
    $bindings += @{ name = $b.name; type = 'kv_namespace'; namespace_id = $b.namespace_id }
  } elseif ($b.type -eq 'r2_bucket') {
    $bindings += @{ name = $b.name; type = 'r2_bucket'; bucket_name = $b.bucket_name }
  } else {
    $bindings += $b
  }
}
Write-Output ('  bindings: ' + $bindings.Count)

$meta = [ordered]@{
  main_module         = 'index.js'
  compatibility_date  = $st.compatibility_date
  compatibility_flags = @($st.compatibility_flags)
  usage_model         = $st.usage_model
  bindings            = $bindings
}
$metaFile = Join-Path $root '_meta.json'
[IO.File]::WriteAllText($metaFile, ($meta | ConvertTo-Json -Depth 10 -Compress), (New-Object System.Text.UTF8Encoding($false)))

Write-Output '=== upload worker ==='
$up = curl.exe -s -X PUT $api -H "Authorization: Bearer $tok" `
  -F "metadata=<$metaFile;type=application/json" `
  -F "module=@$src;filename=index.js;type=application/javascript+module" -w "`n%{http_code}"
Write-Output (($up -join ' ') -replace "`r?`n", ' ')

Remove-Item $metaFile -ErrorAction SilentlyContinue
Write-Output ''
Write-Output '=== verify ==='
$v = ((curl.exe -s $api -H "Authorization: Bearer $tok") -join "`n") | ConvertFrom-Json
Write-Output ('  entry_point = ' + $v.result.entry_point)
Write-Output ('  handlers    = ' + ($v.result.handlers -join ','))
$s2 = ((curl.exe -s "$api/settings" -H "Authorization: Bearer $tok") -join "`n") | ConvertFrom-Json
Write-Output ('  bindings    = ' + $s2.result.bindings.Count)
