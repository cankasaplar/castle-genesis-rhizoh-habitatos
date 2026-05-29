# Metehan / cohort observer invite — From: observe@rhizoh.com (Rhizoh identity).
#
# Usage:
#   powershell -File scripts/send-cohort-observer-invite.ps1 -ToEmail "metehan@example.com"
#   powershell -File scripts/send-cohort-observer-invite.ps1 -ToEmail "..." -DryRun

param(
  [Parameter(Mandatory = $true)]
  [string]$ToEmail,
  [string]$ObserverName = "Metehan",
  [string]$InviteUrl = "https://rhizoh.com/?cohort=review&reviewer=metehan",
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

$subject = 'Rhizoh - davet'
$html = Get-CohortObserverInviteHtml -InviteUrl $InviteUrl -ObserverName $ObserverName
$from = New-RhizohMailAddress -Address $identity.FromAddress -DisplayName $identity.FromName

if ($DryRun) {
  Write-Output "DRY_RUN=true"
  Write-Output "FROM=$($identity.FromAddress) ($($identity.FromName))"
  Write-Output "TO=$($ToEmail.Trim())"
  Write-Output "SUBJECT=$subject"
  Write-Output "INVITE=$InviteUrl"
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
Write-Host "OK cohort observer invite sent via $mode to $($ToEmail.Trim())" -ForegroundColor Green
