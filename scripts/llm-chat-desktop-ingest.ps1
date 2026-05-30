# Ingest chat from desktop RTF lane -> repo inbox (scan + repair; no canonical write).
param(
  [string]$DesktopRtf = "C:\Users\LENOVO\Desktop\Rhizoh_LLM_Sohbet_Yapistir.rtf",
  [string]$Title,
  [string]$SourceHint,
  [string]$ArchiveRoot = "C:\Users\LENOVO\Desktop\castle\docs\archive\llm-chats"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$pasteScript = Join-Path $PSScriptRoot "llm-chat-paste-archive.ps1"

if (-not (Test-Path -LiteralPath $DesktopRtf)) {
  $setup = Join-Path $PSScriptRoot "setup-llm-chat-desktop-lane.ps1"
  Write-Host "Desktop RTF missing; creating lane..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File $setup -RepoRoot $repoRoot
}

$pasteArgs = @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $pasteScript,
  '-PasteFile', $DesktopRtf,
  '-ArchiveRoot', $ArchiveRoot,
  '-DesktopLane'
)
if (-not [string]::IsNullOrWhiteSpace($Title)) {
  $pasteArgs += @('-Title', $Title)
}
if (-not [string]::IsNullOrWhiteSpace($SourceHint)) {
  $pasteArgs += @('-SourceHint', $SourceHint)
}

$output = & powershell @pasteArgs 2>&1
$output | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
  throw "Ingest failed (exit $LASTEXITCODE). See output above."
}

Write-Host ""
Write-Host "Tamam. Sohbet repoda: docs/archive/llm-chats/inbox/"
Write-Host "RTF dosyasini temizleyip yeni sohbet icin tekrar kullanabilirsin."
