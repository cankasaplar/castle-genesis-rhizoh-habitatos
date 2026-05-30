# Metehan / cohort observer — kısa Rhizoh sistem açıklaması + davet linki.
#
# Usage:
#   powershell -File scripts/send-cohort-observer-system-brief.ps1 -ToEmail "metehan.arkan@gmail.com"
#   powershell -File scripts/send-cohort-observer-system-brief.ps1 -ToEmail "..." -DryRun

param(
  [Parameter(Mandatory = $true)]
  [string]$ToEmail,
  [string]$ObserverName = "Metehan",
  [string]$InviteUrl = "https://rhizoh.com/?cohort=review&reviewer=metehan&__rev=20260530-v20",
  [string]$RepoRoot = "",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = if ($RepoRoot.Trim()) { $RepoRoot.Trim() } else { Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }

. (Join-Path $PSScriptRoot "lib\gmail-smtp-send.ps1")
. (Join-Path $PSScriptRoot "lib\rhizoh-mail-identity.ps1")
. (Join-Path $PSScriptRoot "lib\cohort-observer-mail.ps1")

$smtp = Get-RhizohMailSmtpCredentialBundle
$identity = Get-RhizohMailChannelIdentity -Channel "cohort_observe" -RepoRoot $root
Write-RhizohMailIdentityWarnings -Identity $identity -SmtpUser $smtp.SmtpUser -Recipient $ToEmail.Trim()

$subject = "Rhizoh - kisa sistem ozeti ve giris linki"
$html = Get-CohortObserverSystemBriefHtml -InviteUrl $InviteUrl -ObserverName $ObserverName
$plain = Get-CohortObserverSystemBriefPlainText -InviteUrl $InviteUrl -ObserverName $ObserverName
$from = New-RhizohMailAddress -Address $identity.FromAddress -DisplayName $identity.FromName

if ($DryRun) {
  Write-Output "DRY_RUN=true"
  Write-Output "FROM=$($identity.FromAddress) ($($identity.FromName))"
  Write-Output "TO=$($ToEmail.Trim())"
  Write-Output "SUBJECT=$subject"
  Write-Output "INVITE=$InviteUrl"
  Write-Output "---"
  Write-Output $plain
  exit 0
}

$message = New-RhizohUtf8MailMessage `
  -From $from `
  -To $ToEmail.Trim() `
  -Subject $subject `
  -HtmlBody $html `
  -ReplyTo $identity.ReplyTo

$cred = Get-GmailSmtpCredential -User $smtp.SmtpUser -AppPassword $smtp.SmtpAppPassword
$mode = Send-ViaGmailSmtp -Message $message -Credential $cred
Write-Host "OK cohort system brief sent via $mode to $($ToEmail.Trim())" -ForegroundColor Green
