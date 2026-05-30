. (Join-Path $PSScriptRoot 'llm-chat-layer-scan.ps1')
. (Join-Path $PSScriptRoot 'llm-chat-structure-segment.ps1')

function Get-ArchiveBodyText {
  param([string]$Raw)
  if ($Raw -match '(?s)^---\r?\n.*?\r?\n---\r?\n(.*)$') {
    return $Matches[1].Trim()
  }
  return $Raw.Trim()
}

function Get-ArchiveMeta {
  param([string]$Raw)
  $meta = @{ source_hint = 'unknown'; quality = 'unknown'; layer_primary = '' }
  if ($Raw -match 'source_hint:\s*(\S+)') { $meta.source_hint = $Matches[1] }
  if ($Raw -match 'quality:\s*(\S+)') { $meta.quality = $Matches[1] }
  if ($Raw -match 'layer_primary:\s*(.*)') { $meta.layer_primary = $Matches[1].Trim() }
  return $meta
}

function Test-MeaningLayerLine {
  param([string]$Line)
  $lower = $Line.ToLowerInvariant()
  $keys = @(
    'anlam', 'meaning', 'semantic', 'kavram', 'ontoloj', 'narrative', 'yorumlama',
    'mimari', 'architecture', 'rhizoh', 'frozen', 'görev', 'gorev', 'kural', 'katman',
    'model', 'orchestrator', 'waiting room', 'kapasite', 'medeniyet', 'habitat'
  )
  foreach ($k in $keys) {
    if ($lower.Contains($k)) { return $true }
  }
  return $false
}

function Get-ActionPatterns {
  return @(
    '(?i)\b(yapılacaklar?|yapilacaklar?|todo|to-do|action item|next step|sonraki adım|sonraki adim|bir sonraki adımda|bir sonraki adimda)\b',
    '(?i)^\s*[-*]\s*\[[\sxX]\]\s+',
    '(?i)^\s*\d+[\.\)]\s+\S',
    '(?i)\bgörev:\s*',
    '(?i)\bkritik kural\b',
    '(?i)\b(çalıştır|calistir|kontrol et|ekle|tamamla|hazırla|deploy|implement|düzelt|duzelt|gözden geçir|gozden gecir|netleştir|netlestir|sıkılaştır|sikilastir|simüle|simule|çiz|ciz)\b',
    '(?i)\b(ihtiyacın|yapmalı|yapmaliyiz|yapalım|yapalim|unutma|hatırla|hatirla)\b',
    '(?i)(istersen|istersek).{0,80}(adım|adim|sonraki|yapabil|çizebil|cizebil|simüle)',
    '(?i)\b⚠️\b',
    '(?i)\b(pratikte|şu an|su an).{0,40}(yap|netleştir|netlestir|gözden)\b'
  )
}

function Get-IdeaPatterns {
  return @(
    '(?i)\b(bence|aslında|aslinda|çünkü|cunku|radikal|felsefi|medeniyet|ontolojik|vizyon)\b',
    '(?i)\b(ilke|prensip|manifesto|paradigma|arketip)\b',
    '(?i)\b(insan|zihin|güven|guven|dürüstlük|durustluk)\b.*\b(sistem|platform|internet)\b'
  )
}

function Get-QuestionPatterns {
  return @(
    '(?i)\?',
    '(?i)\b(nasıl|nasil|neden|mi\?|mı\?|mu\?|mü\?)\b'
  )
}

