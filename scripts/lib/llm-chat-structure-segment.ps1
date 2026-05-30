function Get-KnownCodeLanguages {
  return @(
    'powershell', 'bash', 'sh', 'shell', 'javascript', 'js', 'typescript', 'ts',
    'python', 'py', 'json', 'html', 'css', 'sql', 'yaml', 'yml', 'md', 'markdown',
    'jsx', 'tsx', 'mjs', 'java', 'go', 'rust', 'csharp', 'cs'
  )
}

function Get-KnownFileExtensions {
  return @(
    'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'md', 'mdc', 'ps1', 'sh', 'bash',
    'yml', 'yaml', 'html', 'css', 'scss', 'py', 'go', 'rs', 'java', 'toml', 'env',
    'txt', 'xml', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'm4a', 'mp3',
    'wav', 'pdf', 'docx', 'rtf', 'bat', 'cmd', 'vue', 'svelte'
  )
}

function Repair-InlinePasteArtifacts {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return '' }

  $t = $Text
  $t = $t -replace "`v", "`n"
  $t = $t -replace '\u000B', "`n"
  $t = $t -replace '\\''b7\\''00\s*', '- '
  $t = $t -replace '(?m)^\s*''b7''00\s*', '- '
  $t = $t -replace '(?m)^\s*```\s*(\S+)\s+$', '```$1'
  $t = $t -replace '(?m)^\s*```\s*$', '```'
  $t = $t -replace '(?m)^\s*```(\w+)\s{2,}$', '```$1'
  $fence = [char]0x60 + [char]0x60 + [char]0x60
  $t = [regex]::Replace($t, "(?m)^$fence(\w+)\r?\n$fence(\w+)\r?\n", "$fence`$2`n")
  $t = [regex]::Replace($t, "(?m)^$fence\s*\r?\n$fence(\w+)\r?\n", "$fence`$1`n")
  return $t
}

function Test-LooksLikeCodeLine {
  param([string]$Line)
  $l = $Line.Trim()
  if ($l.Length -lt 2) { return $false }
  if ($l -match '^(?i)(```|\$ |npm |pnpm |yarn |git |curl |powershell|import |export |const |let |var |function |class |def |public |private |#include|SELECT |INSERT |UPDATE |DELETE |echo |sudo |cd |mkdir |Get-|Set-|Join-Path|\.\/|\.\.\/)') {
    return $true
  }
  if ($l -match '^\[.+\]\s*\$\s') { return $true }
  if ($l -match '^\s{2,}\S' -and $l -match '[{}();=]') { return $true }
  return $false
}

function Get-CodeLanguageForBlock {
  param([string[]]$Lines)
  $sample = ($Lines -join "`n").ToLowerInvariant()
  if ($sample -match 'powershell|get-childitem|join-path|\$env:') { return 'powershell' }
  if ($sample -match 'npm run|pnpm |yarn ') { return 'bash' }
  if ($sample -match 'def |import |print\(') { return 'python' }
  if ($sample -match 'import |export |const |function ') { return 'javascript' }
  if ($sample -match '\{\s*"') { return 'json' }
  if ($sample -match '<html|<!doctype') { return 'html' }
  return 'text'
}

