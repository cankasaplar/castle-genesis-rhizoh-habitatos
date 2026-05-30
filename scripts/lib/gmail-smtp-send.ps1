function Get-GmailSmtpCredential {
  param([string]$User, [string]$AppPassword)
  $pass = ($AppPassword -replace '\s', '').Trim()
  if ($pass -match '[^a-zA-Z0-9]') {
    Write-Warning 'App password contains non-alphanumeric chars; Gmail App Passwords are usually letters only.'
  }
  return New-Object System.Net.NetworkCredential($User.Trim(), $pass)
}

function Send-ViaGmailSmtp {
  param(
    [System.Net.Mail.MailMessage]$Message,
    [System.Net.NetworkCredential]$Credential,
    [string]$Server = 'smtp.gmail.com'
  )

  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  $attempts = @(
    @{ Port = 587; Ssl = $true; Label = '587-STARTTLS' },
    @{ Port = 465; Ssl = $true; Label = '465-SSL' }
  )

  $lastError = $null
  foreach ($a in $attempts) {
    $client = New-Object System.Net.Mail.SmtpClient($Server, $a.Port)
    try {
      $client.EnableSsl = $a.Ssl
      $client.UseDefaultCredentials = $false
      $client.DeliveryMethod = [System.Net.Mail.SmtpDeliveryMethod]::Network
      $client.Timeout = 120000
      $client.Credentials = $Credential
      $client.Send($Message)
      return $a.Label
    } catch {
      $lastError = $_.Exception.Message
      Write-Warning "SMTP $($a.Label) failed: $lastError"
    } finally {
      $client.Dispose()
    }
  }

  throw "Gmail SMTP failed on all ports. Last error: $lastError"
}
