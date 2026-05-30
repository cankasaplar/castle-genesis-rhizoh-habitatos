param(
  [string]$TaskName = "Rhizoh_RealLayer_0644",
  [string]$DailyTime = "06:44"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$runner = "C:\Users\LENOVO\Desktop\castle\scripts\send-rhizoh-real-layer-morning-report.ps1"
if (-not (Test-Path -LiteralPath $runner)) {
  throw "Runner not found: $runner"
}

$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$runner`""
schtasks /Create /TN $TaskName /SC DAILY /ST $DailyTime /TR $tr /F | Out-Null

Write-Output "TASK_CREATED=true"
Write-Output "TASK_NAME=$TaskName"
Write-Output "SCHEDULE=DAILY $DailyTime"
Write-Output "RUNNER=$runner"
