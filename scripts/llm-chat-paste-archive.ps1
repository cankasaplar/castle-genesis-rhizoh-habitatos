param(
  [switch]$FromClipboard,
  [string]$PasteFile,
  [string]$SourcePath,
  [string]$Title,
  [string]$SourceHint,
  [string]$ArchiveRoot = "C:\Users\LENOVO\Desktop\castle\docs\archive\llm-chats",
  [switch]$ScanOnly,
  [switch]$DesktopLane
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\llm-chat-layer-scan.ps1")
. (Join-Path $PSScriptRoot "lib\llm-chat-text-normalize.ps1")

function Prepare-ChatRawText {
  param([string]$Text)
  $normalized = Normalize-ChatPastePipeline -Text $Text
  if ([string]::IsNullOrWhiteSpace($normalized)) {
    throw 'Chat body is empty after normalize. Paste content between SOHBET markers or add more text.'
  }
  return $normalized
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Get-Slug {
  param([string]$Text, [int]$MaxLen = 48)
  $s = ($Text -replace '[^\p{L}\p{Nd}\s_-]', '').Trim()
  if ([string]::IsNullOrWhiteSpace($s)) { return "untitled" }
  $words = @(($s -split '\s+') | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($words.Count -eq 0) { return "untitled" }
  $take = [Math]::Min(6, $words.Count)
  $s = ($words[0..($take - 1)] -join '-')
  if ($s.Length -gt $MaxLen) { $s = $s.Substring(0, $MaxLen) }
  return $s.ToLowerInvariant()
}

function Get-LlmSourceHint {
  param([string]$Text, [string]$Explicit)
  if (-not [string]::IsNullOrWhiteSpace($Explicit)) {
    return $Explicit.ToLowerInvariant()
  }
  $t = $Text.ToLowerInvariant()
  if ($t -match 'chatgpt|openai|gpt-4|gpt-5|gpt-4o|o1-|o3-') { return 'chatgpt' }
  if ($t -match 'buradayım can|mimar can kasaplar') { return 'chatgpt' }
  if ($t -match 'claude|anthropic') { return 'claude' }
  if ($t -match 'cursor|composer|agent transcript') { return 'cursor' }
  if ($t -match 'gemini|google ai') { return 'gemini' }
  if ($t -match 'copilot|github copilot') { return 'copilot' }
  if ($t -match 'perplexity') { return 'perplexity' }
  return 'unknown'
}

function Get-ContentProfile {
  param([string]$Text)
  $lines = ($Text -split "`r?`n").Count
  $chars = $Text.Length
  $codeBlocks = ([regex]::Matches($Text, '```')).Count / 2
  $hasUser = $Text -match '(?i)^(user|human|ben)\s*:' -or $Text -match '(?i)^###\s*user'
  $hasAssistant = $Text -match '(?i)^(assistant|ai|asistan)\s*:' -or $Text -match '(?i)^###\s*assistant'

  $quality = 'substantial'
  if ($chars -le 120) { $quality = 'empty_or_stub' }
  elseif ($chars -lt 800 -and $codeBlocks -eq 0) { $quality = 'thin' }
  elseif ($codeBlocks -ge 3) { $quality = 'code_heavy' }

  $type = 'conversation'
  if ($codeBlocks -ge 2 -and -not $hasUser) { $type = 'code_notes' }
  elseif (-not $hasUser -and -not $hasAssistant) { $type = 'freeform_notes' }

  [PSCustomObject]@{
    line_count = $lines
    char_count = $chars
    code_block_count = [int][Math]::Floor($codeBlocks)
    has_user_markers = $hasUser
    has_assistant_markers = $hasAssistant
    content_type = $type
    quality = $quality
  }
}

function Strip-LeadingFrontmatter {
  param([string]$Text)
  # Only strip YAML frontmatter at file start (first ~30 lines), not markdown --- rules in body.
  $lines = $Text -split "`r?`n"
  if ($lines.Count -ge 3 -and $lines[0].Trim() -eq '---') {
    for ($i = 1; $i -lt [Math]::Min(30, $lines.Count); $i++) {
      if ($lines[$i].Trim() -eq '---') {
        return (($lines[($i + 1)..($lines.Count - 1)]) -join "`n").TrimStart()
      }
    }
  }
  return $Text
}

function New-ArchiveRecord {
  param(
    [string]$RawText,
    [string]$SuggestedTitle,
    [string]$ExplicitSource,
    [string]$InboxDir,
    [string]$BatchId
  )

  $RawText = Strip-LeadingFrontmatter -Text $RawText
  $profile = Get-ContentProfile -Text $RawText
  $layerScan = Scan-ChatLayers -Text $RawText
  $source = Get-LlmSourceHint -Text $RawText -Explicit $ExplicitSource
  $layerHitsYaml = Format-LayerHitsYaml -Hits $layerScan.layer_hits

  $titleLine = $SuggestedTitle
  if ([string]::IsNullOrWhiteSpace($titleLine)) {
    $first = ($RawText -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1)
    $titleLine = if ($first) { $first } else { 'untitled-chat' }
  }

  $slug = Get-Slug -Text $titleLine
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $fileName = "${stamp}_${source}_${slug}.md"
  $targetPath = Join-Path $InboxDir $fileName

  $header = @(
    '---'
    "batch_id: $BatchId"
    "archived_at_utc: $((Get-Date).ToUniversalTime().ToString('o'))"
    "source_hint: $source"
    "content_type: $($profile.content_type)"
    "quality: $($profile.quality)"
    "line_count: $($profile.line_count)"
    "char_count: $($profile.char_count)"
    "layer_primary: $($layerScan.layer_primary)"
    "layer_hits: $layerHitsYaml"
    "layer_hit_total: $($layerScan.layer_hit_total)"
    '---'
    ''
  ) -join [Environment]::NewLine

  Set-Content -LiteralPath $targetPath -Value ($header + $RawText) -Encoding UTF8

  [PSCustomObject]@{
    batch_id = $BatchId
    archived_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    source_hint = $source
    content_type = $profile.content_type
    quality = $profile.quality
    line_count = $profile.line_count
    char_count = $profile.char_count
    title = $titleLine
    file_name = $fileName
    path = $targetPath
    layer_primary = $layerScan.layer_primary
    layer_hit_total = $layerScan.layer_hit_total
  }
}

function Update-ArchiveIndex {
  param(
    [string]$ArchiveRoot,
    [System.Collections.Generic.List[object]]$Records
  )

  $inbox = Join-Path $ArchiveRoot 'inbox'
  $all = Get-ChildItem -LiteralPath $inbox -File -Filter '*.md' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending

  $indexPath = Join-Path $ArchiveRoot 'LLM_CHAT_ARCHIVE_INDEX_V0.md'
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('# LLM Chat Archive Index (V0)') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("_Auto-generated by scripts/llm-chat-paste-archive.ps1_") | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("Updated: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))") | Out-Null
  $lines.Add("Total files: $($all.Count)") | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add('| File | Source | Type | Quality | Chars |') | Out-Null
  $lines.Add('|---|---|---|---|---:|') | Out-Null

  foreach ($f in $all) {
    $raw = Get-Content -LiteralPath $f.FullName -Raw
    $src = 'unknown'
    $type = 'conversation'
    $quality = 'substantial'
    $chars = $raw.Length
    if ($raw -match 'source_hint:\s*(\S+)') { $src = $Matches[1] }
    if ($raw -match 'content_type:\s*(\S+)') { $type = $Matches[1] }
    if ($raw -match 'quality:\s*(\S+)') { $quality = $Matches[1] }
    if ($raw -match 'char_count:\s*(\d+)') { $chars = $Matches[1] }
    $lines.Add("| ``$($f.Name)`` | $src | $type | $quality | $chars |") | Out-Null
  }

  $lines.Add('') | Out-Null
  $lines.Add('## Narrative links') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add('- Waiting room protocol: `docs/SPIRALMMO_WAITING_ROOM_AGENT_TRAINING_PROTOCOL_V0.md`') | Out-Null
  $lines.Add('- SPIRALMMO archive table: `docs/SPIRALMMO_ARCHIVE_TABLE_V0.md`') | Out-Null
  $lines.Add('- Drop-in mechanism: `docs/SPIRALMMO_DROP_IN_ARCHIVE_MECHANISM_V0.md`') | Out-Null

  Set-Content -LiteralPath $indexPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
  return $indexPath
}

$inboxDir = Join-Path $ArchiveRoot 'inbox'
$manifestDir = Join-Path $ArchiveRoot 'manifests'
$logDir = Join-Path $ArchiveRoot 'logs'
$pasteDir = Join-Path $ArchiveRoot 'paste-here'

foreach ($d in @($ArchiveRoot, $inboxDir, $manifestDir, $logDir, $pasteDir)) {
  Ensure-Dir -Path $d
}

$batchId = "llm-$((Get-Date).ToString('yyyyMMdd-HHmmss'))"
$records = New-Object System.Collections.Generic.List[object]

if ($ScanOnly) {
  $targets = Get-ChildItem -LiteralPath $pasteDir -File -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch '^(README|\.keep)' -and $_.Extension -in @('.md', '.txt', '.json', '.rtf') }
  foreach ($f in $targets) {
    $text = Read-ChatPasteSource -Path $f.FullName
    $text = Prepare-ChatRawText -Text $text
    $rec = New-ArchiveRecord -RawText $text -SuggestedTitle $f.BaseName -ExplicitSource $SourceHint -InboxDir $inboxDir -BatchId $batchId
    $records.Add($rec) | Out-Null
    Remove-Item -LiteralPath $f.FullName -Force
  }
} elseif ($FromClipboard) {
  $clip = Get-Clipboard -Raw
  if ([string]::IsNullOrWhiteSpace($clip)) {
    throw 'Clipboard is empty. Copy chat text first, then run with -FromClipboard.'
  }
  $clip = Prepare-ChatRawText -Text $clip
  $rec = New-ArchiveRecord -RawText $clip -SuggestedTitle $Title -ExplicitSource $SourceHint -InboxDir $inboxDir -BatchId $batchId
  $records.Add($rec) | Out-Null
} elseif ($PasteFile) {
  if (-not (Test-Path -LiteralPath $PasteFile)) {
    throw "Paste file not found: $PasteFile"
  }
  $text = Read-ChatPasteSource -Path $PasteFile
  $text = Prepare-ChatRawText -Text $text
  $recordTitle = $Title
  if ([string]::IsNullOrWhiteSpace($recordTitle)) {
    $recordTitle = if ($DesktopLane) { 'desktop-rtf-chat' } else { $null }
  }
  $rec = New-ArchiveRecord -RawText $text -SuggestedTitle $recordTitle -ExplicitSource $SourceHint -InboxDir $inboxDir -BatchId $batchId
  $records.Add($rec) | Out-Null
} elseif ($SourcePath) {
  if (-not (Test-Path -LiteralPath $SourcePath)) {
    throw "Source path not found: $SourcePath"
  }
  $files = if ((Get-Item -LiteralPath $SourcePath).PSIsContainer) {
    Get-ChildItem -LiteralPath $SourcePath -Recurse -File -Force |
      Where-Object { $_.Extension -in @('.md', '.txt', '.json', '.rtf') }
  } else {
    ,(Get-Item -LiteralPath $SourcePath)
  }
  foreach ($f in $files) {
    $text = Read-ChatPasteSource -Path $f.FullName
    $text = Prepare-ChatRawText -Text $text
    $rec = New-ArchiveRecord -RawText $text -SuggestedTitle $f.BaseName -ExplicitSource $SourceHint -InboxDir $inboxDir -BatchId $batchId
    $records.Add($rec) | Out-Null
  }
} else {
  throw 'Provide one mode: -FromClipboard, -PasteFile <path>, -SourcePath <path>, or -ScanOnly (for docs/archive/llm-chats/paste-here).'
}

if ($records.Count -eq 0) {
  throw 'No chat content archived.'
}

$csvPath = Join-Path $manifestDir "$batchId-manifest.csv"
$jsonPath = Join-Path $manifestDir "$batchId-manifest.json"
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
$records | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$applyScript = Join-Path $PSScriptRoot 'apply-llm-chat-tonom-write.ps1'
$inboxFiles = @($records | ForEach-Object { $_.path })
$tonomOut = powershell -ExecutionPolicy Bypass -File $applyScript -ArchiveRoot $ArchiveRoot -BatchId $batchId -InboxFiles $inboxFiles 2>&1

$extractScript = Join-Path $PSScriptRoot 'llm-chat-extract-action-items.ps1'
$extractOut = @()
if (Test-Path -LiteralPath $extractScript) {
  $extractOut = powershell -ExecutionPolicy Bypass -File $extractScript -ArchiveRoot $ArchiveRoot -InboxFiles $inboxFiles 2>&1
}

$indexPath = Join-Path $ArchiveRoot 'LLM_CHAT_ARCHIVE_INDEX_V0.md'

$laneNote = if ($DesktopLane) { 'DESKTOP_LANE=1 (non-canonical; inbox+scan+staging only)' } else { '' }

$summary = @(
  "BATCH_ID=$batchId"
  "ARCHIVED_COUNT=$($records.Count)"
  $laneNote
  "INBOX=$inboxDir"
  "INDEX=$indexPath"
  "MANIFEST_CSV=$csvPath"
  "MANIFEST_JSON=$jsonPath"
  "TONOM_POLICY=docs/archive/llm-chats/tonom-write-policy.v0.json"
  $tonomOut
  $extractOut
) -join [Environment]::NewLine

$logPath = Join-Path $logDir "$batchId-summary.txt"
Set-Content -LiteralPath $logPath -Value $summary -Encoding UTF8
Write-Output $summary
