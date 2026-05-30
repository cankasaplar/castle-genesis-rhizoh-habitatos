function Read-RtfAsPlainText {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "RTF file not found: $Path"
  }

  $wordError = $null
  $word = $null
  $doc = $null
  try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open((Resolve-Path -LiteralPath $Path).Path, $false, $true, $false)
    $text = $doc.Content.Text
    if (-not [string]::IsNullOrWhiteSpace($text)) {
      return (Normalize-ChatLineEndings -Text $text)
    }
  } catch {
    $wordError = $_.Exception.Message
  } finally {
    if ($doc) {
      try { $doc.Close($false) | Out-Null } catch { }
      [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
    }
    if ($word) {
      try { $word.Quit() | Out-Null } catch { }
      [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
  }

  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if ($raw -match '[^\x00-\x7F]') {
    # keep UTF-8 if already readable
  } else {
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding Default
  }
  $plain = $raw
  $plain = [regex]::Replace($plain, '\\u(-?\d+)\??', {
    param($m)
    try { return [char][int]$m.Groups[1].Value } catch { return '?' }
  })
  $plain = $plain -replace '\\par[d]?\s*', "`n"
  $plain = $plain -replace '\\line\s*', "`n"
  $plain = $plain -replace '\\tab\s*', "`t"
  $plain = $plain -replace "\\'([0-9a-fA-F]{2})", {
    param($m)
    try { return [char][Convert]::ToInt32($m.Groups[1].Value, 16) } catch { return '' }
  }
  $plain = $plain -replace '\\[a-z]{1,32}(-?\d+)?\s?', ''
  $plain = $plain -replace '[{}]', ''
  $plain = $plain -replace '\r\n?', "`n"
  if ($wordError) {
    Write-Warning "Word COM unavailable ($wordError); used RTF fallback strip."
  }
  return $plain
}

function Read-ChatPasteSource {
  param([string]$Path)

  $ext = [IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    '.rtf' { return (Read-RtfAsPlainText -Path $Path) }
    default { return (Get-Content -LiteralPath $Path -Raw -Encoding UTF8) }
  }
}

function Normalize-ChatLineEndings {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
  $t = $Text -replace "`r`n", "`n"
  $t = $t -replace "`r", "`n"
  return $t
}

function Extract-ChatBodyFromTemplate {
  param([string]$Text)

  $Text = Normalize-ChatLineEndings -Text $Text

  # Markers glued on same line (Word \r-only export)
  $startMarkers = @(
    '=== SOHBET BASLANGIC',
    '=== SOHBET BAŞLANGIÇ',
    '--- SOHBET BASLANGIC',
    '--- SOHBET BAŞLANGIÇ'
  )
  $endMarkers = @(
    '=== SOHBET BITIS',
    '=== SOHBET BİTİŞ',
    '--- SOHBET BITIS',
    '--- SOHBET BİTİŞ'
  )

  foreach ($sm in @('=== SOHBET BASLANGIC', '=== SOHBET BAŞLANGIÇ')) {
    $idx = $Text.IndexOf($sm, [StringComparison]::OrdinalIgnoreCase)
    if ($idx -ge 0) {
      $after = $idx + $sm.Length
      $rest = $Text.Substring($after)
      if ($rest -match '^\s*\([^)]+\)\s*===') {
        $after = $after + $Matches[0].Length
        $rest = $Text.Substring($after)
      }
      foreach ($em in @('=== SOHBET BITIS', '=== SOHBET BİTİŞ')) {
        $eidx = $rest.IndexOf($em, [StringComparison]::OrdinalIgnoreCase)
        if ($eidx -gt 0) {
          return $rest.Substring(0, $eidx).Trim()
        }
      }
      return $rest.Trim()
    }
  }

  $lines = $Text -split "`n"
  $startIdx = -1
  $endIdx = -1

  for ($i = 0; $i -lt $lines.Count; $i++) {
    $trim = $lines[$i].Trim()
    if ($startIdx -lt 0) {
      foreach ($m in $startMarkers) {
        if ($trim.StartsWith($m, [StringComparison]::OrdinalIgnoreCase)) {
          $startIdx = $i + 1
          break
        }
      }
    } elseif ($endIdx -lt 0) {
      foreach ($m in $endMarkers) {
        if ($trim.StartsWith($m, [StringComparison]::OrdinalIgnoreCase)) {
          $endIdx = $i
          break
        }
      }
    }
  }

  if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
    return (($lines[$startIdx..($endIdx - 1)]) -join "`n").Trim()
  }
  if ($startIdx -ge 0) {
    return (($lines[$startIdx..($lines.Count - 1)]) -join "`n").Trim()
  }

  # Drop leading instruction block (lines before first marker-like heading or empty run)
  $skipInstruction = $true
  $body = New-Object System.Collections.Generic.List[string]
  foreach ($line in $lines) {
    $t = $line.Trim()
    if ($skipInstruction) {
      if ([string]::IsNullOrWhiteSpace($t)) { continue }
      if ($t -match '^(Rhizoh|LLM|Yapistir|Yapıştır|Kullanim|Kullanım|Adim|Adım|===|---)' ) { continue }
      if ($t.Length -lt 4) { continue }
      $skipInstruction = $false
    }
    $body.Add($line) | Out-Null
  }
  return ($body -join "`n").Trim()
}

function Repair-ChatPasteText {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return ''
  }

  $t = Normalize-ChatLineEndings -Text $Text
  $t = $t -replace "`0", ''
  $t = $t -replace "\uFEFF", ''
  $t = $t -replace "`r`n", "`n"
  $t = $t -replace "`r", "`n"
  $t = $t -replace '\u2018|\u2019', "'"
  $t = $t -replace '\u201C|\u201D', '"'
  $t = $t -replace '\u2013|\u2014', '-'
  $t = $t -replace '\u00A0', ' '
  $t = $t -replace "[`t ]+\n", "`n"
  $t = $t -replace "\n{4,}", "`n`n`n"
  $t = $t.Trim()

  # Common broken export: glued role labels
  $t = $t -replace '(?m)^(User|Human|Ben)\s*:\s*', "User: "
  $t = $t -replace '(?m)^(Assistant|AI|Claude|ChatGPT|Cursor)\s*:\s*', "Assistant: "
  $t = $t -replace "\\'b7\\'00\s*", '- '
  $t = $t -replace '\uFFFD', ''

  return $t
}

function Normalize-ChatPastePipeline {
  param([string]$Text)

  $body = Extract-ChatBodyFromTemplate -Text $Text
  return (Repair-ChatPasteText -Text $body)
}
