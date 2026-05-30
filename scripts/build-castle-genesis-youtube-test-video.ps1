# Build unlisted YouTube test video: holding slide + Kendi Yalanina audio (m4a/mp3).
param(
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [string]$AudioPath = "",
  [string]$OutPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$slideSvg = Join-Path $RepoRoot "apps\client\public\ops\youtube-test\castle-genesis-holding-slide.svg"
$slidePng = Join-Path $RepoRoot "apps\client\public\ops\youtube-test\castle-genesis-holding-slide.png"
$exportDir = Join-Path $RepoRoot "docs\exports\media\youtube"

if (-not (Test-Path -LiteralPath $exportDir)) {
  New-Item -ItemType Directory -Path $exportDir | Out-Null
}

if ([string]::IsNullOrWhiteSpace($AudioPath)) {
  $candidates = @(
    (Join-Path $RepoRoot "Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.m4a"),
    (Join-Path $RepoRoot "Kendi_Yalanina_Inanmayan_Yapay_Zeka_Rhizoh.m4a"),
    (Join-Path $RepoRoot "Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.mp3"),
    (Join-Path $RepoRoot "Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.mp4")
  )
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) {
      $AudioPath = $c
      break
    }
  }
  if ([string]::IsNullOrWhiteSpace($AudioPath)) {
    $found = Get-ChildItem -LiteralPath $RepoRoot -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "Kendi*Rhizoh*" -and $_.Extension -match '\.(m4a|mp3|mp4)$' } |
      Select-Object -First 1
    if ($found) { $AudioPath = $found.FullName }
  }
}

if (-not $AudioPath -or -not (Test-Path -LiteralPath $AudioPath)) {
  throw "Audio not found. Set -AudioPath to Kendi_Yalanina... m4a/mp3/mp4 in repo root."
}

if ([string]::IsNullOrWhiteSpace($OutPath)) {
  $OutPath = Join-Path $exportDir "castle_genesis_test_kendi_yalanina.mp4"
}

# PNG from SVG (resvg if available)
if (-not (Test-Path -LiteralPath $slidePng)) {
  $imgTools = Join-Path $RepoRoot "scripts\_img-tools"
  $exportJs = Join-Path $RepoRoot "scripts\export-youtube-holding-slide-png.mjs"
  if (-not (Test-Path -LiteralPath (Join-Path $imgTools "node_modules"))) {
    Push-Location $imgTools
    try { npm install --omit=dev 2>&1 | Out-Null } finally { Pop-Location }
  }
  if (Test-Path -LiteralPath $exportJs) {
    node $exportJs | Out-Null
  }
}

if (-not (Test-Path -LiteralPath $slidePng)) {
  throw "Slide PNG missing. Install ffmpeg + run: node scripts/export-youtube-holding-slide-png.mjs"
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
  Write-Host ""
  Write-Host "ffmpeg yok. Alternatif:" -ForegroundColor Yellow
  Write-Host "  1) https://www.gyan.dev/ffmpeg/builds/ -> ffmpeg.exe PATH'e"
  Write-Host "  2) Veya OBS: PNG sahne + bu ses dosyasi -> MP4 kayit"
  Write-Host ""
  Write-Host "AUDIO=$AudioPath"
  Write-Host "SLIDE_PNG=$slidePng"
  Write-Host "TARGET=$OutPath"
  exit 2
}

# ASCII path copy (Turkce dosya adi ffmpeg sorunlarini onler)
$audioCopy = Join-Path $exportDir "kendi_yalanina_audio.m4a"
Copy-Item -LiteralPath $AudioPath -Destination $audioCopy -Force

if (Test-Path -LiteralPath $OutPath) {
  Remove-Item -LiteralPath $OutPath -Force
}

# 1 fps still image — ~14 dk ses icin bellek dostu (25 fps malloc patlamasin)
$ffmpegArgs = @(
  "-y",
  "-loop", "1",
  "-framerate", "1",
  "-i", $slidePng,
  "-i", $audioCopy,
  "-c:v", "libx264",
  "-preset", "ultrafast",
  "-tune", "stillimage",
  "-pix_fmt", "yuv420p",
  "-r", "1",
  "-c:a", "copy",
  "-shortest",
  "-movflags", "+faststart",
  $OutPath
)

$proc = Start-Process -FilePath "ffmpeg" -ArgumentList $ffmpegArgs -Wait -PassThru -NoNewWindow `
  -RedirectStandardError (Join-Path $exportDir "ffmpeg_build.log")
if ($proc.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $OutPath)) {
  $log = Get-Content (Join-Path $exportDir "ffmpeg_build.log") -Tail 20 -ErrorAction SilentlyContinue
  throw "ffmpeg failed (exit $($proc.ExitCode)). Log tail:`n$($log -join "`n")"
}

$sizeMb = [math]::Round((Get-Item -LiteralPath $OutPath).Length / 1MB, 2)
Write-Output "VIDEO=$OutPath"
Write-Output "AUDIO=$AudioPath"
Write-Output "SLIDE=$slidePng"
Write-Output "SIZE_MB=$sizeMb"
