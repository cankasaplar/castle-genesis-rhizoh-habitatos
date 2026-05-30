# SPIRALMMO Daily Email Automation (V0)

This setup sends `docs/SPIRALMMO_ARCHIVE_TABLE_V0.md` daily by email.

## 1) Scripts

- `scripts/update-spiralmmo-archive-table.ps1`
- `scripts/send-spiralmmo-daily-report.ps1`
- `scripts/run-spiralmmo-daily-report.ps1`
- `scripts/setup-spiralmmo-daily-task.ps1`

## 2) One-time Gmail setup

Use a Gmail account with **2-Step Verification enabled** and create an **App Password** at [Google App Passwords](https://myaccount.google.com/apppasswords).

**Kolay kurulum (önerilen):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-gmail-spiralmmo.ps1
```

İsteğe bağlı test maili + günlük görev:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-gmail-spiralmmo.ps1 -TestSend -ScheduleDaily -DailyTime "09:00"
```

**Manuel (aynı sonuç):**

```powershell
[Environment]::SetEnvironmentVariable("SPIRALMMO_SMTP_USER","YOUR_GMAIL_ADDRESS","User")
[Environment]::SetEnvironmentVariable("SPIRALMMO_SMTP_APP_PASSWORD","YOUR_16_CHAR_APP_PASSWORD","User")
[Environment]::SetEnvironmentVariable("SPIRALMMO_REPORT_TO","cankasaplar@gmail.com","User")
```

Close and reopen terminal after setting env vars.

## 3) Test without sending mail

```powershell
powershell -ExecutionPolicy Bypass -File scripts/send-spiralmmo-daily-report.ps1 -DryRun
```

## 4) Manual one-shot run

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-spiralmmo-daily-report.ps1
```

## 5) Schedule daily task

Default time is 09:00 local:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-spiralmmo-daily-task.ps1
```

Custom time example:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-spiralmmo-daily-task.ps1 -DailyTime "21:30"
```

## 6) Verify task

```powershell
schtasks /Query /TN SPIRALMMO_Daily_Report /V /FO LIST
```
