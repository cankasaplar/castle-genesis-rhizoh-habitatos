param(
  [string]$ReportPath = "C:\Users\LENOVO\Desktop\castle\docs\SPIRALMMO_ARCHIVE_TABLE_V0.md",
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\gmail-smtp-send.ps1")
. (Join-Path $PSScriptRoot "lib\rhizoh-mail-identity.ps1")

if (-not (Test-Path -LiteralPath $ReportPath)) {
  throw "Report not found: $ReportPath"
}

$smtp = Get-RhizohMailSmtpCredentialBundle
$identity = Get-RhizohMailChannelIdentity -Channel "spiralmmo_daily" -RepoRoot $RepoRoot
Write-RhizohMailIdentityWarnings -Identity $identity -SmtpUser $smtp.SmtpUser -Recipient $smtp.ReportTo

$reportBody = Get-Content -LiteralPath $ReportPath -Raw -Encoding UTF8
$today = Get-Date -Format "yyyy-MM-dd"
$subject = "SPIRALMMO Daily Archive - $today"
$from = New-RhizohMailAddress -Address $identity.FromAddress -DisplayName $identity.FromName

if ($DryRun) {
  Write-Output "DRY_RUN=true"
  Write-Output "SMTP_AUTH=$($smtp.SmtpUser)"
  Write-Output "FROM=$($identity.FromAddress) ($($identity.FromName))"
  Write-Output "TO=$($smtp.ReportTo)"
  Write-Output "SUBJECT=$subject"
  Write-Output "ATTACHMENT=$ReportPath"
  exit 0
}

$utf8 = New-Object System.Text.UTF8Encoding $false
$message = New-Object System.Net.Mail.MailMessage
$message.From = $from
[void]$message.To.Add((New-Object System.Net.Mail.MailAddress($smtp.ReportTo.Trim())))
$message.Subject = $subject
$message.SubjectEncoding = $utf8
$message.BodyEncoding = $utf8
$message.HeadersEncoding = $utf8
$message.Body = $reportBody
$message.IsBodyHtml = $false
if (-not [string]::IsNullOrWhiteSpace($identity.ReplyTo)) {
  $message.ReplyToList.Add($identity.ReplyTo.Trim()) | Out-Null
}
$message.Attachments.Add($ReportPath) | Out-Null

$cred = Get-GmailSmtpCredential -User $smtp.SmtpUser -AppPassword $smtp.SmtpAppPassword

try {
  $mode = Send-ViaGmailSmtp -Message $message -Credential $cred
  Write-Output "MAIL_SENT=true"
  Write-Output "SMTP_MODE=$mode"
  Write-Output "FROM=$($identity.FromAddress)"
  Write-Output "TO=$($smtp.ReportTo)"
  Write-Output "SUBJECT=$subject"
} catch {
  Write-Host ""
  Write-Host "Gmail gonderim basarisiz." -ForegroundColor Red
  Write-Host $_.Exception.Message
  Write-Host ""
  Write-Host "Cozum:" -ForegroundColor Yellow
  Write-Host '  powershell -File scripts/set-spiralmmo-gmail-env.ps1 -GmailAddress "..." -AppPassword "..."'
  Write-Host '  powershell -File scripts/set-rhizoh-mail-identity.ps1'
  Write-Host "  https://myaccount.google.com/apppasswords"
  exit 1
} finally {
  $message.Dispose()
}
