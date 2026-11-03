# deploy-worker.ps1 - upload the reverse-proxy Worker and bind it to the branded domains
#
# Why a Worker? On this zone there is a catch-all route *.vip01.cc.cd/* -> h5-game-geo-router.
# A hostname-specific route wins over the wildcard, so casino.vip01.cc.cd is served by our
# Worker, which forwards to the Cloudflare Pages deployment and keeps the canonical host.
#
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File deploy-worker.ps1
# Needs environment variables:
#   $env:CLOUDFLARE_API_TOKEN   - API token with Workers + DNS edit rights
#   $env:CLOUDFLARE_ACCOUNT_ID  - account id
#   $env:CLOUDFLARE_ZONE_ID     - zone id of vip01.cc.cd

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$tok = if ($env:CLOUDFLARE_API_TOKEN) { $env:CLOUDFLARE_API_TOKEN } else { '' }
$acc = if ($env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID } else { '' }
$zid = if ($env:CLOUDFLARE_ZONE_ID) { $env:CLOUDFLARE_ZONE_ID } else { '' }
if (-not $tok -or -not $acc -or -not $zid) {
  Write-Output 'Please set CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_ZONE_ID.'
  exit 1
}

$name = 'casino-pages-proxy'
$src  = Join-Path $root ("worker\" + $name + '.js')
if (-not (Test-Path $src)) { Write-Output "Missing $src"; exit 1 }

# 1) upload the script (module worker)
$meta = '{"main_module":"' + $name + '.js","compatibility_date":"2026-11-03"}'
$metaFile = Join-Path $root '_worker-meta.json'
[IO.File]::WriteAllText($metaFile, $meta, (New-Object System.Text.UTF8Encoding($false)))
Write-Output '=== upload worker script ==='
$up = curl.exe -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$acc/workers/scripts/$name" `
  -H "Authorization: Bearer $tok" `
  -F "metadata=<_worker-meta.json;type=application/json" `
  -F "module=@$src;filename=$name.js;type=application/javascript+module" -w "`n%{http_code}"
Write-Output (($up -join ' ') -replace "`r?`n", ' ')

# 2) bind routes (idempotent: delete an existing route for the same pattern first)
Write-Output ''
Write-Output '=== bind routes ==='
$existing = ((curl.exe -s "https://api.cloudflare.com/client/v4/zones/$zid/workers/routes" -H "Authorization: Bearer $tok") -join "`n") | ConvertFrom-Json
foreach ($pattern in @('casino.vip01.cc.cd/*', 'www.casino.vip01.cc.cd/*')) {
  foreach ($r in $existing.result) {
    if ($r.pattern -eq $pattern) {
      curl.exe -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$zid/workers/routes/$($r.id)" -H "Authorization: Bearer $tok" -o nul
    }
  }
  $body = '{"pattern":"' + $pattern + '","script":"' + $name + '"}'
  $bf = Join-Path $root '_worker-route.json'
  [IO.File]::WriteAllText($bf, $body, (New-Object System.Text.UTF8Encoding($false)))
  $res = curl.exe -s -X POST "https://api.cloudflare.com/client/v4/zones/$zid/workers/routes" -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' --data "@_worker-route.json" -w "`n%{http_code}"
  Write-Output ("  $pattern -> " + (($res -join ' ') -replace "`r?`n", ' '))
}

Write-Output ''
Write-Output '=== routes now ==='
$now = ((curl.exe -s "https://api.cloudflare.com/client/v4/zones/$zid/workers/routes" -H "Authorization: Bearer $tok") -join "`n") | ConvertFrom-Json
foreach ($r in $now.result) { Write-Output ("  " + $r.pattern + " -> " + $r.script) }

Remove-Item $metaFile, (Join-Path $root '_worker-route.json') -ErrorAction SilentlyContinue
