param(
  [Parameter(Mandatory = $true)]
  [string]$ShareUrl,
  [string]$Title = "claude-share-import"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($ShareUrl -notmatch 'claude\.ai/share/([a-f0-9-]+)') {
  throw "Expected Claude share URL like https://claude.ai/share/<uuid>"
}

$id = $Matches[1]
$repoRoot = Split-Path -Path $PSScriptRoot -Parent
$pasteDir = Join-Path $repoRoot "docs\archive\llm-chats\paste-here"
if (-not (Test-Path -LiteralPath $pasteDir)) {
  New-Item -ItemType Directory -Path $pasteDir | Out-Null
}

$target = Join-Path $pasteDir "claude-share-$id.md"
$body = @(
  "---"
  "source_hint: claude"
  "share_url: $ShareUrl"
  "import_status: pending_paste"
  "---"
  ""
  "# Claude share import"
  ""
  "Paste full conversation below this line, save file, then run:"
  ""
  "powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -ScanOnly"
  ""
  "<!-- PASTE CHAT BELOW -->"
  ""
) -join [Environment]::NewLine

Set-Content -LiteralPath $target -Value $body -Encoding UTF8

Write-Output "CREATED=$target"
Write-Output "NEXT=Open URL, copy chat, paste into file, save, run ScanOnly"
