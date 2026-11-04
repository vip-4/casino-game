# publish.ps1 - publish the Phaser arcade (101 open-source games) together with the site.
#
# The games live in R2 (bucket h5-game-assets, prefix phaser/). This script
#   1. syncs phaser/*.html from R2 into a temp dir
#   2. generates phaser/index.html (the hub page) via build-hub.mjs
#   3. stages site files + phaser/ into one clean directory
#   4. deploys that directory to the Pages projects
#
# Run:
#   $env:R2_ACCESS_KEY_ID     = "<access key id>"
#   $env:R2_SECRET_ACCESS_KEY = "<secret access key>"
#   $env:CLOUDFLARE_API_TOKEN  = "<token>"
#   $env:CLOUDFLARE_ACCOUNT_ID = "33717d3e6845f08352ee14d9d672e273"
#   powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/arcade/publish.ps1
#
# Optional: -Projects h5games-3hm,casino-game   (default: all three)

param(
  [string]$Projects = 'h5games-3hm,casino-game,my-slot-game'
)

$ErrorActionPreference = 'Stop'
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path          # <repo>/infra/geo-router/arcade
$geoDir = Split-Path -Parent $here                                 # <repo>/infra/geo-router
$root   = Split-Path -Parent (Split-Path -Parent $geoDir)          # <repo>

$ak = if ($env:R2_ACCESS_KEY_ID) { $env:R2_ACCESS_KEY_ID } else { '' }
$sk = if ($env:R2_SECRET_ACCESS_KEY) { $env:R2_SECRET_ACCESS_KEY } else { '' }
if (-not $ak -or -not $sk) { Write-Output 'Set R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY first.'; exit 1 }

$acct = if ($env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID } else { '33717d3e6845f08352ee14d9d672e273' }
$bucket = 'h5-game-assets'
$ep = "https://$acct.r2.cloudflarestorage.com"

$nodeDir = if ($env:NODE_DIR) { $env:NODE_DIR } else { 'C:\Users\Administrator\.workbuddy\binaries\node\versions\20.18.0' }
$node = Join-Path $nodeDir 'node.exe'
if (-not (Test-Path $node)) { Write-Output "node not found at $node"; exit 1 }

$stage = Join-Path $root '_stage'
$games = Join-Path $stage 'phaser'

# ---------------------------------------------------------------- sync games
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $games | Out-Null

$keys = @()
$token = ''
do {
  $url = "$ep/$bucket/?list-type=2&prefix=phaser/&max-keys=1000"
  if ($token) { $url += "&continuation-token=$token" }
  $tmpXml = Join-Path $env:TEMP ('_arcade_list_' + [Guid]::NewGuid().ToString('N') + '.xml')
  curl.exe -s $url --aws-sigv4 'aws:amz:auto:s3' -u "$ak`:$sk" -o $tmpXml
  [xml]$x = Get-Content $tmpXml -Encoding UTF8
  foreach ($c in $x.ListBucketResult.Contents) { $keys += $c.Key }
  $token = $x.ListBucketResult.NextContinuationToken
  Remove-Item $tmpXml -Force -ErrorAction SilentlyContinue
} while ($token)

$dl = 0
foreach ($k in $keys) {
  $name = $k.Substring('phaser/'.Length)
  $code = curl.exe -s -o (Join-Path $games $name) -w '%{http_code}' "$ep/$bucket/$k" --aws-sigv4 'aws:amz:auto:s3' -u "$ak`:$sk"
  if ($code -eq '200') { $dl++ } else { Write-Output ("  FAIL " + $code + " " + $k) }
}
Write-Output ("games synced from R2: " + $dl + "/" + $keys.Count)

# ------------------------------------------------------------ build the hub
Write-Output '=== generating phaser/index.html ==='
& $node (Join-Path $here 'build-hub.mjs') $games (Join-Path $games 'index.html') 'https://casino.vip01.cc.cd'
if ($LASTEXITCODE -ne 0) { Write-Output 'hub build failed'; exit 1 }

# --------------------------------------------------------------- stage site
# only the public payload - no scripts / tests / worker sources
foreach ($i in @('index.html', '404.html', 'about.html', 'hub.html', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', '_headers', '_redirects', 'assets', 'games')) {
  $src = Join-Path $root $i
  if (Test-Path $src) { Copy-Item $src -Destination $stage -Recurse -Force }
}
Write-Output ('staged files: ' + (Get-ChildItem $stage -Recurse -File).Count)

# ------------------------------------------------------- sitemap (arcade)
# The repo sitemap and the staged copy stay in sync: the arcade block is
# regenerated from the game list on every run (idempotent).
function Update-Sitemap([string]$path, [string[]]$gameFiles) {
  if (-not (Test-Path $path)) { return }
  $bytes = [IO.File]::ReadAllBytes($path)
  $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
  $xml = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $xml = [regex]::Replace($xml, '(?s)\r?\n\s*<!-- arcade:phaser -->.*?<!-- /arcade:phaser -->', '')

  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <!-- arcade:phaser -->')
  [void]$sb.AppendLine('  <url>')
  [void]$sb.AppendLine('    <loc>https://casino.vip01.cc.cd/phaser/</loc>')
  [void]$sb.AppendLine('    <changefreq>weekly</changefreq>')
  [void]$sb.AppendLine('    <priority>0.8</priority>')
  [void]$sb.AppendLine('  </url>')
  foreach ($g in $gameFiles) {
    [void]$sb.AppendLine('  <url>')
    [void]$sb.AppendLine('    <loc>https://casino.vip01.cc.cd/phaser/' + ($g -replace '\.html$', '') + '</loc>')
    [void]$sb.AppendLine('    <changefreq>monthly</changefreq>')
    [void]$sb.AppendLine('    <priority>0.6</priority>')
    [void]$sb.AppendLine('  </url>')
  }
  [void]$sb.AppendLine('  <!-- /arcade:phaser -->')

  $xml = $xml.Replace('</urlset>', ($sb.ToString().TrimEnd() + "`r`n</urlset>"))
  [IO.File]::WriteAllText($path, $xml, (New-Object System.Text.UTF8Encoding($hasBom)))
}

$gameFiles = (Get-ChildItem (Join-Path $games '*.html') | Where-Object { $_.Name -ne 'index.html' } | Sort-Object Name | ForEach-Object { $_.Name })
Update-Sitemap (Join-Path $root 'sitemap.xml') $gameFiles
Update-Sitemap (Join-Path $stage 'sitemap.xml') $gameFiles
Write-Output ('sitemap: ' + $gameFiles.Count + ' arcade urls')

# ------------------------------------------------------------------ deploy
$env:PATH = "$nodeDir;$env:PATH"
foreach ($proj in ($Projects -split ',')) {
  $proj = $proj.Trim()
  if (-not $proj) { continue }
  Write-Output ("=== deploying -> " + $proj + " ===")
  & (Join-Path $nodeDir 'npx.cmd') wrangler pages deploy $stage --project-name=$proj --branch=main --commit-dirty=true 2>&1 |
    Select-String -Pattern 'Uploaded|Deployment complete|Error|error' | Out-String -Width 200 | Write-Output
}
