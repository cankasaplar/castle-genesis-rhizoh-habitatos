#Requires -Version 5.1
<#
.SYNOPSIS
  Rhizoh seslendirmesini (.m4a) basit tam HD slate ile .mp4 yapar (NotebookLM / arşiv).
.DESCRIPTION
  ffmpeg PATH'te olmalı: winget install Gyan.FFmpeg
.EXAMPLE
  .\rhizoh-mux-audio-to-video.ps1 -AudioPath "$env:USERPROFILE\Downloads\Kendi_Yalanına_İnanmayan_Yapay_Zeka_Rhizoh.m4a"
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $AudioPath,
  [string] $OutPath = "",
  [string] $BackgroundColor = "black",
  [int] $Width = 1920,
  [int] $Height = 1080
)

$ErrorActionPreference = "Stop"

function Resolve-FfmpegExe {
  if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { return "ffmpeg" }
  $candidates = @(
    "C:\ffmpeg\bin\ffmpeg.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
  )
  foreach ($p in $candidates) {
    if (Test-Path -LiteralPath $p) { return $p }
  }
  $pkgRoot = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
  if (Test-Path -LiteralPath $pkgRoot) {
    $found = Get-ChildItem -Path $pkgRoot -Filter "ffmpeg.exe" -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1 -ExpandProperty FullName
    if ($found) { return $found }
  }
  return $null
}

$script:FfmpegExe = Resolve-FfmpegExe
if (-not $script:FfmpegExe) {
  Write-Error 'ffmpeg bulunamadi. Kur: winget install Gyan.FFmpeg; kurulum bitince terminali kapatip ac veya bu scripti yeniden calistir.'
}

if (-not (Test-Path -LiteralPath $AudioPath)) {
  Write-Error ('Ses dosyasi yok: ' + $AudioPath)
}

if (-not $OutPath) {
  $dir = Split-Path -Parent $AudioPath
  if (-not $dir) { $dir = "." }
  $base = [System.IO.Path]::GetFileNameWithoutExtension($AudioPath)
  $OutPath = Join-Path $dir ($base + ".mp4")
}

# Lavfi color (sonsuz) + ses; -shortest video süresünü sese eşitler
$lavfi = "color=c=${BackgroundColor}:s=${Width}x${Height}:r=30"
$args = @(
  "-y",
  "-f", "lavfi", "-i", $lavfi,
  "-i", $AudioPath,
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k",
  "-shortest",
  $OutPath
)

Write-Host ('ffmpeg: ' + $script:FfmpegExe)
Write-Host ('Cikti: ' + $OutPath)
& $script:FfmpegExe @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Tamam.'
