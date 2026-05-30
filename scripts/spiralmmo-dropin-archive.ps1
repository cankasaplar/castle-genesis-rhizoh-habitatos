param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,
  [string]$ArchiveRoot,
  [ValidateSet("Copy", "Move")]
  [string]$Mode = "Copy"
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
    throw "SpiralMMO root not found on Desktop. Pass -ArchiveRoot explicitly."
  }
  return $candidate.FullName
}

function Get-CategoryByExtension {
  param([string]$Extension)
  $ext = $Extension.ToLowerInvariant()
  switch ($ext) {
    ".html" { "web_html" }
    ".htm" { "web_html" }
    ".js" { "code_js_ts" }
    ".ts" { "code_js_ts" }
    ".mjs" { "code_js_ts" }
    ".cjs" { "code_js_ts" }
    ".json" { "data_json" }
    ".md" { "docs_text" }
    ".txt" { "docs_text" }
    ".docx" { "docs_text" }
    ".pdf" { "docs_text" }
    ".png" { "media_images" }
    ".jpg" { "media_images" }
    ".jpeg" { "media_images" }
    ".gif" { "media_images" }
    ".webp" { "media_images" }
    ".mp4" { "media_video_audio" }
    ".m4a" { "media_video_audio" }
    ".mp3" { "media_video_audio" }
    ".wav" { "media_video_audio" }
    ".zip" { "archives_bundles" }
    ".rar" { "archives_bundles" }
    ".7z" { "archives_bundles" }
    default { "misc_unknown" }
  }
}

function Get-QuickHtmlQuality {
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

$resolvedSource = (Resolve-Path -LiteralPath $SourcePath).Path
$spiralRoot = Resolve-SpiralRoot -ExplicitRoot $ArchiveRoot

$dropRoot = Join-Path $spiralRoot "_DROP_IN"
$inboxRoot = Join-Path $dropRoot "inbox"
$stagingRoot = Join-Path $dropRoot "staging"
$logRoot = Join-Path $dropRoot "logs"
$manifestRoot = Join-Path $dropRoot "manifests"

foreach ($dir in @($dropRoot, $inboxRoot, $stagingRoot, $logRoot, $manifestRoot)) {
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$batchId = "dropin-$stamp"
$batchPath = Join-Path $inboxRoot $batchId
New-Item -ItemType Directory -Path $batchPath | Out-Null

$items = @()
if (Test-Path -LiteralPath $resolvedSource -PathType Leaf) {
  $items = ,(Get-Item -LiteralPath $resolvedSource)
} else {
  $items = Get-ChildItem -LiteralPath $resolvedSource -Recurse -File -Force
}

$rows = New-Object System.Collections.Generic.List[object]

foreach ($item in $items) {
  $ext = $item.Extension
  $category = Get-CategoryByExtension -Extension $ext
  $relative = $item.Name
  $targetDir = Join-Path $batchPath $category
  if (-not (Test-Path -LiteralPath $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
  }

  $targetPath = Join-Path $targetDir $relative

  if ($Mode -eq "Move") {
    Move-Item -LiteralPath $item.FullName -Destination $targetPath -Force
  } else {
    Copy-Item -LiteralPath $item.FullName -Destination $targetPath -Force
  }

  $htmlQuality = ""
  if ($ext -and ($ext.ToLowerInvariant() -in @(".html", ".htm"))) {
    $htmlQuality = Get-QuickHtmlQuality -Path $targetPath -Length $item.Length
  }

  $rows.Add([PSCustomObject]@{
      batch_id = $batchId
      timestamp_utc = (Get-Date).ToUniversalTime().ToString("o")
      source_path = $item.FullName
      target_path = $targetPath
      mode = $Mode
      extension = $ext
      category = $category
      size_bytes = $item.Length
      html_quality = $htmlQuality
    })
}

$csvPath = Join-Path $manifestRoot "$batchId-manifest.csv"
$jsonPath = Join-Path $manifestRoot "$batchId-manifest.json"
$logPath = Join-Path $logRoot "$batchId-summary.txt"

$rows | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
$rows | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$total = $rows.Count
$byCategory = @($rows | Group-Object category | Sort-Object Count -Descending)
$byHtml = @($rows | Where-Object { $_.html_quality -ne "" } | Group-Object html_quality | Sort-Object Count -Descending)

$summary = @()
$summary += "batch_id=$batchId"
$summary += "mode=$Mode"
$summary += "source=$resolvedSource"
$summary += "target_batch=$batchPath"
$summary += "total_files=$total"
$summary += "category_distribution:"
foreach ($g in $byCategory) {
  $summary += "  $($g.Name)=$($g.Count)"
}
if ($byHtml.Length -gt 0) {
  $summary += "html_quality_distribution:"
  foreach ($g in $byHtml) {
    $summary += "  $($g.Name)=$($g.Count)"
  }
}
$summary += "manifest_csv=$csvPath"
$summary += "manifest_json=$jsonPath"
$summaryText = $summary -join [Environment]::NewLine
$summaryText | Set-Content -LiteralPath $logPath -Encoding UTF8

Write-Output $summaryText
