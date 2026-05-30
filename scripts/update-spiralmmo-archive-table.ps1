param(
  [string]$SpiralRoot,
  [string]$OutputPath = "C:\Users\LENOVO\Desktop\castle\docs\SPIRALMMO_ARCHIVE_TABLE_V0.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-SpiralRoot {
  param([string]$ExplicitRoot)
  if ($ExplicitRoot -and (Test-Path -LiteralPath $ExplicitRoot)) {
    return (Resolve-Path -LiteralPath $ExplicitRoot).Path
  }

  $desktop = Join-Path $env:USERPROFILE "Desktop"
  $candidate = Get-ChildItem -LiteralPath $desktop -Directory |
    Where-Object { $_.Name -match "SP.*MMO" } |
    Select-Object -First 1

  if (-not $candidate) {
    throw "SPIRALMMO root not found on Desktop. Pass -SpiralRoot explicitly."
  }
  return $candidate.FullName
}

function Get-HtmlQuality {
  param([string]$Path, [long]$Length)
  if ($Length -le 200) { return "empty_or_stub" }

  $raw = ""
  try {
    $raw = Get-Content -LiteralPath $Path -Raw
  } catch {
    return "unreadable"
  }

  if (-not $raw) { return "empty_or_stub" }
  $text = $raw.Trim()
  if ([string]::IsNullOrWhiteSpace($text)) { return "empty_or_stub" }

  $score = 0
  if ($text -match "<html") { $score++ }
  if ($text -match "<body") { $score++ }
  if ($text -match "<script") { $score++ }
  if ($text -match "<style|<link") { $score++ }
  if ($text -match "<canvas|<main|<section|<div") { $score++ }

  if ($score -le 1 -or $Length -lt 1200) { return "insufficient_code" }
  if ($score -eq 2) { return "skeleton_only" }
  return "workable"
}

function Get-LlmChatLayerSummary {
  param([string]$RepoRoot)
  $archiveRoot = Join-Path $RepoRoot "docs\archive\llm-chats"
  $policyPath = Join-Path $archiveRoot "tonom-write-policy.v0.json"
  $inboxPath = Join-Path $archiveRoot "inbox"

  $inboxCount = 0
  if (Test-Path -LiteralPath $inboxPath) {
    $inboxCount = (Get-ChildItem -LiteralPath $inboxPath -File -Filter "*.md" -ErrorAction SilentlyContinue).Count
  }

  if (-not (Test-Path -LiteralPath $policyPath)) {
    return [PSCustomObject]@{
      inbox_count = $inboxCount
      total_ingested = 0
      last_batch_id = ""
      last_updated_utc = ""
      layer_rows = @()
      tonom_rows = @()
    }
  }

  $policy = Get-Content -LiteralPath $policyPath -Raw | ConvertFrom-Json
  $layerRows = @()
  $tonomRows = @()

  foreach ($layerId in @(
      "file", "text", "comment", "meaning", "fun", "music", "art", "sport", "competition", "real_layer"
    )) {
    $layer = $policy.layers.$layerId
    if (-not $layer) { continue }
    $hits = 0
    $lh = $policy.state.layer_hits
    if ($lh -and ($lh.PSObject.Properties.Name -contains $layerId)) {
      $hits = [int]$lh.$layerId
    }
    $staging = if ($layer.staging_write) { "yes" } else { "no" }
    $canonical = if ($layer.canonical_write) { "yes" } else { "no" }
    $execution = if ($layer.execution_write) { "yes" } else { "no" }
    $layerRows += [PSCustomObject]@{
      Layer = $layerId
      Label = $layer.label
      Hits = "$hits"
    }
    $tonomRows += [PSCustomObject]@{
      Layer = $layerId
      Staging = $staging
      Canonical = $canonical
      Execution = $execution
    }
  }

  return [PSCustomObject]@{
    inbox_count = $inboxCount
    total_ingested = [int]$policy.state.total_ingested
    last_batch_id = [string]$policy.state.last_batch_id
    last_updated_utc = [string]$policy.state.last_updated_utc
    layer_rows = $layerRows
    tonom_rows = $tonomRows
  }
}

