function Get-LayerOrder {
  return @(
    'file', 'text', 'comment', 'meaning', 'fun', 'music', 'art', 'sport', 'competition', 'real_layer'
  )
}

function Get-BrokenMirrorSignals {
  return @(
    'bozuk ayna', 'broken mirror', 'observation != execution', 'observe -> execute',
    'execution_write', 'canonical_write_without_human_gate', 'blank page', 'empty_or_stub',
    'drift', 'breach', 'mismatch', 'quarantine', 'false positive', 'yalan', 'semantic creep',
    'authority escalation', 'cross-state', 'sharedstate', 'white page', 'beyaz sayfa'
  )
}

function Read-LlmInboxEvents {
  param([string]$LlmArchiveRoot)
  $inbox = Join-Path $LlmArchiveRoot 'inbox'
  if (-not (Test-Path -LiteralPath $inbox)) { return @() }

  $events = @()
  Get-ChildItem -LiteralPath $inbox -File -Filter '*.md' -ErrorAction SilentlyContinue | ForEach-Object {
    $raw = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $raw) { return }
    $utc = ''
    if ($raw -match 'archived_at_utc:\s*(\S+)') { $utc = $Matches[1] }
    $hits = @{}
    if ($raw -match 'layer_hits:\s*(.*)') {
      $part = $Matches[1].Trim()
      foreach ($pair in ($part -split ';')) {
        if ($pair -match '^([^=]+)=(\d+)$') {
          $hits[$Matches[1]] = [int]$Matches[2]
        }
      }
    }
    $events += [PSCustomObject]@{
      timestamp_utc = if ($utc) { [datetime]$utc } else { $_.LastWriteTimeUtc }
      file = $_.Name
      layer_hits = $hits
    }
  }
  return $events
}

function Build-TemporalHeatmap {
  param([object[]]$Events)

  $buckets = @{}
  foreach ($e in $Events) {
    $day = $e.timestamp_utc.ToString('yyyy-MM-dd')
    if (-not $buckets.ContainsKey($day)) {
      $buckets[$day] = @{}
      foreach ($layer in (Get-LayerOrder)) { $buckets[$day][$layer] = 0 }
    }
    foreach ($layer in (Get-LayerOrder)) {
      if ($e.layer_hits.ContainsKey($layer)) {
        $buckets[$day][$layer] += [int]$e.layer_hits[$layer]
      }
    }
  }

  $days = @($buckets.Keys | Sort-Object)
  $matrix = @()
  foreach ($layer in (Get-LayerOrder)) {
    $row = [ordered]@{ layer = $layer; cells = @() }
    $max = 0
    foreach ($day in $days) {
      $v = [int]$buckets[$day][$layer]
      if ($v -gt $max) { $max = $v }
      $row.cells += [PSCustomObject]@{ day = $day; value = $v }
    }
    $row.max = $max
    $matrix += [PSCustomObject]$row
  }

  return [PSCustomObject]@{
    days = $days
    matrix = $matrix
  }
}

function Render-HeatmapAscii {
  param($Heatmap)
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('| Layer | ' + ($Heatmap.days -join ' | ') + ' |') | Out-Null
  $lines.Add('|' + ((@('---') + ($Heatmap.days | ForEach-Object { '---' })) -join '|') + '|') | Out-Null

  foreach ($row in $Heatmap.matrix) {
    $cells = @()
    foreach ($c in $row.cells) {
      $v = [int]$c.value
      if ($v -eq 0) { $cells += '.' }
      elseif ($v -le 2) { $cells += '1' }
      elseif ($v -le 5) { $cells += '2' }
      elseif ($v -le 10) { $cells += '3' }
      else { $cells += '4' }
    }
    $lines.Add('| ' + $row.layer + ' | ' + ($cells -join ' | ') + ' |') | Out-Null
  }
  return ($lines -join [Environment]::NewLine)
}

