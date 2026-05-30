# Extract todo/idea/question digests from archived LLM chats (meaning-layer heuristics).
param(
  [string[]]$InboxFiles,
  [string]$ArchiveRoot = "C:\Users\LENOVO\Desktop\castle\docs\archive\llm-chats",
  [switch]$AllSubstantial,
  [switch]$RescanAll,
  [string]$SourceHintOverride
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\llm-chat-action-extract.ps1")

$inboxDir = Join-Path $ArchiveRoot 'inbox'
$actionDir = Join-Path $ArchiveRoot 'action-items'
$segmentsDir = Join-Path $ArchiveRoot 'segments'
foreach ($d in @($actionDir, $segmentsDir)) {
  if (-not (Test-Path -LiteralPath $d)) {
    New-Item -ItemType Directory -Path $d | Out-Null
  }
}

$targets = @()
if ($RescanAll -or $AllSubstantial) {
  $targets = Get-ChildItem -LiteralPath $inboxDir -File -Filter '*.md' -ErrorAction SilentlyContinue
  if ($AllSubstantial -and -not $RescanAll) {
    $targets = $targets | Where-Object {
      $raw = Get-Content -LiteralPath $_.FullName -Raw
      $raw -match 'quality:\s*substantial'
    }
  }
} elseif ($InboxFiles -and $InboxFiles.Count -gt 0) {
  $targets = $InboxFiles | ForEach-Object {
    $p = $_
    if (-not [IO.Path]::IsPathRooted($p)) {
      $p = Join-Path $inboxDir ([IO.Path]::GetFileName($p))
    }
    if (-not (Test-Path -LiteralPath $p)) { throw "Inbox file not found: $p" }
    Get-Item -LiteralPath $p
  }
} else {
  throw 'Provide -InboxFiles <paths>, -AllSubstantial, or -RescanAll.'
}

$records = New-Object System.Collections.Generic.List[object]
foreach ($f in $targets) {
  $rec = Write-ChatActionDigest -InboxPath $f.FullName -ActionItemsDir $actionDir `
    -SourceHintOverride $SourceHintOverride -SegmentsDir $segmentsDir
  $records.Add($rec) | Out-Null
  Write-Host "EXTRACTED $($f.Name) -> $($rec.action_file) (actions=$($rec.action_count) ideas=$($rec.idea_count) questions=$($rec.question_count))"
}

$master = Update-ActionItemsMaster -ArchiveRoot $ArchiveRoot -Records $records
Write-Host "MASTER=$master"