function Score-Segment {
  param([string]$Segment)

  $seg = $Segment.Trim()
  if ($seg.Length -lt 12) { return $null }
  if ($seg -match '(?i)^(rhizoh|llm sohbet|masaustu|canonical belge)') { return $null }
  if ($seg -match '(?m)^```') { return $null }
  if ((Test-LooksLikeCodeLine -Line $seg) -and $seg -notmatch '(?i)\b(yap|ekle|kontrol|netleştir|netlestir|görev|gorev)\b') { return $null }

  $action = 0
  $idea = 0
  $question = 0
  foreach ($p in (Get-ActionPatterns)) {
    if ($seg -match $p) { $action += 2 }
  }
  foreach ($p in (Get-IdeaPatterns)) {
    if ($seg -match $p) { $idea += 1 }
  }
  foreach ($p in (Get-QuestionPatterns)) {
    if ($seg -match $p) { $question += 1 }
  }
  if (Test-MeaningLayerLine -Line $seg) { $action += 1; $idea += 1 }

  $layerScan = Scan-ChatLayers -Text $seg
  if ($layerScan.layer_hits.meaning -gt 0) { $idea += 1 }
  if ($layerScan.layer_hits.comment -gt 0) { $action += 1 }

  $kind = 'noise'
  if ($action -ge 3 -and $action -ge $idea) { $kind = 'action' }
  elseif ($question -ge 2 -and $action -lt 2) { $kind = 'question' }
  elseif ($idea -ge 2) { $kind = 'idea' }
  elseif ($action -ge 2) { $kind = 'action' }
  elseif ($idea -ge 1 -or $question -ge 1) { $kind = 'idea' }

  if ($kind -eq 'noise') { return $null }

  $confidence = 'low'
  if ($action -ge 4) { $confidence = 'high' }
  elseif ($action -ge 2 -or $idea -ge 3) { $confidence = 'medium' }

  [PSCustomObject]@{
    kind = $kind
    confidence = $confidence
    text = ($seg -replace '\s+', ' ').Trim()
    action_score = $action
    idea_score = $idea
  }
}

function Split-ChatSegments {
  param([string]$Body)

  if (Get-Command Get-ProseWithoutFences -ErrorAction SilentlyContinue) {
    $Body = Get-ProseWithoutFences -Text $Body
  }

  $parts = @()
  $blocks = $Body -split "(\r?\n){2,}"
  foreach ($b in $blocks) {
    $t = $b.Trim()
    if ($t.Length -ge 12) { $parts += $t }
  }
  # Single-line bullets under dense paste
  $lines = $Body -split "`r?`n"
  $buf = New-Object System.Collections.Generic.List[string]
  foreach ($line in $lines) {
    $trim = $line.Trim()
    if ($trim -match '^(?i)([-*•]|\d+[\.\)])\s+\S' -and $trim.Length -lt 220) {
      if ($buf.Count -gt 0) {
        $parts += (($buf -join ' ') -replace '\s+', ' ').Trim()
        $buf.Clear()
      }
      $parts += $trim
    } elseif ($trim.Length -eq 0) {
      if ($buf.Count -gt 0) {
        $parts += (($buf -join ' ') -replace '\s+', ' ').Trim()
        $buf.Clear()
      }
    } else {
      $buf.Add($trim) | Out-Null
    }
  }
  if ($buf.Count -gt 0) {
    $parts += (($buf -join ' ') -replace '\s+', ' ').Trim()
  }
  return @($parts | Where-Object { $_.Length -ge 12 } | Select-Object -Unique)
}

function Normalize-ActionText {
  param([string]$Text)
  $t = $Text.Trim()
  $t = $t -replace '^[-*•]\s+', ''
  $t = $t -replace '^\d+[\.\)]\s+', ''
  if ($t.Length -gt 320) { $t = $t.Substring(0, 317) + '...' }
  return $t
}

function Extract-ChatActionItems {
  param([string]$Body)

  $segments = Split-ChatSegments -Body $Body
  $actions = New-Object System.Collections.Generic.List[object]
  $ideas = New-Object System.Collections.Generic.List[object]
  $questions = New-Object System.Collections.Generic.List[object]
  $seen = @{}

  foreach ($seg in $segments) {
    $scored = Score-Segment -Segment $seg
    if (-not $scored) { continue }
    $norm = Normalize-ActionText -Text $scored.text
    $key = $norm.ToLowerInvariant()
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true

    $item = [PSCustomObject]@{
      kind = $scored.kind
      confidence = $scored.confidence
      text = $norm
    }
    switch ($scored.kind) {
      'action' { $actions.Add($item) | Out-Null }
      'question' { $questions.Add($item) | Out-Null }
      default { $ideas.Add($item) | Out-Null }
    }
  }

  [PSCustomObject]@{
    actions = @($actions | Sort-Object { switch ($_.confidence) { 'high' { 0 } 'medium' { 1 } default { 2 } } }, { $_.text })
    ideas = @($ideas | Sort-Object confidence, text)
    questions = @($questions | Sort-Object confidence, text)
  }
}

