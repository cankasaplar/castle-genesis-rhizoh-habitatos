# Prepare all broadcast assets (no YouTube upload, no scheduled tasks, no test send).
param(
  [string]$RepoRoot = "C:\Users\LENOVO\Desktop\castle"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$readyRoot = Join-Path $RepoRoot "docs\exports\broadcast-ready"
$morningDir = Join-Path $readyRoot "morning"
$eveningDir = Join-Path $readyRoot "evening"
$connDir = Join-Path $readyRoot "connection"
$assetsDir = Join-Path $readyRoot "assets"

foreach ($d in @($readyRoot, $morningDir, $eveningDir, $connDir, $assetsDir)) {
  if (-not (Test-Path -LiteralPath $d)) {
    New-Item -ItemType Directory -Path $d -Force | Out-Null
  }
}

$today = Get-Date -Format "yyyy-MM-dd"

# --- Build morning premiere + mail HTML ---
$premiereSrc = Join-Path $RepoRoot "docs\exports\media\youtube\morning_premiere_$today.mp4"
$fallbackPremiere = Join-Path $RepoRoot "docs\exports\broadcast-ready\morning\morning_premiere_latest.mp4"

try {
  & (Join-Path $RepoRoot "scripts\build-castle-genesis-morning-premiere-video.ps1") -RepoRoot $RepoRoot | Out-Null
} catch {
  if ((Test-Path -LiteralPath $fallbackPremiere) -and (Get-Item -LiteralPath $fallbackPremiere).Length -gt 20KB) {
    Write-Warning "Premiere build failed; keeping existing morning_premiere_latest.mp4"
    if (-not (Test-Path -LiteralPath $premiereSrc)) {
      Copy-Item -LiteralPath $fallbackPremiere -Destination $premiereSrc -Force
    }
  } else {
    throw
  }
}

& (Join-Path $RepoRoot "scripts\build-real-layer-morning-report.ps1") -RepoRoot $RepoRoot | Out-Null
$mailHtmlSrc = Join-Path $RepoRoot "docs\exports\media\mail\real_layer_morning_$today.html"

if (-not (Test-Path -LiteralPath $premiereSrc)) {
  throw "Morning premiere missing: $premiereSrc"
}

Copy-Item -LiteralPath $premiereSrc -Destination (Join-Path $morningDir "morning_premiere_latest.mp4") -Force
Copy-Item -LiteralPath $premiereSrc -Destination (Join-Path $morningDir "morning_premiere_$today.mp4") -Force

if (Test-Path -LiteralPath $mailHtmlSrc) {
  Copy-Item -LiteralPath $mailHtmlSrc -Destination (Join-Path $morningDir "morning_report_latest.html") -Force
  Copy-Item -LiteralPath $mailHtmlSrc -Destination (Join-Path $morningDir "morning_report_$today.html") -Force
}

# --- Visual assets for OBS / Studio ---
$slides = @(
  "apps\client\public\ops\youtube-test\castle-genesis-holding-slide.png",
  "apps\client\public\ops\youtube-test\castle-genesis-morning-premiere-slide.svg"
)
foreach ($rel in $slides) {
  $src = Join-Path $RepoRoot $rel
  if (Test-Path -LiteralPath $src) {
    Copy-Item -LiteralPath $src -Destination (Join-Path $assetsDir (Split-Path $src -Leaf)) -Force
  }
}

# Export morning slide PNG if missing
$morningPng = Join-Path $RepoRoot "docs\exports\media\youtube\morning_premiere_slide_$today.png"
if (-not (Test-Path -LiteralPath $morningPng)) {
  $svgWork = Join-Path $RepoRoot "docs\exports\media\youtube\morning_premiere_slide_$today.svg"
  if (Test-Path -LiteralPath $svgWork) {
    node (Join-Path $RepoRoot "scripts\export-morning-premiere-slide-png.mjs") $svgWork $morningPng 2>&1 | Out-Null
  }
}
if (Test-Path -LiteralPath $morningPng) {
  Copy-Item -LiteralPath $morningPng -Destination (Join-Path $assetsDir "morning_premiere_slide.png") -Force
}

# --- Evening audio manifest (repo root) ---
$audioFiles = Get-ChildItem -LiteralPath $RepoRoot -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(m4a|mp3|mp4)$' -and $_.Name -notmatch '^\.' } |
  Select-Object Name, Length, FullName

$playlistLines = @("# Evening live playlist manifest ($today)", "# OBS: add as media source", "")
foreach ($a in $audioFiles) {
  $mb = [math]::Round($a.Length / 1MB, 2)
  $playlistLines += "$($a.Name) | ${mb} MB | $($a.FullName)"
}
$playlistPath = Join-Path $eveningDir "evening_playlist_manifest.txt"
Set-Content -LiteralPath $playlistPath -Value ($playlistLines -join "`n") -Encoding UTF8

# Optional long-form VOD for archive
$vodSrc = Join-Path $RepoRoot "docs\exports\media\youtube\castle_genesis_test_kendi_yalanina.mp4"
if (Test-Path -LiteralPath $vodSrc) {
  Copy-Item -LiteralPath $vodSrc -Destination (Join-Path $eveningDir "archive_vod_kendi_yalanina.mp4") -Force
}

# --- Connection matrix ---
$matrix = @"
# E-posta + YouTube baglanti matrisi (V0)

Durum: **BEKLEME** — GoDaddy mail paketi + ilk Premiere zamanlama onaylanana kadar otomatik gorev YOK.

## Gunluk ritim (sabit)

| Saat | E-posta | YouTube (CastleGenesis) |
|------|---------|-------------------------|
| **06:44** | Morning report | **Premiere** (geri sayimli video) |
| **18:44** | SPIRALMMO arsiv tablosu | — |
| **19:44** | — | **Canli yayin** (OBS, manuel baslat) |

## Kimlik

| Rol | Deger | Durum |
|-----|-------|--------|
| YouTube kanal | CastleGenesis | Hazir (VOD test gecti) |
| Google hesap | cankasaplar@gmail.com | Hazir |
| Mail From (hedef) | morning@rhizoh.com | Bekliyor (GoDaddy) |
| Mail From (arsiv) | archive@rhizoh.com | Bekliyor (GoDaddy) |
| Mail To (ops) | cankasaplar@gmail.com | Hazir |
| SMTP relay (simdilik) | SPIRALMMO_SMTP_USER env | Kisisel Gmail App Password |

## Paralel baglanti (06:44)

Ayni sabah ritmi, iki kanal:

1. **YouTube Premiere** — `morning/morning_premiere_latest.mp4` → Studio → Premiere 06:44
2. **E-posta** — `morning/morning_report_latest.html` icerigi → `send-rhizoh-real-layer-morning-report.ps1`

Icerik tonu ayni: observation only, canonical execution yok.

## Aksam 19:44 (canli)

- OBS sahne: `assets/castle-genesis-holding-slide.png`
- Ses: `evening/evening_playlist_manifest.txt`
- Studio stream key: manuel (repoya yazma)
- Baslik sablonu: `[LIVE] Castle Genesis · 19:44 · YYYY-MM-DD`

## Aktivasyon (sen hazir deyince)

1. GoDaddy mail → `scripts/set-rhizoh-mail-identity.ps1`
2. `scripts/setup-castle-genesis-broadcast-rhythm-tasks.ps1 -EnableScheduledTasks`
3. Ilk gun: Studio Premiere + bir kez mail test

"@
Set-Content -LiteralPath (Join-Path $connDir "EMAIL_YOUTUBE_CONNECTION_MATRIX.md") -Value $matrix -Encoding UTF8

# --- Status ---
$status = @{
  status      = "HOLD"
  message     = "Assets ready. No scheduled tasks. No test send/upload."
  preparedAt  = (Get-Date).ToString("o")
  date        = $today
  schedule    = @{
    morningPremiereBuild = "06:30"
    morningPremiereAir   = "06:44"
    morningEmail         = "06:44"
    spiralmmoEmail       = "18:44"
    eveningLive          = "19:44"
  }
  paths = @{
    readyRoot   = $readyRoot
    morningMp4  = Join-Path $morningDir "morning_premiere_latest.mp4"
    morningHtml = Join-Path $morningDir "morning_report_latest.html"
    connection  = Join-Path $connDir "EMAIL_YOUTUBE_CONNECTION_MATRIX.md"
  }
} | ConvertTo-Json -Depth 5

Set-Content -LiteralPath (Join-Path $readyRoot "STATUS.json") -Value $status -Encoding UTF8

Write-Output "STATUS=HOLD"
Write-Output "READY_ROOT=$readyRoot"
Write-Output "MORNING_MP4=$(Join-Path $morningDir 'morning_premiere_latest.mp4')"
Write-Output "MORNING_HTML=$(Join-Path $morningDir 'morning_report_latest.html')"
Write-Output "CONNECTION=$(Join-Path $connDir 'EMAIL_YOUTUBE_CONNECTION_MATRIX.md')"
