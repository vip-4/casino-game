# 生成 1200x630 的 PNG 社交分享封面 (assets/img/og-cover.png)
#
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/gen-og-cover.ps1
#
# 说明:
#   - 依赖 .NET Framework 的 System.Drawing（Windows 自带）。
#   - 封面文案放在同目录的 og-cover-text.txt（UTF-8），避免 PowerShell
#     读取 .ps1 时的编码问题导致中文乱码。

Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$textFile = Join-Path $PSScriptRoot 'og-cover-text.txt'
$outFile = Join-Path $root 'assets/img/og-cover.png'

if (-not (Test-Path $textFile)) {
  Write-Output "缺少封面文案文件: $textFile"
  exit 1
}

$lines = [IO.File]::ReadAllLines($textFile, [Text.Encoding]::UTF8)
$title = $lines[0]
$sub   = $lines[1]
$foot  = $lines[2]

$w = 1200; $h = 630
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# background gradient
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 0,0),
  (New-Object System.Drawing.Point 0,$h),
  [System.Drawing.Color]::FromArgb(255,11,16,32),
  [System.Drawing.Color]::FromArgb(255,30,22,74))
$g.FillRectangle($bg, 0, 0, $w, $h)

# decorative translucent circles
function DrawCircle($x,$y,$r,$a,$cr,$cg,$cb){
  $br = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a,$cr,$cg,$cb))
  $g.FillEllipse($br, $x-$r, $y-$r, $r*2, $r*2)
}
DrawCircle 110 90 85 40 99 102 241
DrawCircle 1105 560 120 26 139 92 246
DrawCircle 1055 85 55 45 245 200 24
DrawCircle 140 560 65 50 245 197 24

# center panel
$panel = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32,255,255,255))
$g.FillRectangle($panel, 150, 150, 900, 340)

# gold divider under title
$gold = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,245,197,24))
$g.FillRectangle($gold, 470, 318, 260, 5)

# fonts (try CJK-capable first)
$fonts = @("Microsoft YaHei","SimHei","SimSun","Arial")
$fTitle = $null; $fSub = $null; $fFoot = $null
foreach ($fn in $fonts) { try { $fTitle = New-Object System.Drawing.Font($fn, 72, [System.Drawing.FontStyle]::Bold); if ($fTitle) { break } } catch {} }
foreach ($fn in $fonts) { try { $fSub = New-Object System.Drawing.Font($fn, 34, [System.Drawing.FontStyle]::Regular); if ($fSub) { break } } catch {} }
foreach ($fn in $fonts) { try { $fFoot = New-Object System.Drawing.Font($fn, 28, [System.Drawing.FontStyle]::Regular); if ($fFoot) { break } } catch {} }

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString($title, $fTitle, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(150,185,900,110)), $sf)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,190,200,255))
$g.DrawString($sub, $fSub, $subBrush, (New-Object System.Drawing.RectangleF(150,338,900,66)), $sf)
$footBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,170,180,210))
$g.DrawString($foot, $fFoot, $footBrush, (New-Object System.Drawing.RectangleF(150,425,900,52)), $sf)

$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $g.Dispose()
Write-Output ("PNG cover generated: " + $outFile)
