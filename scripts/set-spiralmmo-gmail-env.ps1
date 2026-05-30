# Set Gmail SMTP env vars in one shot (no placeholder confusion).
# Usage:
#   powershell -File scripts/set-spiralmmo-gmail-env.ps1 -GmailAddress "you@gmail.com" -AppPassword "abcdabcdabcdabcd"
param(
  [Parameter(Mandatory = $true)]
  [string]$GmailAddress,
  [Parameter(Mandatory = $true)]
  [string]$AppPassword
  [string]$ReportTo = "cankasaplar@gmail.com"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AppPassword = ($AppPassword -replace '\s', '').Trim()
if ($AppPassword.Length -lt 16) {
  throw "App Password must be 16 chars. Copy from Google App Passwords page."
}
if ($GmailAddress -notmatch '@gmail\.com$') {
  Write-Warning "Address does not end with @gmail.com; saving anyway."
}

[Environment]::SetEnvironmentVariable("SPIRALMMO_SMTP_USER", $GmailAddress.Trim(), "User")
[Environment]::SetEnvironmentVariable("SPIRALMMO_SMTP_APP_PASSWORD", $AppPassword, "User")
[Environment]::SetEnvironmentVariable("SPIRALMMO_REPORT_TO", $ReportTo.Trim(), "User")

Write-Host "OK saved (User scope):" -ForegroundColor Green
Write-Host "  SPIRALMMO_SMTP_USER = $GmailAddress"
Write-Host "  SPIRALMMO_REPORT_TO = $ReportTo"
Write-Host "  SPIRALMMO_SMTP_APP_PASSWORD = hidden (16 chars)"
Write-Host ""
Write-Host "Process scope updated for this terminal too."
$env:SPIRALMMO_SMTP_USER = $GmailAddress.Trim()
$env:SPIRALMMO_SMTP_APP_PASSWORD = $AppPassword
$env:SPIRALMMO_REPORT_TO = $ReportTo.Trim()
Write-Host ""
Write-Host 'Test: powershell -File scripts/send-spiralmmo-daily-report.ps1 -DryRun'
