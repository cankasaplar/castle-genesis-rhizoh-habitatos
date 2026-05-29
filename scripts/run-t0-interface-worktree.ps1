# T0 full Castle shell (pre-Living-World refactor) — isolated git worktree.
# Lock SSOT: scripts/t0-interface-lock.v1.json · docs/ops/T0_INTERFACE_LOCK_V1.0.md
#
# Usage:
#   powershell -File scripts/run-t0-interface-worktree.ps1
#   cd ..\castle-t0-interface
#   npm install
#   powershell -File scripts/setup-rhizoh-t0-dev.ps1
#   npm run dev -w apps/client

param(
  [string]$WorktreePath = "",
  [string]$Ref = "t0-interface-lock",
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$lockPath = Join-Path $root "scripts\t0-interface-lock.v1.json"
$lock = Get-Content $lockPath -Raw | ConvertFrom-Json

if (-not $WorktreePath) {
  $WorktreePath = Join-Path (Split-Path -Parent $root) "castle-t0-interface"
}

Push-Location $root
try {
  $tagExists = git rev-parse -q --verify "refs/tags/$($lock.tag)" 2>$null
  if (-not $tagExists) {
    git tag -a $lock.tag $lock.commit -m "T0 interface lock (pre-Living-World refactor)"
    Write-Host "Created tag $($lock.tag) @ $($lock.shortCommit)" -ForegroundColor Cyan
  }

  $branchExists = git rev-parse -q --verify "refs/heads/$($lock.branch)" 2>$null
  if (-not $branchExists) {
    git branch $lock.branch $lock.commit
    Write-Host "Created branch $($lock.branch) @ $($lock.shortCommit)" -ForegroundColor Cyan
  }

  if (Test-Path $WorktreePath) {
    if ($Force) {
      git worktree remove $WorktreePath --force 2>$null
      if (Test-Path $WorktreePath) { Remove-Item -Recurse -Force $WorktreePath }
    } else {
      Write-Host "Worktree already exists: $WorktreePath" -ForegroundColor Yellow
      Write-Host "  cd $WorktreePath"
      Write-Host "  powershell -File scripts/setup-rhizoh-t0-dev.ps1"
      Write-Host "  npm run dev -w apps/client"
      Write-Host "  (recreate: -Force)"
      exit 0
    }
  }

  git worktree add $WorktreePath $Ref
  $patchScript = Join-Path $root "scripts\apply-t0-interface-lock-patch.ps1"
  if (Test-Path $patchScript) {
    & $patchScript -WorktreePath $WorktreePath -MainRoot $root
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "T0 interface worktree locked at:" -ForegroundColor Green
Write-Host "  $WorktreePath"
Write-Host "  ref=$Ref commit=$($lock.shortCommit)"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd $WorktreePath"
Write-Host "  npm install"
Write-Host "  powershell -File scripts/setup-rhizoh-t0-dev.ps1"
Write-Host "  npm run dev -w apps/client"
Write-Host ""
Write-Host "Live verify (gateway): npm run verify:t0-live"
Write-Host "rhizoh.com deploy: GitHub Actions deploy_track=t0-interface-lock"
