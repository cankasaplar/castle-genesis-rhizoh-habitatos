# Prepare broadcast assets; optionally enable Windows tasks (off by default = HOLD).
param(
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [string]$MorningBuildTime = "06:30",
  [string]$MorningMailTime = "06:44",
  [string]$EveningLiveTime = "19:44",
  [switch]$EnableScheduledTasks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$prepare = Join-Path $RepoRoot "scripts\prepare-castle-genesis-broadcast-ready.ps1"
& powershell -NoProfile -ExecutionPolicy Bypass -File $prepare -RepoRoot $RepoRoot

if (-not $EnableScheduledTasks) {
  Write-Host ""
  Write-Host "HOLD: Zamanlanmis gorev kurulmadi." -ForegroundColor Yellow
  Write-Host "  Sabah uretim: $MorningBuildTime (planli)"
  Write-Host "  Sabah mail:   $MorningMailTime (planli)"
  Write-Host "  Aksam canli:  $EveningLiveTime (manuel OBS)"
  Write-Host ""
  Write-Host "Aktif etmek icin: -EnableScheduledTasks"
  Write-Host "Hazir dosyalar: docs/exports/broadcast-ready/"
  exit 0
}

$buildScript = Join-Path $RepoRoot "scripts\build-castle-genesis-morning-premiere-video.ps1"
$mailSetup = Join-Path $RepoRoot "scripts\setup-rhizoh-real-layer-morning-task.ps1"
$buildTr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$buildScript`""
schtasks /Create /TN "CastleGenesis_MorningPremiere_Build" /SC DAILY /ST $MorningBuildTime /TR $buildTr /F | Out-Null
& powershell -NoProfile -ExecutionPolicy Bypass -File $mailSetup -DailyTime $MorningMailTime

Write-Host "OK scheduled tasks enabled." -ForegroundColor Green
Write-Host "  CastleGenesis_MorningPremiere_Build @ $MorningBuildTime"
Write-Host "  Rhizoh_RealLayer_0644 @ $MorningMailTime"
Write-Host "  Evening live $EveningLiveTime — still manual OBS"