function To-MarkdownTable {
  param(
    [string[]]$Headers,
    [object[][]]$Rows
  )
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("| " + ($Headers -join " | ") + " |") | Out-Null
  $lines.Add("|" + (($Headers | ForEach-Object { "---" }) -join "|") + "|") | Out-Null
  foreach ($row in $Rows) {
    $lines.Add("| " + ($row -join " | ") + " |") | Out-Null
  }
  return ($lines -join [Environment]::NewLine)
}

$resolvedRoot = Resolve-SpiralRoot -ExplicitRoot $SpiralRoot
$shortRoot = (cmd /c "for %A in (""$resolvedRoot"") do @echo %~sA").Trim()

$allFiles = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File -Force -ErrorAction SilentlyContinue
$allDirs = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -Directory -Force -ErrorAction SilentlyContinue
$htmlFiles = $allFiles | Where-Object { $_.Extension -ieq ".html" }

$extRows = @(
  $allFiles |
  Group-Object Extension |
  Sort-Object Count -Descending |
  Select-Object -First 15 |
  ForEach-Object {
    $ext = if ([string]::IsNullOrWhiteSpace($_.Name)) { "[no_ext]" } else { $_.Name }
    [PSCustomObject]@{
      Extension = $ext
      Count = "$($_.Count)"
    }
  }
)

$htmlRows = @()
foreach ($f in $htmlFiles) {
  $q = Get-HtmlQuality -Path $f.FullName -Length $f.Length
  $htmlRows += [PSCustomObject]@{
    Path = $f.FullName
    Size = $f.Length
    Quality = $q
  }
}

$qualityCounts = @{
  workable = 0
  insufficient_code = 0
  skeleton_only = 0
  empty_or_stub = 0
  unreadable = 0
}
foreach ($row in $htmlRows) {
  if ($qualityCounts.ContainsKey($row.Quality)) {
    $qualityCounts[$row.Quality]++
  }
}

$rootPrefix = $resolvedRoot.TrimEnd("\") + "\"
$emptyExamples = @(
  $htmlRows |
  Where-Object { $_.Quality -eq "empty_or_stub" } |
  Sort-Object Size, Path |
  Select-Object -First 5 |
  ForEach-Object {
    $p = $_.Path
    if ($p.StartsWith($rootPrefix)) { $p = $p.Substring($rootPrefix.Length) }
    [PSCustomObject]@{
      File = $p
      Size = "$($_.Size)"
    }
  }
)

$workableExamples = @(
  $htmlRows |
  Where-Object { $_.Quality -eq "workable" } |
  Sort-Object Size -Descending |
  Select-Object -First 5 |
  ForEach-Object {
    $p = $_.Path
    if ($p.StartsWith($rootPrefix)) { $p = $p.Substring($rootPrefix.Length) }
    [PSCustomObject]@{
      File = $p
      Size = "$($_.Size)"
    }
  }
)

$scanDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$repoRoot = Split-Path -Path $PSScriptRoot -Parent
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "docs"))) {
  $repoRoot = "C:\Users\LENOVO\Desktop\castle"
}
$llmSummary = Get-LlmChatLayerSummary -RepoRoot $repoRoot

$narrativeRows = @(
  @("Boundary rule", "docs/SPIRALMMO_WAITING_ROOM_AGENT_TRAINING_PROTOCOL_V0.md", "observation != execution discipline"),
  @("HTML quality lane", "docs/SPIRALMMO_HTML_OPERABILITY_REPORT_V0.md", "blank/weak page triage and recovery"),
  @("Drop-in intake", "docs/SPIRALMMO_DROP_IN_ARCHIVE_MECHANISM_V0.md", "Drive/LLM exports into controlled intake"),
  @("Archive inventory", "docs/SPIRALMMO_DESKTOP_ARCHIVE_INVENTORY_V0.md", "macro archive shape and cleaning taxonomy"),
  @("LLM chat layers", "docs/LLM_CHAT_LAYER_TONOM_WRITE_POLICY_V0.md", "10-layer scan + tonom write permissions on ingest"),
  @("LLM chat index", "docs/archive/llm-chats/LLM_CHAT_ARCHIVE_INDEX_V0.md", "paste/scan inbox and primary layer tags")
)

