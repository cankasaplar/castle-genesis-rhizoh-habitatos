param(
  [string]$SpiralRoot,
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [int]$TargetClusters = 50,
  [switch]$Fast
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\spiralmmo-archive-intelligence.ps1")

function Resolve-SpiralRootLocal {
  param([string]$ExplicitRoot)
  if ($ExplicitRoot -and (Test-Path -LiteralPath $ExplicitRoot)) {
    return (Resolve-Path -LiteralPath $ExplicitRoot).Path
  }
  $desktop = Join-Path $env:USERPROFILE "Desktop"
  $candidate = Get-ChildItem -LiteralPath $desktop -Directory |
    Where-Object { $_.Name -match "SP.*MMO" } |
    Select-Object -First 1
  if (-not $candidate) { throw "SPIRALMMO root not found. Pass -SpiralRoot." }
  return $candidate.FullName
}

function Get-HtmlQualityLocal {
  param([string]$Path, [long]$Length)
  if ($Length -le 200) { return "empty_or_stub" }
  $raw = ""
  try { $raw = Get-Content -LiteralPath $Path -Raw } catch { return "unreadable" }
  if (-not $raw) { return "empty_or_stub" }
  $t = $raw.Trim()
  if ([string]::IsNullOrWhiteSpace($t)) { return "empty_or_stub" }
  $score = 0
  if ($t -match "<html") { $score++ }
  if ($t -match "<body") { $score++ }
  if ($t -match "<script") { $score++ }
  if ($t -match "<style|<link") { $score++ }
  if ($t -match "<canvas|<main|<section|<div") { $score++ }
  if ($score -le 1 -or $Length -lt 1200) { return "insufficient_code" }
  if ($score -eq 2) { return "skeleton_only" }
  return "workable"
}

$resolvedRoot = Resolve-SpiralRootLocal -ExplicitRoot $SpiralRoot
$llmRoot = Join-Path $RepoRoot "docs\archive\llm-chats"
$outDir = Join-Path $RepoRoot "docs\archive\spiralmmo-intelligence"
if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 1) Temporal heatmap
$events = @(Read-LlmInboxEvents -LlmArchiveRoot $llmRoot)
$heatmap = Build-TemporalHeatmap -Events $events
$heatmapMd = Join-Path $outDir "TEMPORAL_LAYER_HEATMAP_V0.md"
$heatmapJson = Join-Path $outDir "TEMPORAL_LAYER_HEATMAP_V0.json"

$hmLines = @(
  "# Temporal Layer Heatmap (V0)",
  "",
  "_Auto-generated: $stamp",
  "",
  "Source: LLM chat inbox frontmatter (`archived_at_utc`, `layer_hits`).",
  "",
  "Legend: `.` none · `1` low · `2` medium · `3` high · `4` peak",
  "",
  (Render-HeatmapAscii -Heatmap $heatmap),
  ""
)
if ($heatmap.days.Count -eq 0) {
  $hmLines += "_No temporal events yet. Paste chats to populate heatmap._"
}
Set-Content -LiteralPath $heatmapMd -Value ($hmLines -join [Environment]::NewLine) -Encoding UTF8
$heatmap | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $heatmapJson -Encoding UTF8

# 2) Meaning compression (path-semantics v0)
$allFiles = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File -Force -ErrorAction SilentlyContinue
$prefix = $resolvedRoot.TrimEnd('\') + '\'
$compression = Build-MeaningCompression -Files $allFiles -RootPrefix $prefix -TargetClusters $TargetClusters
$compMd = Join-Path $outDir "MEANING_COMPRESSION_50_V0.md"
$compJson = Join-Path $outDir "MEANING_COMPRESSION_50_V0.json"

$clusterRows = @(
  $compression.clusters | ForEach-Object {
    ,@($_.cluster_id, "$($_.file_count)", $_.signature, ($_.sample_paths -join '; '))
  }
)
$compLines = @(
  "# Meaning Compression (V0)",
  "",
  "_Auto-generated: $stamp",
  "",
  "Method: path-semantics signature clustering (v0 heuristic, not embedding model).",
  "",
  (To-MdTable -Headers @("Cluster", "Files", "Signature", "Samples") -Rows $clusterRows),
  "",
  "Total files: $($compression.total_files)",
  "Clusters shown: $($compression.clusters.Count) / target $($compression.target_clusters)",
  ""
)
Set-Content -LiteralPath $compMd -Value ($compLines -join [Environment]::NewLine) -Encoding UTF8
$compression | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $compJson -Encoding UTF8

# 3) Narrative anomaly detection (fast path heuristics for HTML)
$htmlRows = @(
  $allFiles |
    Where-Object { $_.Extension -ieq '.html' -and $_.FullName -notmatch '\\node_modules\\' } |
    ForEach-Object {
      $rel = $_.FullName
      if ($rel.StartsWith($prefix)) { $rel = $rel.Substring($prefix.Length) }
      $q = if ($_.Length -le 200) { 'empty_or_stub' } elseif ($_.Length -lt 1200) { 'insufficient_code' } else { 'workable' }
      [PSCustomObject]@{ Path = $rel; Quality = $q }
    }
)
$skipDupes = [bool]$Fast.IsPresent
$anomalies = @(Build-NarrativeAnomalies -SpiralRoot $resolvedRoot -LlmArchiveRoot $llmRoot -HtmlRows $htmlRows -TemporalEvents $events -AllFiles $allFiles -RootPrefix $prefix -SkipDuplicateScan $skipDupes)
$anomMd = Join-Path $outDir "NARRATIVE_ANOMALY_REPORT_V0.md"
$anomJson = Join-Path $outDir "NARRATIVE_ANOMALY_REPORT_V0.json"

$anomRows = @(
  $anomalies |
    Sort-Object @{ Expression = { switch ($_.severity) { 'high' { 0 } 'medium' { 1 } default { 2 } } } }, signal_count -Descending |
    Select-Object -First 80 |
    ForEach-Object { ,@($_.severity, $_.source, $_.reference, "$($_.signal_count)", $_.signals) }
)
$anomLines = @(
  "# Narrative Anomaly Report (V0)",
  "",
  "_Auto-generated: $stamp",
  "",
  "Scope: bozuk ayna / broken mirror class signals (interpretation lane only).",
  "",
  (To-MdTable -Headers @("Severity", "Source", "Reference", "Signals", "Detail") -Rows $anomRows),
  "",
  "Total anomalies flagged: $($anomalies.Count)",
  ""
)
Set-Content -LiteralPath $anomMd -Value ($anomLines -join [Environment]::NewLine) -Encoding UTF8
$anomalies | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $anomJson -Encoding UTF8

Write-Output "INTELLIGENCE_OK=true"
Write-Output "HEATMAP=$heatmapMd"
Write-Output "COMPRESSION=$compMd"
Write-Output "ANOMALIES=$anomMd"
