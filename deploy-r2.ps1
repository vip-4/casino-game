# deploy-r2.ps1 — 将静态站点部署到 Cloudflare R2（无需额外依赖，仅依赖 curl 8.13+）
#
# 前置条件（在你自己的机器上）：
#   1. 在 Cloudflare Dashboard 中「启用 R2」（需先同意计费/绑定支付方式）。
#   2. 创建 bucket：casino-game-prod（或在下方 $Bucket 改名）。
#   3. 该机器能访问 https://<ACCOUNT>.r2.cloudflarestorage.com （本环境被代理拦截，需在本地运行）。
#
# 运行： powershell -NoProfile -ExecutionPolicy Bypass -File deploy-r2.ps1

$ACCOUNT   = "ceffe067ff7027b695ef91fcea9fa38a"  # R2 账户 ID（非机密）
# 凭证通过环境变量传入，避免将密钥提交到仓库：
#   $env:R2_ACCESS_KEY_ID / $env:R2_SECRET_ACCESS_KEY
$AK        = if ($env:R2_ACCESS_KEY_ID) { $env:R2_ACCESS_KEY_ID } else { "" }
$SK        = if ($env:R2_SECRET_ACCESS_KEY) { $env:R2_SECRET_ACCESS_KEY } else { "" }
if (-not $AK -or -not $SK) {
  Write-Output "请在环境变量中设置 R2_ACCESS_KEY_ID 与 R2_SECRET_ACCESS_KEY 后重试。"
  exit 1
}
$Bucket    = "casino-game-prod"
$Endpoint  = "$ACCOUNT.r2.cloudflarestorage.com"
$LocalDir  = $PSScriptRoot

$ct = @{
  ".html"       = "text/html; charset=utf-8"
  ".css"        = "text/css; charset=utf-8"
  ".js"         = "application/javascript; charset=utf-8"
  ".mjs"        = "application/javascript; charset=utf-8"
  ".json"       = "application/json; charset=utf-8"
  ".webmanifest"= "application/manifest+json; charset=utf-8"
  ".xml"        = "application/xml; charset=utf-8"
  ".svg"        = "image/svg+xml"
  ".txt"        = "text/plain; charset=utf-8"
  ".png"        = "image/png"
  ".jpg"        = "image/jpeg"
  ".jpeg"       = "image/jpeg"
  ".gif"        = "image/gif"
  ".ico"        = "image/x-icon"
  ".webp"       = "image/webp"
  ".woff2"      = "font/woff2"
  ".woff"       = "font/woff"
}

$files = Get-ChildItem -Path $LocalDir -Recurse -File | Where-Object {
  $_.FullName -notmatch '[\\/]\.git[\\/]' -and $_.Name -ne "deploy-r2.ps1" -and $_.Name -ne "README.md"
}
$total = $files.Count
$i = 0
foreach ($f in $files) {
  $i++
  $rel = $f.FullName.Substring($LocalDir.Length).TrimStart('\','/') -replace '\\','/'
  if ($rel -eq "") { $rel = $f.Name }
  $ext = $f.Extension.ToLower()
  $contentType = if ($ct.ContainsKey($ext)) { $ct[$ext] } else { "application/octet-stream" }
  $url = "https://$Endpoint/$Bucket/$rel"
  # 目录索引：上传 index.html 同时映射到目录根（可选）
  curl.exe -sS -X PUT $url `
    --aws-sigv4 "aws:amz:auto:s3" `
    -u "$AK`:$SK" `
    -H "Content-Type: $contentType" `
    -H "Cache-Control: public, max-age=3600" `
    --data-binary "@$($f.FullName)" `
    -o nul -w "  [$i/$total] PUT $rel ($contentType) -> %{http_code}`n"
}
Write-Output "部署完成。公开访问地址取决于你为 bucket 配置的域名/公开访问设置。"
Write-Output "  - R2.dev 公开 URL： https://pub-<hash>.r2.dev/<key> （需在 Dashboard 开启 R2.dev 子域）"
Write-Output "  - 自定义域：通过 Cloudflare DNS + R2 自定义域绑定。"