function Format-ActionItemsMarkdown {
  param(
    [string]$SourceFile,
    [object]$Meta,
    [object]$Extracted,
    [string]$SourceHintOverride,
    [int]$CodeBlockCount = -1,
    [int]$FileRefCount = -1
  )

  $src = if ($SourceHintOverride) { $SourceHintOverride } else { $Meta.source_hint }
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('# Chat action digest (auto V0)') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("_Non-authoritative. Review before any execution. Not canonical._") | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("| Field | Value |") | Out-Null
  $lines.Add("|---|---|") | Out-Null
  $lines.Add("| source_file | ``$SourceFile`` |") | Out-Null
  $lines.Add("| source_hint | $src |") | Out-Null
  $lines.Add("| quality | $($Meta.quality) |") | Out-Null
  $lines.Add("| layer_primary | $($Meta.layer_primary) |") | Out-Null
  $lines.Add("| extracted_at_utc | $((Get-Date).ToUniversalTime().ToString('o')) |") | Out-Null
  $lines.Add('') | Out-Null

  if ($CodeBlockCount -ge 0) {
    $lines.Add("| code_blocks_parsed | $CodeBlockCount |") | Out-Null
    $lines.Add("| file_refs_parsed | $FileRefCount |") | Out-Null
    $lines.Add('') | Out-Null
  }

  $lines.Add('## Yapilacaklar (review, sonra tick)') | Out-Null
  $lines.Add('') | Out-Null
  if ($Extracted.actions.Count -eq 0) {
    $lines.Add('_No high-confidence actions detected; see ideas/questions._') | Out-Null
  } else {
    foreach ($a in $Extracted.actions) {
      $lines.Add("- [ ] ($($a.confidence)) $($a.text)") | Out-Null
    }
  }

  $lines.Add('') | Out-Null
  $lines.Add('## Fikirler (ayristirilmis; execution degil)') | Out-Null
  $lines.Add('') | Out-Null
  if ($Extracted.ideas.Count -eq 0) {
    $lines.Add('_None._') | Out-Null
  } else {
    $maxIdeas = [Math]::Min(40, $Extracted.ideas.Count)
    for ($i = 0; $i -lt $maxIdeas; $i++) {
      $lines.Add("- ($($Extracted.ideas[$i].confidence)) $($Extracted.ideas[$i].text)") | Out-Null
    }
    if ($Extracted.ideas.Count -gt $maxIdeas) {
      $lines.Add("- _... +$($Extracted.ideas.Count - $maxIdeas) more ideas omitted_") | Out-Null
    }
  }

  $lines.Add('') | Out-Null
  $lines.Add('## Acik sorular') | Out-Null
  $lines.Add('') | Out-Null
  if ($Extracted.questions.Count -eq 0) {
    $lines.Add('_None._') | Out-Null
  } else {
    $maxQ = [Math]::Min(25, $Extracted.questions.Count)
    for ($i = 0; $i -lt $maxQ; $i++) {
      $lines.Add("- ($($Extracted.questions[$i].confidence)) $($Extracted.questions[$i].text)") | Out-Null
    }
  }

  return ($lines -join [Environment]::NewLine)
}

