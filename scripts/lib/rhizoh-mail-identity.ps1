function Get-RhizohOpsMailIdentityConfigPath {
  param([string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle")
  Join-Path $RepoRoot "config\rhizoh-ops-mail-identity.v0.json"
}

function Get-RhizohOpsMailIdentityConfig {
  param([string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle")
  $path = Get-RhizohOpsMailIdentityConfigPath -RepoRoot $RepoRoot
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Mail identity config missing: $path"
  }
  return Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Get-EnvOrEmpty {
  param([string]$Name)
  $v = [Environment]::GetEnvironmentVariable($Name, "User")
  if ([string]::IsNullOrWhiteSpace($v)) {
    $v = [Environment]::GetEnvironmentVariable($Name, "Process")
  }
  return $(if ($v) { $v.Trim() } else { "" })
}

function Get-RhizohMailChannelIdentity {
  param(
    [ValidateSet("morning_report", "spiralmmo_daily", "cohort_observe")]
    [string]$Channel,
    [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle"
  )

  $cfg = Get-RhizohOpsMailIdentityConfig -RepoRoot $RepoRoot
  $ch = $cfg.channels.$Channel
  if (-not $ch) {
    throw "Unknown mail channel: $Channel"
  }

  if ($Channel -eq "morning_report") {
    $fromAddr = Get-EnvOrEmpty "RHIZOH_MAIL_MORNING_FROM"
    $fromName = Get-EnvOrEmpty "RHIZOH_MAIL_MORNING_FROM_NAME"
    $replyTo = Get-EnvOrEmpty "RHIZOH_MAIL_MORNING_REPLY_TO"
  } elseif ($Channel -eq "cohort_observe") {
    $fromAddr = Get-EnvOrEmpty "RHIZOH_MAIL_COHORT_FROM"
    $fromName = Get-EnvOrEmpty "RHIZOH_MAIL_COHORT_FROM_NAME"
    $replyTo = Get-EnvOrEmpty "RHIZOH_MAIL_COHORT_REPLY_TO"
  } else {
    $fromAddr = Get-EnvOrEmpty "RHIZOH_MAIL_SPIRALMMO_FROM"
    $fromName = Get-EnvOrEmpty "RHIZOH_MAIL_SPIRALMMO_FROM_NAME"
    $replyTo = Get-EnvOrEmpty "RHIZOH_MAIL_SPIRALMMO_REPLY_TO"
  }

  if ([string]::IsNullOrWhiteSpace($fromAddr)) { $fromAddr = [string]$ch.fromAddress }
  if ([string]::IsNullOrWhiteSpace($fromName)) { $fromName = [string]$ch.fromName }
  if ([string]::IsNullOrWhiteSpace($replyTo)) { $replyTo = [string]$ch.replyTo }

  @{
    Channel   = $Channel
    FromAddress = $fromAddr
    FromName    = $fromName
    ReplyTo     = $replyTo
  }
}

function Get-RhizohMailSmtpCredentialBundle {
  $smtpUser = Get-EnvOrEmpty "SPIRALMMO_SMTP_USER"
  $smtpPass = Get-EnvOrEmpty "SPIRALMMO_SMTP_APP_PASSWORD"
  $reportTo = Get-EnvOrEmpty "SPIRALMMO_REPORT_TO"
  if ([string]::IsNullOrWhiteSpace($smtpUser) -or [string]::IsNullOrWhiteSpace($smtpPass)) {
    throw "SMTP env missing. Run: scripts/set-spiralmmo-gmail-env.ps1"
  }
  if ([string]::IsNullOrWhiteSpace($reportTo)) {
    $reportTo = $smtpUser
  }
  @{
    SmtpUser = $smtpUser
    SmtpAppPassword = $smtpPass
    ReportTo = $reportTo
  }
}

function New-RhizohMailAddress {
  param(
    [string]$Address,
    [string]$DisplayName = ""
  )
  $addr = $Address.Trim()
  if ([string]::IsNullOrWhiteSpace($addr)) {
    throw "Mail address is empty."
  }
  if ([string]::IsNullOrWhiteSpace($DisplayName)) {
    return New-Object System.Net.Mail.MailAddress($addr)
  }
  return New-Object System.Net.Mail.MailAddress($addr, $DisplayName.Trim())
}

function Test-RhizohSelfSendLoop {
  param(
    [string]$FromAddress,
    [string]$ToAddress
  )
  $f = $FromAddress.Trim().ToLowerInvariant()
  $t = $ToAddress.Trim().ToLowerInvariant()
  return ($f -eq $t)
}

function Write-RhizohMailIdentityWarnings {
  param(
    [hashtable]$Identity,
    [string]$SmtpUser,
    [string]$Recipient
  )

  if (Test-RhizohSelfSendLoop -FromAddress $Identity.FromAddress -ToAddress $Recipient) {
    Write-Warning "From ve To ayni adres ($Recipient): mail kendine gorunur. RHIZOH_MAIL_*_FROM ile sistem adresi ayarla; SPIRALMMO_REPORT_TO = kisisel inbox."
  }

  $smtpDomain = ($SmtpUser -split '@')[-1]
  $fromDomain = ($Identity.FromAddress -split '@')[-1]
  if ($smtpDomain -and $fromDomain -and ($smtpDomain -ne $fromDomain)) {
    Write-Warning "SMTP ($SmtpUser) ile From ($($Identity.FromAddress)) farkli domain. Gmail Send mail as veya Workspace/Resend gerekir. Bkz. docs/RHIZOH_OPS_MAIL_IDENTITY_V0.md"
  }
}

function New-RhizohUtf8MailMessage {
  param(
    [System.Net.Mail.MailAddress]$From,
    [string]$To,
    [string]$Subject,
    [string]$HtmlBody,
    [string]$ReplyTo = ""
  )

  $utf8 = New-Object System.Text.UTF8Encoding $false
  $message = New-Object System.Net.Mail.MailMessage
  $message.From = $From
  [void]$message.To.Add((New-Object System.Net.Mail.MailAddress($To.Trim())))
  $message.Subject = $Subject
  $message.SubjectEncoding = $utf8
  $message.BodyEncoding = $utf8
  $message.HeadersEncoding = $utf8
  $message.IsBodyHtml = $true
  $message.Body = $HtmlBody

  if (-not [string]::IsNullOrWhiteSpace($ReplyTo)) {
    $message.ReplyToList.Add($ReplyTo.Trim()) | Out-Null
  }

  return $message
}
