# Build minimal 06:44 morning report HTML (text only, no cube).
param(
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [string]$OutDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\real-layer-morning-mail.ps1")

if (-not $OutDir) {
  $OutDir = Join-Path $RepoRoot "docs\exports\media\mail"
}
if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$today = Get-Date -Format "yyyy-MM-dd"
$htmlPath = Join-Path $OutDir "real_layer_morning_$today.html"
$html = New-RealLayerMorningHtmlBody -Today $today

$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($htmlPath, $html, $utf8)

Write-Output "HTML=$htmlPath"