function Write-ChatActionDigest {
  param(
    [string]$InboxPath,
    [string]$ActionItemsDir,
    [string]$SourceHintOverride,
    [string]$SegmentsDir
  )

  $raw = Get-Content -LiteralPath $InboxPath -Raw -Encoding UTF8
  $meta = Get-ArchiveMeta -Raw $raw
  $structured = Split-ChatStructuredContent -Text $raw
  Update-InboxStructuredMeta -InboxPath $InboxPath -Structured $structured

  if ($SegmentsDir) {
    $fileName = [IO.Path]::GetFileName($InboxPath)
    $segName = ($fileName -replace '\.md$', '') + '_segments.md'
    $segPath = Join-Path $SegmentsDir $segName
    $segMd = Format-SegmentsMarkdown -SourceFile $fileName -Structured $structured
    Set-Content -LiteralPath $segPath -Value $segMd -Encoding UTF8
  }

  $extracted = Extract-ChatActionItems -Body $structured.prose
  $extracted | Add-Member -NotePropertyName code_block_count -NotePropertyValue $structured.code_blocks.Count -Force
  $extracted | Add-Member -NotePropertyName file_ref_count -NotePropertyValue $structured.file_refs.Count -Force
  $fileName = [IO.Path]::GetFileName($InboxPath)
  $outName = ($fileName -replace '\.md$', '') + '_actions.md'
  $outPath = Join-Path $ActionItemsDir $outName
  $md = Format-ActionItemsMarkdown -SourceFile $fileName -Meta $meta -Extracted $extracted `
    -SourceHintOverride $SourceHintOverride `
    -CodeBlockCount $structured.code_blocks.Count -FileRefCount $structured.file_refs.Count
  Set-Content -LiteralPath $outPath -Value $md -Encoding UTF8

  [PSCustomObject]@{
    inbox_file = $fileName
    action_file = $outName
    path = $outPath
    action_count = $extracted.actions.Count
    idea_count = $extracted.ideas.Count
    question_count = $extracted.questions.Count
    source_hint = if ($SourceHintOverride) { $SourceHintOverride } else { $meta.source_hint }
  }
}

function Update-ActionItemsMaster {
  param(
    [string]$ArchiveRoot,
    [System.Collections.Generic.List[object]]$Records
  )

  $actionDir = Join-Path $ArchiveRoot 'action-items'
  $masterPath = Join-Path $ArchiveRoot 'LLM_CHAT_ACTION_ITEMS_MASTER_V0.md'
  $allDigests = @(Get-ChildItem -LiteralPath $actionDir -File -Filter '*_actions.md' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending)

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('# LLM Chat Action Items Master (V0)') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add('_Auto-generated. Observation lane only — human review before execution._') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("Updated: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))") | Out-Null
  $lines.Add("Digest files: $($allDigests.Count)") | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add('## Index') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add('| Inbox | Actions | Ideas | Questions | Digest |') | Out-Null
  $lines.Add('|---|---:|---:|---:|---|') | Out-Null

  foreach ($d in $allDigests) {
    $content = Get-Content -LiteralPath $d.FullName -Raw
    $inbox = ($d.Name -replace '_actions\.md$', '.md')
    $ac = ([regex]::Matches($content, '(?m)^- \[ \]')).Count
    $ic = ([regex]::Matches($content, '(?m)^- \(')).Count
    $qc = 0
    if ($content -match '(?s)## Acik sorular\r?\n\r?\n(.*?)(\r?\n## |\z)') {
      $qc = ([regex]::Matches($Matches[1], '(?m)^- \(')).Count
    }
    $lines.Add("| ``$inbox`` | $ac | $ic | $qc | ``$($d.Name)`` |") | Out-Null
  }

  $lines.Add('') | Out-Null
  $lines.Add('## Latest extractions (todo preview)') | Out-Null
  $lines.Add('') | Out-Null

  foreach ($rec in $Records) {
    if (-not (Test-Path -LiteralPath $rec.path)) { continue }
    $digest = Get-Content -LiteralPath $rec.path -Raw
    $lines.Add("### $($rec.inbox_file) ($($rec.source_hint))") | Out-Null
    $lines.Add('') | Out-Null
    $todoSection = if ($digest -match '(?s)## Yapilacaklar.*?\r?\n\r?\n(.*?)\r?\n\r?\n## ') { $Matches[1] } else { '' }
    if ([string]::IsNullOrWhiteSpace($todoSection)) {
      $lines.Add('_No todos extracted._') | Out-Null
    } else {
      $preview = @($todoSection -split "`n" | Where-Object { $_ -match '^- \[ \]' } | Select-Object -First 15)
      foreach ($p in $preview) { $lines.Add($p) | Out-Null }
      $total = ([regex]::Matches($todoSection, '(?m)^- \[ \]')).Count
      if ($total -gt 15) {
        $lines.Add("- _... +$($total - 15) more in ``$($rec.action_file)``_") | Out-Null
      }
    }
    $lines.Add('') | Out-Null
  }

  Set-Content -LiteralPath $masterPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
  return $masterPath
}