function Wrap-BareCodeRegions {
  param([string]$Text)

  $lines = $Text -split "`n"
  $out = New-Object System.Collections.Generic.List[string]
  $i = 0
  $langs = Get-KnownCodeLanguages

  while ($i -lt $lines.Count) {
    $line = $lines[$i]
    $trim = $line.Trim()

  # Lone language label before code block
    if ($trim -match '^(?i)^([a-z0-9+#.-]+)$' -and $langs -contains $Matches[1].ToLowerInvariant()) {
      $lang = $Matches[1].ToLowerInvariant()
      $codeLines = New-Object System.Collections.Generic.List[string]
      $j = $i + 1
      while ($j -lt $lines.Count) {
        $nl = $lines[$j]
        $nt = $nl.Trim()
        if ([string]::IsNullOrWhiteSpace($nt)) {
          if ($codeLines.Count -gt 0) { break }
          $j++
          continue
        }
        if ($nt -match '^(?i)(show more|yorumlad|assistant|user|human|ben)\b') { break }
        if ($nt -match '^(?i)#{1,3}\s') { break }
        if (-not (Test-LooksLikeCodeLine -Line $nl) -and $codeLines.Count -gt 2) { break }
        if (-not (Test-LooksLikeCodeLine -Line $nl) -and $codeLines.Count -eq 0) { break }
        $codeLines.Add($nl) | Out-Null
        $j++
        if ($codeLines.Count -ge 40 -and -not (Test-LooksLikeCodeLine -Line $nl)) { break }
      }
      if ($codeLines.Count -ge 1) {
        $fence = [char]0x60 + [char]0x60 + [char]0x60
        $out.Add($fence + $lang) | Out-Null
        foreach ($cl in $codeLines) { $out.Add($cl) | Out-Null }
        $out.Add($fence) | Out-Null
        $i = $j
        continue
      }
    }

    # Terminal-style run without fence
    if ($trim -match '^\[.+\]\s*\$' -or $trim -match '^(?i)\$ \./') {
      $codeLines = New-Object System.Collections.Generic.List[string]
      $j = $i
      while ($j -lt $lines.Count) {
        $nl = $lines[$j]
        $nt = $nl.Trim()
        if ($j -gt $i -and [string]::IsNullOrWhiteSpace($nt)) { break }
        if ($j -gt $i -and $nt -match '^(?i)(---|#{1,3}\s|\*\*)') { break }
        if ($j -gt $i -and -not (Test-LooksLikeCodeLine -Line $nl) -and $nt.Length -gt 20) { break }
        $codeLines.Add($nl) | Out-Null
        $j++
        if ($codeLines.Count -ge 25) { break }
      }
      if ($codeLines.Count -ge 1) {
        $lang = Get-CodeLanguageForBlock -Lines $codeLines.ToArray()
        $fence = [char]0x60 + [char]0x60 + [char]0x60
        $out.Add($fence + $lang) | Out-Null
        foreach ($cl in $codeLines) { $out.Add($cl) | Out-Null }
        $out.Add($fence) | Out-Null
        $i = $j
        continue
      }
    }

    $out.Add($line) | Out-Null
    $i++
  }

  return ($out -join "`n")
}

function Repair-UnclosedFences {
  param([string]$Text)
  $fence = [char]0x60 + [char]0x60 + [char]0x60
  $count = ([regex]::Matches($Text, "(?m)^$fence")).Count
  if ($count % 2 -ne 0) {
    $fence = [char]0x60 + [char]0x60 + [char]0x60
    return $Text + [Environment]::NewLine + $fence
  }
  return $Text
}

function Extract-FileReferences {
  param([string]$Text)

  $extPattern = (Get-KnownFileExtensions) -join '|'
  $pathRx = '(?i)(?:[\w.@~-]+/)+[\w.@~-]+\.(?:' + $extPattern + ')\b|(?i)[\w.-]+\.(?:' + $extPattern + ')\b'
  $refs = New-Object System.Collections.Generic.List[object]
  $seen = @{}

  foreach ($m in [regex]::Matches($Text, $pathRx)) {
    $path = $m.Value -replace '\\', '/'
    if ($path.Length -lt 4) { continue }
    if ($path -match '(?i)^(the|and|for|json|md)$') { continue }
    $key = $path.ToLowerInvariant()
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $ext = [IO.Path]::GetExtension($path).TrimStart('.').ToLowerInvariant()
    $start = [Math]::Max(0, $m.Index - 60)
    $len = [Math]::Min(120, $Text.Length - $start)
    $ctx = ($Text.Substring($start, $len) -replace '\s+', ' ').Trim()
    $refs.Add([PSCustomObject]@{ path = $path; ext = $ext; context = $ctx }) | Out-Null
  }

  return @($refs | Sort-Object path)
}

