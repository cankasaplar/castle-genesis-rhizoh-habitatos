# Forward-port minimal files from main so t0-interface-lock @ 8bd4ff9 runs.
# Genesis observatory (a6dfa61) added imports before supporting modules landed.

param(
  [string]$WorktreePath = "",
  [string]$MainRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$main = if ($MainRoot.Trim()) { $MainRoot.Trim() } else { Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
if (-not $WorktreePath) {
  $WorktreePath = Join-Path (Split-Path -Parent $main) "castle-t0-interface"
}

$ports = @(
  "apps/client/src/rhizoh/runtime/castleWorldLayerGateV0.js",
  "apps/client/src/rhizoh/runtime/studioCapabilityProbeV0.js",
  "apps/client/src/castleFlight/castleFlightConfig.js"
)

foreach ($rel in $ports) {
  $src = Join-Path $main $rel
  $dst = Join-Path $WorktreePath $rel
  if (-not (Test-Path $src)) {
    throw "Missing source on main: $src"
  }
  $dir = Split-Path -Parent $dst
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Copy-Item -Path $src -Destination $dst -Force
  Write-Host "OK $rel" -ForegroundColor Green
}

Write-Host ""
Write-Host "T0 forward-port applied. Dev: npm run dev -w apps/client"