function Get-SizeBucket {
  param([long]$Bytes)
  if ($Bytes -lt 1024) { return 'xs' }
  if ($Bytes -lt 10240) { return 'sm' }
  if ($Bytes -lt 102400) { return 'md' }
  if ($Bytes -lt 1048576) { return 'lg' }
  return 'xl'
}

function Get-PathSemanticTokens {
  param([string]$RelativePath)
  $lower = $RelativePath.ToLowerInvariant()
  $tokens = New-Object System.Collections.Generic.List[string]
  $parts = $lower -split '[\\/]'
  if ($parts.Count -ge 1) { $tokens.Add($parts[0]) | Out-Null }
  if ($parts.Count -ge 2) { $tokens.Add($parts[1]) | Out-Null }
  $ext = [System.IO.Path]::GetExtension($lower)
  if ($ext) { $tokens.Add("ext$ext") | Out-Null }

  $hints = @{
    node = 'runtime_vendor'
    html = 'web_surface'
    spiral = 'spiral_core'
    vitram = 'dna_scene'
    wolf = 'test_env'
    dashboard = 'dashboard'
    zip = 'bundle'
    png = 'media'
    md = 'docs'
    json = 'data'
    real = 'real_layer'
    chat = 'llm_lane'
    archive = 'archive_lane'
  }
  foreach ($k in $hints.Keys) {
    if ($lower.Contains($k)) { $tokens.Add($hints[$k]) | Out-Null }
  }
  return ($tokens | Select-Object -Unique)
}

function Build-MeaningCompression {
  param(
    [System.IO.FileInfo[]]$Files,
    [string]$RootPrefix,
    [int]$TargetClusters = 50
  )

  $counts = @{}
  $samples = @{}
  foreach ($f in $Files) {
    if ($f.FullName -match '\\node_modules\\') { continue }
    $rel = $f.FullName
    if ($rel.StartsWith($RootPrefix)) { $rel = $rel.Substring($RootPrefix.Length) }
    $tokens = Get-PathSemanticTokens -RelativePath $rel
    $sig = ($tokens | Sort-Object) -join '|'
    if ([string]::IsNullOrWhiteSpace($sig)) { $sig = 'misc_unknown' }
    $bucket = Get-SizeBucket -Bytes $f.Length
    $key = "$sig|$bucket"
    if (-not $counts.ContainsKey($key)) {
      $counts[$key] = 0
      $samples[$key] = New-Object System.Collections.Generic.List[string]
    }
    $counts[$key] = $counts[$key] + 1
    if ($samples[$key].Count -lt 3) { $samples[$key].Add($rel) | Out-Null }
  }

  $grouped = $counts.GetEnumerator() |
    Sort-Object Value -Descending |
    ForEach-Object {
      [PSCustomObject]@{
        Name = $_.Key
        Count = $_.Value
        SamplePaths = $samples[$_.Key]
      }
    }

  $clusters = @()
  $idx = 0
  $topN = [Math]::Max(1, $TargetClusters - 1)
  foreach ($g in $grouped) {
    if ($clusters.Count -ge $topN) { break }
    $idx++
    $clusters += [PSCustomObject]@{
      cluster_id = ('C{0:D2}' -f $idx)
      signature = [string]$g.Name
      file_count = $g.Count
      sample_paths = @($g.SamplePaths)
    }
  }

  $assigned = ($clusters | Measure-Object -Property file_count -Sum).Sum
  $remainder = [Math]::Max(0, $Files.Count - $assigned)
  if ($remainder -gt 0) {
    $clusters += [PSCustomObject]@{
      cluster_id = ('C{0:D2}' -f ($idx + 1))
      signature = 'OTHER|mixed_tail'
      file_count = $remainder
      sample_paths = @()
    }
  }

  return [PSCustomObject]@{
    total_files = $Files.Count
    target_clusters = $TargetClusters
    clusters = $clusters
    remainder_unassigned_estimate = $remainder
  }
}

