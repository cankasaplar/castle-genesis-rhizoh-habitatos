# Parse ANAHTARLAR_BURAYA.local.txt (gitignored) into a hashtable.
# Usage: . .\scripts\read-rhizoh-secrets-vault.ps1; $s = Read-RhizohSecretsVaultV0

function Read-RhizohSecretsVaultV0 {
  param(
    [string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
  )
  $vaultPath = Join-Path $RepoRoot "ANAHTARLAR_BURAYA.local.txt"
  $secrets = @{}
  if (-not (Test-Path $vaultPath)) {
    return $secrets
  }
  foreach ($line in Get-Content $vaultPath -Encoding UTF8) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith("#")) { continue }
    # \w not [A-Z0-9_]: Turkish locale breaks [A-Z] on "I" in VITE_CESIUM_ION_TOKEN.
    if ($t -match '^(VITE_\w+|CASTLE_\w+)=(.*)$') {
      $val = $matches[2].Trim()
      if ($val) { $secrets[$matches[1]] = $val }
    }
  }
  return $secrets
}
