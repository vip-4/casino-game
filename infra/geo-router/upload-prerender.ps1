# upload-prerender.ps1 - publish the per-region prerendered HTML into the R2 bucket
# that the geo-router Worker reads (binding REGIONAL_ASSETS -> bucket h5-game-assets).
#
# Key layout expected by tryPrerenderedHtml() in the Worker:
#   <region>/index.html      -> "/"  and "/<region>"   (served for visitors of <region>)
#   <region>/<page>.html     -> "/<region>/<page>"    (about / hub / games/*)
#   <region>/.html           -> "/<region>/"          (trailing-slash form)
#   <visitor>/<region>/.html -> "/<region>/"          (same URL seen by another visitor region)
#
# The last group exists so that every hreflang alternate advertised in the Link header
# resolves no matter which region the visitor comes from.
#
# Run:
#   $env:R2_ACCESS_KEY_ID     = "<access key id>"
#   $env:R2_SECRET_ACCESS_KEY = "<secret access key>"
#   powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/upload-prerender.ps1

$ErrorActionPreference = 'Stop'
$here     = Split-Path -Parent $MyInvocation.MyCommand.Path            # <repo>/infra/geo-router
$root     = Split-Path -Parent (Split-Path -Parent $here)              # <repo>
$srcDir   = $here

$ak = if ($env:R2_ACCESS_KEY_ID) { $env:R2_ACCESS_KEY_ID } else { '' }
$sk = if ($env:R2_SECRET_ACCESS_KEY) { $env:R2_SECRET_ACCESS_KEY } else { '' }
if (-not $ak -or -not $sk) { Write-Output 'Set R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY first.'; exit 1 }

$acct = if ($env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID } else { '33717d3e6845f08352ee14d9d672e273' }
$bucket = 'h5-game-assets'
$ep = "$acct.r2.cloudflarestorage.com"

$regions = @('cn', 'en', 'eu', 'sea', 'jpkr', 'global')
$pages = @(
  'index.html',
  'about.html',
  'hub.html',
  'games/slots.html',
  'games/dice.html',
  'games/coinflip.html',
  'games/blackjack.html'
)

# --- make intra-site links root-absolute so they resolve from /<region>/ too ---
function Convert-ToRootRelative([string]$html) {
  $html = [regex]::Replace($html, '(href|src)="\.\./', '$1="/')
  $html = [regex]::Replace($html, '(href|src)="\./', '$1="/')
  $html = [regex]::Replace($html, '(href|src)="(assets/|games/)', '$1="/$2')
  $html = [regex]::Replace($html, '(href|src)="(index|about|hub|sitemap\.xml|manifest\.webmanifest)\.html"', '$1="/$2"')
  $html = $html.Replace('href="index.html"', 'href="/"')
  $html = $html.Replace('href="about.html"', 'href="/about"')
  $html = $html.Replace('href="hub.html"', 'href="/hub"')
  $html = $html.Replace('href="sitemap.xml"', 'href="/sitemap.xml"')
  $html = $html.Replace('href="manifest.webmanifest"', 'href="/manifest.webmanifest"')
  $html = [regex]::Replace($html, '(href|src)="(/[^"]+)\.html"', '$1="$2"')
  return $html
}

$tmp = Join-Path $env:TEMP ("prerender_" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null

$uploaded = 0
$failed = @()

function Put-Key([string]$key, [string]$file) {
  $url = "https://$ep/$bucket/$key"
  $code = curl.exe -s -o nul -w '%{http_code}' -X PUT $url `
    --aws-sigv4 'aws:amz:auto:s3' -u "$ak`:$sk" `
    -H 'Content-Type: text/html; charset=utf-8' --data-binary "@$file"
  if ($code -eq '200') { $script:uploaded++ } else { $script:failed += ("{0} -> {1}" -f $key, $code) }
}

try {
  # 1) per-region copies of the site pages
  foreach ($r in $regions) {
    foreach ($p in $pages) {
      $src = Join-Path $root ($p -replace '/', '\')
      if (-not (Test-Path $src)) { Write-Output ("  skip (missing source): " + $p); continue }
      $html = Convert-ToRootRelative ([IO.File]::ReadAllText($src, [Text.Encoding]::UTF8))
      $tmpFile = Join-Path $tmp 'page.html'
      [IO.File]::WriteAllText($tmpFile, $html, (New-Object System.Text.UTF8Encoding($false)))
      Put-Key ("$r/$p") $tmpFile
    }
    # "/<region>/" (trailing slash) -> "<region>/.html"
    $html = Convert-ToRootRelative ([IO.File]::ReadAllText((Join-Path $root 'index.html'), [Text.Encoding]::UTF8))
    $tmpFile = Join-Path $tmp 'page.html'
    [IO.File]::WriteAllText($tmpFile, $html, (New-Object System.Text.UTF8Encoding($false)))
    Put-Key ("$r/.html") $tmpFile
  }

  # 2) cross-region roots: "/<region>/" as seen by a visitor of another region
  foreach ($visitor in $regions) {
    foreach ($target in $regions) {
      if ($visitor -eq $target) { continue }
      $html = Convert-ToRootRelative ([IO.File]::ReadAllText((Join-Path $root 'index.html'), [Text.Encoding]::UTF8))
      $tmpFile = Join-Path $tmp 'page.html'
      [IO.File]::WriteAllText($tmpFile, $html, (New-Object System.Text.UTF8Encoding($false)))
      Put-Key ("$visitor/$target/.html") $tmpFile
    }
  }
} finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output ("uploaded: " + $uploaded)
if ($failed.Count -gt 0) {
  Write-Output 'failed:'
  foreach ($f in $failed) { Write-Output ('  ' + $f) }
}