$md = @()
$md += "# SPIRALMMO Archive Table (V0)"
$md += ""
$md += "_Auto-generated by scripts/update-spiralmmo-archive-table.ps1_"
$md += ""
$md += "Scope path: $resolvedRoot  "
$md += "Short path: $shortRoot  "
$md += "Scan date: $scanDate"
$md += ""
$md += "## Snapshot"
$md += ""
$md += (To-MarkdownTable -Headers @("Metric", "Value") -Rows @(
    @("Total files", "$($allFiles.Count)"),
    @("Total directories", "$($allDirs.Count)"),
    @("HTML files", "$($htmlFiles.Count)")
  ))
$md += ""
$md += "## HTML Operability"
$md += ""
$md += (To-MarkdownTable -Headers @("Status", "Count", "Note") -Rows @(
    @("workable", "$($qualityCounts.workable)", "Runnable candidates"),
    @("insufficient_code", "$($qualityCounts.insufficient_code)", "Thin/skeleton page"),
    @("skeleton_only", "$($qualityCounts.skeleton_only)", "Structure exists, weak runtime"),
    @("empty_or_stub", "$($qualityCounts.empty_or_stub)", "Blank/near-blank page"),
    @("unreadable", "$($qualityCounts.unreadable)", "Read error / encoding issue")
  ))
$md += ""
$md += "## Extension Distribution (Top)"
$md += ""
$md += (To-MarkdownTable -Headers @("Extension", "Count") -Rows @(
    $extRows | ForEach-Object { ,@($_.Extension, $_.Count) }
  ))
$md += ""
$md += "## Empty/Stub HTML Examples"
$md += ""
$md += (To-MarkdownTable -Headers @("File", "Size (bytes)") -Rows @(
    $emptyExamples | ForEach-Object { ,@($_.File, $_.Size) }
  ))
$md += ""
$md += "## Workable HTML Examples"
$md += ""
$md += (To-MarkdownTable -Headers @("File", "Size (bytes)") -Rows @(
    $workableExamples | ForEach-Object { ,@($_.File, $_.Size) }
  ))
$md += ""
$md += "## LLM Chat Layer Summary (linked)"
$md += ""
$md += (To-MarkdownTable -Headers @("Metric", "Value") -Rows @(
    @("Inbox files", "$($llmSummary.inbox_count)"),
    @("Total ingested", "$($llmSummary.total_ingested)"),
    @("Last batch", "$(if ($llmSummary.last_batch_id) { $llmSummary.last_batch_id } else { '-' })"),
    @("Policy updated (UTC)", "$(if ($llmSummary.last_updated_utc) { $llmSummary.last_updated_utc } else { '-' })")
  ))
$md += ""
$md += "## LLM Layer Hits (10 katman)"
$md += ""
$md += (To-MarkdownTable -Headers @("Layer", "Label", "Hits") -Rows @(
    $llmSummary.layer_rows | ForEach-Object { ,@($_.Layer, $_.Label, $_.Hits) }
  ))
$md += ""
$md += "## Tonom Write Matrix"
$md += ""
$md += (To-MarkdownTable -Headers @("Layer", "Staging write", "Canonical write", "Execution write") -Rows @(
    $llmSummary.tonom_rows | ForEach-Object { ,@($_.Layer, $_.Staging, $_.Canonical, $_.Execution) }
  ))
$md += ""
$md += "_All layers default: scan=yes, annotate=yes. Execution write always blocked for chat lane._"
$md += ""
$md += "## Archive Intelligence (v0)"
$md += ""
$md += "| Report | Path |"
$md += "|---|---|"
$md += "| Temporal heatmap | docs/archive/spiralmmo-intelligence/TEMPORAL_LAYER_HEATMAP_V0.md |"
$md += "| Meaning compression (50) | docs/archive/spiralmmo-intelligence/MEANING_COMPRESSION_50_V0.md |"
$md += "| Narrative anomalies | docs/archive/spiralmmo-intelligence/NARRATIVE_ANOMALY_REPORT_V0.md |"
$md += ""
$md += "_Generate: `scripts/run-spiralmmo-archive-intelligence.ps1`_"
$md += ""
$md += "## Narrative Connections"
$md += ""
$md += (To-MarkdownTable -Headers @("Theme", "Document", "Connection") -Rows $narrativeRows)
$md += ""

$outDir = Split-Path -Path $OutputPath -Parent
if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

Set-Content -LiteralPath $OutputPath -Value ($md -join [Environment]::NewLine) -Encoding UTF8
Write-Output "Updated: $OutputPath"
