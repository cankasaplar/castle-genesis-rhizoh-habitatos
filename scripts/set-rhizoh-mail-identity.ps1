# Set system From addresses (recipient stays personal inbox via SPIRALMMO_REPORT_TO).
param(
  [string]$MorningFrom = "morning@rhizoh.com",
  [string]$MorningFromName = "Rhizoh Morning",
  [string]$ArchiveFrom = "archive@rhizoh.com",
  [string]$ArchiveFromName = "Rhizoh Archive",
  [string]$ReportTo = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[Environment]::SetEnvironmentVariable("RHIZOH_MAIL_MORNING_FROM", $MorningFrom.Trim(), "User")
[Environment]::SetEnvironmentVariable("RHIZOH_MAIL_MORNING_FROM_NAME", $MorningFromName.Trim(), "User")
[Environment]::SetEnvironmentVariable("RHIZOH_MAIL_SPIRALMMO_FROM", $ArchiveFrom.Trim(), "User")
[Environment]::SetEnvironmentVariable("RHIZOH_MAIL_SPIRALMMO_FROM_NAME", $ArchiveFromName.Trim(), "User")

if (-not [string]::IsNullOrWhiteSpace($ReportTo)) {
  [Environment]::SetEnvironmentVariable("SPIRALMMO_REPORT_TO", $ReportTo.Trim(), "User")
}

Write-Host "OK - sistem mail kimlikleri (User scope):" -ForegroundColor Green
Write-Host "  RHIZOH_MAIL_MORNING_FROM      = $MorningFrom"
Write-Host "  RHIZOH_MAIL_MORNING_FROM_NAME = $MorningFromName"
Write-Host "  RHIZOH_MAIL_SPIRALMMO_FROM    = $ArchiveFrom"
Write-Host "  RHIZOH_MAIL_SPIRALMMO_FROM_NAME = $ArchiveFromName"
$to = [Environment]::GetEnvironmentVariable("SPIRALMMO_REPORT_TO", "User")
Write-Host "  SPIRALMMO_REPORT_TO (alici)   = $to"
Write-Host ""
Write-Host "SMTP relay: SPIRALMMO_SMTP_USER + APP_PASSWORD." -ForegroundColor Yellow
Write-Host "From != SMTP: docs/RHIZOH_OPS_MAIL_IDENTITY_V0.md"
