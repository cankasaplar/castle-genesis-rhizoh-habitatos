# Restructure inbox archives: code fences, file extensions, segment sidecars.
param(
  [string[]]$InboxFiles,
  [string]$ArchiveRoot = "C:\Users\LENOVO\Desktop\castle\docs\archive\llm-chats",
  [switch]$RescanAll
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\llm-chat-structure-segment.ps1")
$inboxDir = Join-Path $ArchiveRoot 'inbox'
$segmentsDir = Join-Path $ArchiveRoot 'segments'
if (-not (Test-Path -LiteralPath $segmentsDir)) {
  New-Item -ItemType Directory -Path $segmentsDir | Out-Null
}

$targets = @()
if ($RescanAll) {
  $targets = @(Get-ChildItem -LiteralPath $inboxDir -File -Filter '*.md')
} elseif ($InboxFiles -and $InboxFiles.Count -gt 0) {
  $targets = $InboxFiles | ForEach-Object {
    $p = $_
    if (-not [IO.Path]::IsPathRooted($p)) { $p = Join-Path $inboxDir ([IO.Path]::GetFileName($p)) }
    Get-Item -LiteralPath $p
  }
} else {
  throw 'Provide -InboxFiles or -RescanAll.'
}

$hashMap = @{}
$dupes = New-Object System.Collections.Generic.List[string]

foreach ($f in $targets) {
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $h = Get-InboxBodyHash -Raw $raw
  if ($hashMap.ContainsKey($h)) {
    $dupes.Add("$($f.Name) duplicate_of $($hashMap[$h])") | Out-Null
  } else {
    $hashMap[$h] = $f.Name
  }

  $body = if ($raw -match '(?s)^---\r?\n.*?\r?\n---\r?\n(.*)$') { $Matches[1] } else { $raw }
  $structured = Split-ChatStructuredContent -Text $body
  Update-InboxStructuredMeta -InboxPath $f.FullName -Structured $structured

  $segName = ($f.Name -replace '\.md$', '') + '_segments.md'
  $segPath = Join-Path $segmentsDir $segName
  $segMd = Format-SegmentsMarkdown -SourceFile $f.Name -Structured $structured
  Set-Content -LiteralPath $segPath -Value $segMd -Encoding UTF8

  Write-Host "STRUCTURED $($f.Name) codes=$($structured.code_blocks.Count) files=$($structured.file_refs.Count) -> segments/$segName"
}

if ($dupes.Count -gt 0) {
  Write-Host ""
  Write-Host "DUPLICATES (same body hash):"
  foreach ($d in $dupes) { Write-Host "  - $d" }
}

Write-Host "DONE segments=$segmentsDir"
Write-Host "Tip: run llm-chat-extract-action-items.ps1 -RescanAll for todo digests"