function Split-FencedCodeBlocks {
  param([string]$Text)

  $blocks = New-Object System.Collections.Generic.List[object]
  $fence = [char]0x60 + [char]0x60 + [char]0x60
  $rx = [regex]::new("(?ms)^$fence([^\r\n]*)\r?\n(.*?)^$fence", [System.Text.RegularExpressions.RegexOptions]::Multiline)
  $idx = 0
  foreach ($m in $rx.Matches($Text)) {
    $lang = $m.Groups[1].Value.Trim()
    if ([string]::IsNullOrWhiteSpace($lang)) {
      $lang = Get-CodeLanguageForBlock -Lines ($m.Groups[2].Value -split '\r?\n')
    }
    $blocks.Add([PSCustomObject]@{
        id = "block-$idx"
        lang = $lang.ToLowerInvariant()
        body = $m.Groups[2].Value.TrimEnd()
      }) | Out-Null
    $idx++
  }
  return ,@($blocks.ToArray())
}

function Get-ProseWithoutFences {
  param([string]$Text)
  $fence = [char]0x60 + [char]0x60 + [char]0x60
  $pattern = "(?ms)^$fence.*?^$fence\r?\n?"
  return ([regex]::Replace($Text, $pattern, '')).Trim()
}

function Split-ChatStructuredContent {
  param([string]$Text)

  $Text = Clean-ArchiveBodyForRestructure -Raw $Text
  $repaired = Repair-InlinePasteArtifacts -Text $Text
  $repaired = Wrap-BareCodeRegions -Text $repaired
  $repaired = Repair-UnclosedFences -Text $repaired

  $codeBlocks = Split-FencedCodeBlocks -Text $repaired
  $prose = Get-ProseWithoutFences -Text $repaired
  $fileRefs = Extract-FileReferences -Text $repaired

  [PSCustomObject]@{
    repaired_body = $repaired
    prose = $prose
    code_blocks = @($codeBlocks)
    file_refs = @($fileRefs)
  }
}

function Format-SegmentsMarkdown {
  param(
    [string]$SourceFile,
    [object]$Structured
  )

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('# Structured segments (auto V0)') | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("_Non-authoritative. Parsed from inbox archive._") | Out-Null
  $lines.Add('') | Out-Null
  $lines.Add("| Field | Value |") | Out-Null
  $lines.Add("|---|---|") | Out-Null
  $lines.Add("| source_inbox | ``$SourceFile`` |") | Out-Null
  $lines.Add("| code_block_count | $($Structured.code_blocks.Count) |") | Out-Null
  $lines.Add("| file_ref_count | $($Structured.file_refs.Count) |") | Out-Null
  $lines.Add("| segmented_at_utc | $((Get-Date).ToUniversalTime().ToString('o')) |") | Out-Null
  $lines.Add('') | Out-Null

  $lines.Add('## Kod parcalari') | Out-Null
  $lines.Add('') | Out-Null
  if ($Structured.code_blocks.Count -eq 0) {
    $lines.Add('_No fenced code blocks detected._') | Out-Null
  } else {
    foreach ($b in $Structured.code_blocks) {
      $lines.Add("### $($b.id) ($($b.lang))") | Out-Null
      $lines.Add('') | Out-Null
      $fenceOpen = '```' + $b.lang
      $lines.Add($fenceOpen) | Out-Null
      $lines.Add($b.body) | Out-Null
      $lines.Add('```') | Out-Null
      $lines.Add('') | Out-Null
    }
  }

  $lines.Add('## Dosya referanslari (uzanti)') | Out-Null
  $lines.Add('') | Out-Null
  if ($Structured.file_refs.Count -eq 0) {
    $lines.Add('_None detected._') | Out-Null
  } else {
    $lines.Add('| path | ext | context |') | Out-Null
    $lines.Add('|---|---|---|') | Out-Null
    foreach ($r in $Structured.file_refs) {
      $ctx = ($r.context -replace '\|', '/')
      if ($ctx.Length -gt 100) { $ctx = $ctx.Substring(0, 97) + '...' }
      $lines.Add("| ``$($r.path)`` | $($r.ext) | $ctx |") | Out-Null
    }
  }

  $lines.Add('') | Out-Null
  $lines.Add('## Uzanti ozeti') | Out-Null
  $lines.Add('') | Out-Null
  $byExt = @($Structured.file_refs | Group-Object ext | Sort-Object Count -Descending)
  if ($byExt.Count -eq 0) {
    $lines.Add('_None._') | Out-Null
  } else {
    foreach ($g in $byExt) {
      $lines.Add("- **.$($g.Name)**: $($g.Count)") | Out-Null
    }
  }

  return ($lines -join [Environment]::NewLine)
}

