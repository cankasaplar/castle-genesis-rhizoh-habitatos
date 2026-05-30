# Forward-port ingress + T0 production boot from main → t0-interface-lock worktree.

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

function Copy-Rel($rel) {
  $src = Join-Path $main $rel
  $dst = Join-Path $WorktreePath $rel
  if (-not (Test-Path $src)) {
    throw "Missing on main: $src"
  }
  $dir = Split-Path -Parent $dst
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  if (Test-Path $src -PathType Container) {
    if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
    Copy-Item $src $dst -Recurse -Force
  } else {
    Copy-Item $src $dst -Force
  }
  Write-Host "OK $rel" -ForegroundColor Green
}

$paths = @(
  "apps/client/src/rhizoh/ingress",
  "apps/client/public/legal",
  "apps/client/src/boot/mountCastleApplicationT0V0.jsx",
  "apps/client/src/boot/mainT0Production.jsx",
  "apps/client/src/rhizoh/runtime/worldObservationBusV0.js",
  "apps/client/src/rhizoh/runtime/worldObservationIngressWireV0.js",
  "apps/client/src/rhizoh/runtime/worldObservationIngressContractV0.js",
  "apps/client/src/rhizoh/runtime/worldObservationIngressQueueV0.js",
  "apps/client/src/rhizoh/runtime/worldObservationDensityV0.js",
  "apps/client/src/rhizoh/runtime/worldObservationObservabilityV0.js",
  "apps/client/src/rhizoh/runtime/rhizohUiTextModeV0.js",
  "apps/client/src/rhizoh/runtime/prewarmSpeechSynthesisV0.js",
  "apps/client/src/rhizoh/runtime/voiceInputAdapterRegistryV0.js",
  "apps/client/src/rhizoh/runtime/worldTickPublisherV0.js",
  "apps/client/src/rhizoh/runtime/genesisContinuityClientWireV0.js",
  "apps/client/src/genesis/genesisContinuityEventFormatV0.js",
  "apps/client/src/components/RhizohWorldContinuityStrip.jsx",
  "apps/client/src/components/RhizohCohortInspectStrip.jsx",
  "apps/client/src/rhizoh/cohort",
  "apps/client/src/rhizoh/experience/livingWorldFirstInteractionV0.js",
  "functions/index.js"
)

foreach ($p in $paths) {
  Copy-Rel $p
}

$mainJsx = Join-Path $WorktreePath "apps\client\src\main.jsx"
$bootMain = Join-Path $WorktreePath "apps\client\src\boot\mainT0Production.jsx"
Copy-Item $bootMain $mainJsx -Force
Write-Host "OK apps/client/src/main.jsx (from mainT0Production)" -ForegroundColor Green

$fbMain = Get-Content (Join-Path $main "firebase.json") -Raw | ConvertFrom-Json
$fbT0Path = Join-Path $WorktreePath "firebase.json"
$fbT0 = Get-Content $fbT0Path -Raw | ConvertFrom-Json
$cohortRewrite = $fbMain.hosting.rewrites | Where-Object { $_.source -eq "/api/cohortGateV0" -or $_.source -eq "/api/gatewayProxy/**" }
if ($cohortRewrite) {
  foreach ($rw in $cohortRewrite) {
    $existing = @($fbT0.hosting.rewrites | Where-Object { $_.source -eq $rw.source })
    if (-not $existing.Count) {
      $fbT0.hosting.rewrites = @($rw) + @($fbT0.hosting.rewrites)
      Write-Host "OK firebase.json rewrite $($rw.source)" -ForegroundColor Green
    }
  }
  $fbT0 | ConvertTo-Json -Depth 20 | Set-Content $fbT0Path -Encoding UTF8
}

Write-Host ""
Write-Host "T0 ingress forward-port done. Next: patch-t0-gateway-health-proxy.ps1 && setup-rhizoh-t0-production.ps1 && npm run build"
