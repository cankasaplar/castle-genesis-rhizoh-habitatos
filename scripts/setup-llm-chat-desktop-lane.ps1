# Creates / refreshes desktop RTF paste lane (non-canonical working copy).
param(
  [string]$DesktopRtf = "C:\Users\LENOVO\Desktop\Rhizoh_LLM_Sohbet_Yapistir.rtf",
  [string]$DesktopBat = "C:\Users\LENOVO\Desktop\Rhizoh_Sohbet_Repoya_Aktar.bat",
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ingestScript = Join-Path $RepoRoot "scripts\llm-chat-desktop-ingest.ps1"

$rtfBody = @'
{\rtf1\ansi\ansicpg1254\deff0
{\fonttbl{\f0\fnil\fcharset162 Calibri;}}
\viewkind4\uc1\pard\lang1055\f0\fs22
\b Rhizoh — LLM sohbet yapistirma (masaustu)\b0\par
\par
1) LLM arayuzunden tum sohbeti kopyala\par
2) Asagidaki iki isaret arasina yapistir (isaretleri silmene gerek yok)\par
3) Kaydet (Ctrl+S)\par
4) Masaustundeki \b Rhizoh_Sohbet_Repoya_Aktar.bat\b0  dosyasina cift tikla\par
\par
Not: Canonical belge yok. Metin inbox + katman taramasi + staging notlari ile repoya girer.\par
\par
\b === SOHBET BASLANGIC (buraya yapistir) ===\b0\par
\par
\par
\b === SOHBET BITIS ===\b0\par
}
'@

if (Test-Path -LiteralPath $DesktopRtf) {
  $backup = "$DesktopRtf.bak-$((Get-Date).ToString('yyyyMMdd-HHmmss'))"
  Copy-Item -LiteralPath $DesktopRtf -Destination $backup -Force
  Write-Host "Existing RTF backed up: $backup"
}

Set-Content -LiteralPath $DesktopRtf -Value $rtfBody -Encoding ASCII

$bat = @"
@echo off
chcp 65001 >nul
echo Rhizoh: masaustu sohbet repoya aktariliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "$ingestScript"
echo.
pause
"@

Set-Content -LiteralPath $DesktopBat -Value $bat -Encoding ASCII

Write-Host "Desktop lane ready:"
Write-Host "  RTF: $DesktopRtf"
Write-Host "  BAT: $DesktopBat"
