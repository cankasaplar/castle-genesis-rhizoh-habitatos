param(
  [string]$TaskName = "SPIRALMMO_Daily_Report",
  [string]$DailyTime = "09:00"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$runner = "C:\Users\LENOVO\Desktop\castle\scripts\run-spiralmmo-daily-report.ps1"
if (-not (Test-Path -LiteralPath $runner)) {
  throw "Runner script not found: $runner"
}

$taskCommand = "powershell.exe"
$taskArgs = "-ExecutionPolicy Bypass -File `"$runner`""

# Update or create task for current user context.
schtasks /Create /TN $TaskName /SC DAILY /ST $DailyTime /TR "$taskCommand $taskArgs" /F | Out-Null

Write-Output "TASK_CREATED=true"
Write-Output "TASK_NAME=$TaskName"
Write-Output "SCHEDULE=DAILY $DailyTime"
Write-Output "RUNNER=$runner"
