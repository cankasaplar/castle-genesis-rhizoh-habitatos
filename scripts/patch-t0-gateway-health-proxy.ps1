# Inject same-origin gateway health proxy into T0 worktree (do not overwrite full useRhizohGatewayMonitor.js).

param(
  [string]$WorktreePath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$main = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $WorktreePath) {
  $WorktreePath = Join-Path (Split-Path -Parent $main) "castle-t0-interface"
}

$target = Join-Path $WorktreePath "apps\client\src\rhizoh\useRhizohGatewayMonitor.js"
$src = Join-Path $main "apps\client\src\rhizoh\useRhizohGatewayMonitor.js"
$block = @'
export function shouldUseSameOriginGatewayHealthProxyV0() {
  if (typeof window === "undefined") return false;
  const host = String(window.location?.hostname || "").toLowerCase();
  return (
    host === "rhizoh.com" ||
    host.endsWith(".rhizoh.com") ||
    host.endsWith(".web.app") ||
    host.endsWith(".firebaseapp.com")
  );
}

export function getRhizohGatewayHealthBase() {
  if (shouldUseSameOriginGatewayHealthProxyV0()) {
    return `${window.location.origin}/api/gatewayProxy`;
  }
'@

$content = Get-Content $target -Raw
if ($content -match "shouldUseSameOriginGatewayHealthProxyV0") {
  Write-Host "Already patched: $target" -ForegroundColor Yellow
  exit 0
}

$needle = "export function getRhizohGatewayHealthBase() {`r`n  const cfg = getCastleFlightConfig();"
$replacement = ($block -replace "`n", "`r`n") + "`r`n  const cfg = getCastleFlightConfig();"
if ($content -notlike "*export function getRhizohGatewayHealthBase()*") {
  throw "getRhizohGatewayHealthBase not found in $target"
}
$content = $content.Replace($needle, $replacement)
Set-Content $target $content -Encoding UTF8 -NoNewline
Write-Host "OK gateway health proxy patch -> $target" -ForegroundColor Green
