# One-time Gmail SMTP setup for SPIRALMMO daily archive email.
param(
  [string]$GmailAddress,
  [string]$AppPassword,
  [string]$ReportTo = "cankasaplar@gmail.com",
  [switch]$TestSend,
  [switch]$ScheduleDaily,
  [string]$DailyTime = "09:00"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sendScript = Join-Path $PSScriptRoot "send-spiralmmo-daily-report.ps1"

function Test-PlaceholderSmtpValue {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $true }
  $v = $Value.ToLowerInvariant()
  return $v -match 'senin_gmail|your_gmail|your_16|gmail_16_haneli|example\.com|placeholder|app_password|16_char'
}

Write-Host ""
Write-Host "=== Rhizoh / SPIRALMMO Gmail kurulumu ===" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrWhiteSpace($GmailAddress)) {
  $current = [Environment]::GetEnvironmentVariable("SPIRALMMO_SMTP_USER", "User")
  if ($current -and -not (Test-PlaceholderSmtpValue -Value $current)) {
    Write-Host "Mevcut SPIRALMMO_SMTP_USER: $current"
    $use = Read-Host "Bu adresi kullan? (E/h)"
    if ($use -eq '' -or $use -eq 'E' -or $use -eq 'e' -or $use -eq 'Y' -or $use -eq 'y') {
      $GmailAddress = $current
    }
  } elseif ($current) {
    Write-Host "Mevcut deger PLACEHOLDER (gecersiz): $current" -ForegroundColor Yellow
    Write-Host "Yeni Gmail adresi girmen gerekiyor." -ForegroundColor Yellow
  }
  if ([string]::IsNullOrWhiteSpace($GmailAddress)) {
    $GmailAddress = Read-Host "Gmail adresin (gonderen, orn. cankasaplar@gmail.com)"
  }
}

$currentPass = [Environment]::GetEnvironmentVariable("SPIRALMMO_SMTP_APP_PASSWORD", "User")
if ($currentPass -and (Test-PlaceholderSmtpValue -Value $currentPass)) {
  Write-Host "Mevcut sifre PLACEHOLDER (gecersiz) — gercek App Password gerekli." -ForegroundColor Yellow
}

if ([string]::IsNullOrWhiteSpace($AppPassword)) {
  Write-Host ""
  Write-Host "Google App Password (16 karakter, bosluksuz):" -ForegroundColor Yellow
  Write-Host "  1) https://myaccount.google.com/apppasswords"
  Write-Host "  2) 2 adimli dogrulama acik olmali"
  Write-Host "  3) Uygulama: Mail, Cihaz: Windows -> Olustur"
  Write-Host ""
  $AppPassword = Read-Host "App Password (yapistir)" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($AppPassword)
  try {
    $AppPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

$AppPassword = ($AppPassword -replace '\s', '').Trim()
if ($AppPassword.Length -lt 16) {
  throw "App Password en az 16 karakter olmali (bosluklari kaldir)."
}

if ([string]::IsNullOrWhiteSpace($ReportTo)) {
  $ReportTo = Read-Host "Rapor gidecek adres (Enter = cankasaplar@gmail.com)"
  if ([string]::IsNullOrWhiteSpace($ReportTo)) { $ReportTo = "cankasaplar@gmail.com" }
}

[Environment]::SetEnvironmentVariable("SPIRALMMO_SMTP_USER", $GmailAddress.Trim(), "User")
[Environment]::SetEnvironmentVariable("SPIRALMMO_SMTP_APP_PASSWORD", $AppPassword, "User")
[Environment]::SetEnvironmentVariable("SPIRALMMO_REPORT_TO", $ReportTo.Trim(), "User")

Write-Host ""
Write-Host "Ortam degiskenleri kaydedildi (User scope)." -ForegroundColor Green
Write-Host "  SPIRALMMO_SMTP_USER"
Write-Host "  SPIRALMMO_SMTP_APP_PASSWORD (gizli)"
Write-Host "  SPIRALMMO_REPORT_TO = $ReportTo"
Write-Host ""

& powershell -NoProfile -ExecutionPolicy Bypass -File $sendScript -DryRun

if ($TestSend) {
  Write-Host ""
  Write-Host "Test maili gonderiliyor..." -ForegroundColor Yellow
  & powershell -NoProfile -ExecutionPolicy Bypass -File $sendScript
  Write-Host "Test maili gonderildi. Gelen kutunu kontrol et." -ForegroundColor Green
}

if ($ScheduleDaily) {
  $taskScript = Join-Path $PSScriptRoot "setup-spiralmmo-daily-task.ps1"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $taskScript -DailyTime $DailyTime
  Write-Host "Gunluk gorev: SPIRALMMO_Daily_Report ($DailyTime)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Sonraki adimlar:" -ForegroundColor Cyan
Write-Host "  Test:  powershell -File scripts/send-spiralmmo-daily-report.ps1 -TestSend yerine:"
Write-Host "         powershell -File scripts/setup-gmail-spiralmmo.ps1 -TestSend"
Write-Host "  Manuel: powershell -File scripts/run-spiralmmo-daily-report.ps1"
Write-Host "  Gorev:  powershell -File scripts/setup-spiralmmo-daily-task.ps1"
Write-Host ""
