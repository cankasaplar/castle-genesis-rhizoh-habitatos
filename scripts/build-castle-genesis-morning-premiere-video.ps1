# 45s morning premiere clip (static slide) for YouTube Premiere @ 06:44.
# Two-step ffmpeg: one frame encode, then stream_loop copy (low RAM).
param(
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [int]$DurationSec = 45
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$today = Get-Date -Format "yyyy-MM-dd"
$ytDir = Join-Path $RepoRoot "docs\exports\media\youtube"
if (-not (Test-Path -LiteralPath $ytDir)) {
  New-Item -ItemType Directory -Path $ytDir -Force | Out-Null
}

$svgTemplate = Join-Path $RepoRoot "apps\client\public\ops\youtube-test\castle-genesis-morning-premiere-slide.svg"
$svgWork = Join-Path $ytDir "morning_premiere_slide_$today.svg"
$pngPath = Join-Path $ytDir "morning_premiere_slide_$today.png"
$framePath = Join-Path $ytDir "morning_premiere_oneframe_$today.mp4"
$outPath = Join-Path $ytDir "morning_premiere_$today.mp4"
$log = Join-Path $ytDir "ffmpeg_morning_premiere.log"

$svg = Get-Content -LiteralPath $svgTemplate -Raw -Encoding UTF8
$svg = $svg.Replace("DATE_PLACEHOLDER", $today)
[System.IO.File]::WriteAllText($svgWork, $svg, (New-Object System.Text.UTF8Encoding $false))

if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot "scripts\_img-tools\node_modules"))) {
  Push-Location (Join-Path $RepoRoot "scripts\_img-tools")
  try { npm install --omit=dev 2>&1 | Out-Null } finally { Pop-Location }
}

$exportJs = Join-Path $RepoRoot "scripts\export-morning-premiere-slide-png.mjs"
node $exportJs $svgWork $pngPath
if (-not (Test-Path -LiteralPath $pngPath)) {
  throw "PNG export failed: $pngPath"
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg not in PATH"
}

foreach ($f in @($framePath, $outPath)) {
  if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force }
}

$loops = [Math]::Max(1, $DurationSec - 1)

# Step 1: single encoded frame (640x360, minimal RAM)
$step1 = @(
  "-y", "-i", $pngPath,
  "-vf", "scale=640:360",
  "-r", "1",
  "-frames:v", "1",
  "-c:v", "libx264",
  "-preset", "ultrafast",
  "-tune", "stillimage",
  "-pix_fmt", "yuv420p",
  "-an",
  $framePath
)
$p1 = Start-Process -FilePath "ffmpeg" -ArgumentList $step1 -Wait -PassThru -NoNewWindow -RedirectStandardError $log
if ($p1.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $framePath)) {
  throw "ffmpeg step1 failed. See $log"
}

# Step 2: loop-copy to duration (no re-encode)
$step2 = @(
  "-y",
  "-stream_loop", "$loops",
  "-i", $framePath,
  "-c", "copy",
  "-t", "$DurationSec",
  "-movflags", "+faststart",
  $outPath
)
$log2 = Join-Path $ytDir "ffmpeg_morning_premiere_step2.log"
$p2 = Start-Process -FilePath "ffmpeg" -ArgumentList $step2 -Wait -PassThru -NoNewWindow -RedirectStandardError $log2
if (-not (Test-Path -LiteralPath $outPath)) {
  throw "ffmpeg step2 failed. See $log"
}

$size = (Get-Item -LiteralPath $outPath).Length
$minBytes = 15 * 1024
if ($size -lt $minBytes) {
  throw "ffmpeg output too small ($size bytes). See $log"
}

$dur = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $outPath 2>$null
if ($dur -and ([double]$dur -lt ($DurationSec - 2))) {
  throw "ffmpeg duration too short: $dur sec (expected ~$DurationSec). See $log"
}

Write-Output "VIDEO=$outPath"
Write-Output "DURATION_SEC=$DurationSec"
Write-Output "PREMIERE_AT=06:44"
Write-Output "DATE=$today"
Write-Output "SIZE_KB=$([math]::Round($size/1KB,1))"
