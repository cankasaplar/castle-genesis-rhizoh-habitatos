Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\LENOVO\Desktop\castle"
$updateScript = Join-Path $repoRoot "scripts\update-spiralmmo-archive-table.ps1"
$sendScript = Join-Path $repoRoot "scripts\send-spiralmmo-daily-report.ps1"

if (-not (Test-Path -LiteralPath $updateScript)) {
  throw "Missing script: $updateScript"
}
if (-not (Test-Path -LiteralPath $sendScript)) {
  throw "Missing script: $sendScript"
}

powershell -ExecutionPolicy Bypass -File $updateScript

$intelScript = Join-Path $repoRoot "scripts\run-spiralmmo-archive-intelligence.ps1"
if (Test-Path -LiteralPath $intelScript) {
  powershell -ExecutionPolicy Bypass -File $intelScript -Fast
}

$smtpUser = [Environment]::GetEnvironmentVariable("SPIRALMMO_SMTP_USER", "User")
$smtpAppPassword = [Environment]::GetEnvironmentVariable("SPIRALMMO_SMTP_APP_PASSWORD", "User")
$reportTo = [Environment]::GetEnvironmentVariable("SPIRALMMO_REPORT_TO", "User")

if (
  [string]::IsNullOrWhiteSpace($smtpUser) -or
  [string]::IsNullOrWhiteSpace($smtpAppPassword) -or
  [string]::IsNullOrWhiteSpace($reportTo)
) {
  Write-Output "MAIL_STEP_SKIPPED=true"
  Write-Output "REASON=Missing SMTP env vars (SPIRALMMO_SMTP_USER / SPIRALMMO_SMTP_APP_PASSWORD / SPIRALMMO_REPORT_TO)"
  exit 0
}

powershell -ExecutionPolicy Bypass -File $sendScript