function Test-BrokenMirrorAnomaly {
  param(
    [string]$Text,
    [string]$Source,
    [string]$Ref
  )
  $signals = Get-BrokenMirrorSignals
  $lower = $Text.ToLowerInvariant()
  $hits = @()
  foreach ($s in $signals) {
    if ($lower.Contains($s.ToLowerInvariant())) {
      $hits += $s
    }
  }
  if ($hits.Count -eq 0) { return $null }

  $severity = if ($hits.Count -ge 4) { 'high' } elseif ($hits.Count -ge 2) { 'medium' } else { 'low' }
  return [PSCustomObject]@{
    source = $Source
    reference = $Ref
    severity = $severity
    signal_count = $hits.Count
    signals = ($hits -join ', ')
  }
}

function Build-NarrativeAnomalies {
  param(
    [string]$SpiralRoot,
    [string]$LlmArchiveRoot,
    [object[]]$HtmlRows,
    [object[]]$TemporalEvents,
    [System.IO.FileInfo[]]$AllFiles,
    [string]$RootPrefix,
    [bool]$SkipDuplicateScan = $false
  )

  $anomalies = New-Object System.Collections.Generic.List[object]

  # LLM chats
  $inbox = Join-Path $LlmArchiveRoot 'inbox'
  if (Test-Path -LiteralPath $inbox) {
    Get-ChildItem -LiteralPath $inbox -File -Filter '*.md' | ForEach-Object {
      $raw = Get-Content -LiteralPath $_.FullName -Raw
      $a = Test-BrokenMirrorAnomaly -Text $raw -Source 'llm_chat' -Ref $_.Name
      if ($a) { $anomalies.Add($a) | Out-Null }
    }
  }

  # HTML operability failures
  foreach ($h in ($HtmlRows | Where-Object { $_.Quality -in @('empty_or_stub', 'insufficient_code') } | Select-Object -First 40)) {
    $anomalies.Add([PSCustomObject]@{
      source = 'html_surface'
      reference = $h.Path
      severity = if ($h.Quality -eq 'empty_or_stub') { 'high' } else { 'medium' }
      signal_count = 1
      signals = $h.Quality
    }) | Out-Null
  }

  # Temporal spike: one day dominates all hits
  if ($TemporalEvents.Count -gt 0) {
    $byDay = $TemporalEvents | Group-Object { $_.timestamp_utc.ToString('yyyy-MM-dd') }
    $maxDay = $byDay | Sort-Object Count -Descending | Select-Object -First 1
    if ($maxDay.Count -ge 3 -and $byDay.Count -gt 1) {
      $anomalies.Add([PSCustomObject]@{
        source = 'temporal_skew'
        reference = $maxDay.Name
        severity = 'low'
        signal_count = $maxDay.Count
        signals = 'single_day_ingest_dominance'
      }) | Out-Null
    }
  }

  # Duplicate basename across archive (broken mirror: twin realities)
  if ($SkipDuplicateScan) { return $anomalies }
  $dupes = $AllFiles |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    Group-Object Name |
    Where-Object { $_.Count -ge 4 } |
    Sort-Object Count -Descending |
    Select-Object -First 15
  foreach ($d in $dupes) {
    $anomalies.Add([PSCustomObject]@{
      source = 'duplicate_basename'
      reference = $d.Name
      severity = if ($d.Count -ge 10) { 'medium' } else { 'low' }
      signal_count = $d.Count
      signals = 'possible_mirror_duplicate_paths'
    }) | Out-Null
  }

  return $anomalies
}

function To-MdTable {
  param([string[]]$Headers, [object[][]]$Rows)
  $o = @("| " + ($Headers -join " | ") + " |")
  $o += "|" + (($Headers | ForEach-Object { "---" }) -join "|") + "|"
  foreach ($r in $Rows) {
    $o += "| " + ($r -join " | ") + " |"
  }
  return ($o -join [Environment]::NewLine)
}