function Clean-ArchiveBodyForRestructure {
  param([string]$Raw)

  $parts = @($Raw -split '(?m)^---\s*$')
  if ($parts.Count -ge 3) {
    $body = ($parts[-1] -replace '^\s+', '')
  } elseif ($Raw -match '(?s)^---\r?\n.*?\r?\n---\r?\n(.*)$') {
    $body = $Matches[1]
  } else {
    $body = $Raw
  }

  $lines = @($body -split "`r?`n")
  $metaRx = '^(batch_id|archived_at_utc|source_hint|content_type|quality|line_count|char_count|layer_primary|layer_hits|layer_hit_total|tonom_allowed_writes|code_block_count|file_ref_count|structure_segmented)'
  $start = 0
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $t = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($t)) { continue }
    if ($t -match $metaRx) { continue }
    if ($t -match 'structure_segmented') { continue }
    if ($t.Length -lt 24) { continue }
    $start = $i
    break
  }
  if ($start -gt 0) {
    $lines = @($lines[$start..($lines.Count - 1)])
  }
  return ($lines -join "`n").Trim()
}

function Read-FrontmatterValue {
  param([string]$Raw, [string]$Key)
  if ($Raw -match ("(?m)^" + [regex]::Escape($Key) + ":\s*(.+)$")) { return $Matches[1].Trim() }
  return $null
}

function Update-InboxStructuredMeta {
  param(
    [string]$InboxPath,
    [object]$Structured
  )

  $raw = Get-Content -LiteralPath $InboxPath -Raw -Encoding UTF8
  $body = $Structured.repaired_body

  $keys = @(
    'batch_id', 'archived_at_utc', 'source_hint', 'content_type', 'quality',
    'line_count', 'char_count', 'layer_primary', 'layer_hits', 'layer_hit_total',
    'tonom_allowed_writes'
  )
  $fm = New-Object System.Collections.Generic.List[string]
  $fm.Add('---') | Out-Null
  foreach ($k in $keys) {
    $v = Read-FrontmatterValue -Raw $raw -Key $k
    if (-not $v -and $k -eq 'batch_id' -and $raw -match 'batch_id:\s*(\S+)') { $v = $Matches[1] }
    if ($v) { $fm.Add("$k`: $v") | Out-Null }
  }
  $fm.Add("code_block_count: $(@($Structured.code_blocks).Count)") | Out-Null
  $fm.Add("file_ref_count: $(@($Structured.file_refs).Count)") | Out-Null
  $fm.Add('structure_segmented: true') | Out-Null
  $fm.Add('---') | Out-Null
  $fm.Add('') | Out-Null

  $newRaw = (($fm -join "`n") + $body)
  Set-Content -LiteralPath $InboxPath -Value $newRaw -Encoding UTF8
}

function Get-InboxBodyHash {
  param([string]$Raw)
  $body = $Raw
  if ($Raw -match '(?s)^---\r?\n.*?\r?\n---\r?\n(.*)$') { $body = $Matches[1] }
  $normalized = ($body -replace '\s+', ' ').Trim().ToLowerInvariant()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalized)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
}
