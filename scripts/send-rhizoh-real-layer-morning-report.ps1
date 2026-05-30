# Send 06:44 morning report (text only). From = system identity, To = ops inbox.
param(
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle",
  [switch]$DryRun,
  [switch]$BuildOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\gmail-smtp-send.ps1")
. (Join-Path $PSScriptRoot "lib\rhizoh-mail-identity.ps1")
. (Join-Path $PSScriptRoot "lib\real-layer-morning-mail.ps1")

$today = Get-Date -Format "yyyy-MM-dd"
$htmlPath = Join-Path $RepoRoot "docs\exports\media\mail\real_layer_morning_$today.html"

& (Join-Path $PSScriptRoot "build-real-layer-morning-report.ps1") -RepoRoot $RepoRoot | Out-Null
if (-not (Test-Path -LiteralPath $htmlPath)) {
  throw "Failed to build HTML report: $htmlPath"
}

if ($BuildOnly) {
  Write-Output "BUILD_ONLY=true"
  Write-Output "HTML=$htmlPath"
  exit 0
}

$smtp = Get-RhizohMailSmtpCredentialBundle
$identity = Get-RhizohMailChannelIdentity -Channel "morning_report" -RepoRoot $RepoRoot
Write-RhizohMailIdentityWarnings -Identity $identity -SmtpUser $smtp.SmtpUser -Recipient $smtp.ReportTo

$subject = "Rhizoh Morning - 06:44 - $today"
$htmlBody = [System.IO.File]::ReadAllText($htmlPath, (New-Object System.Text.UTF8Encoding $false))
$from = New-RhizohMailAddress -Address $identity.FromAddress -DisplayName $identity.FromName

if ($DryRun) {
  Write-Output "DRY_RUN=true"
  Write-Output "SMTP_AUTH=$($smtp.SmtpUser)"
  Write-Output "FROM=$($identity.FromAddress) ($($identity.FromName))"
  Write-Output "TO=$($smtp.ReportTo)"
  Write-Output "REPLY_TO=$($identity.ReplyTo)"
  Write-Output "SUBJECT=$subject"
  Write-Output "HTML=$htmlPath"
  exit 0
}

$message = New-RhizohUtf8MailMessage `
  -From $from `
  -To $smtp.ReportTo `
  -Subject $subject `
  -HtmlBody $htmlBody `
  -ReplyTo $identity.ReplyTo

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
  exit 1
} finally {
  $message.Dispose()
}
