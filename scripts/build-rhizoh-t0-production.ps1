# Production build for T0 worktree — .env.local must not override legal/gateway prod flags.
param(
  [string]$RepoRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$castleMain = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$root = if ($RepoRoot.Trim()) { $RepoRoot.Trim() } else { $castleMain }

$localEnv = Join-Path $root "apps\client\.env.local"
$bakEnv = Join-Path $root "apps\client\.env.local.build-bak"
$hadLocal = Test-Path $localEnv

if ($hadLocal) {
  if (Test-Path $bakEnv) { Remove-Item $bakEnv -Force }
  Rename-Item $localEnv $bakEnv
  Write-Host "Moved .env.local aside for production build" -ForegroundColor Yellow
}

try {
  powershell -File (Join-Path $castleMain "scripts\setup-rhizoh-t0-production.ps1") -RepoRoot $root -FromMainLocal
  Push-Location $root
  npm run build -w apps/client
} finally {
  Pop-Location -ErrorAction SilentlyContinue
  if ($hadLocal -and (Test-Path $bakEnv)) {
    if (Test-Path $localEnv) { Remove-Item $localEnv -Force }
    Rename-Item $bakEnv $localEnv
    Write-Host "Restored .env.local" -ForegroundColor Green
  }
}
