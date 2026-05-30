# Castle Genesis — yayin ritmi (V0)

**Tag:** `RESEARCH-ONLY`  
**Durum:** **HOLD** — dosyalar hazir, test yayini / otomatik gorev yok (GoDaddy mail sonrasi).

Hazir paket: [`docs/exports/broadcast-ready/`](exports/broadcast-ready/)

```powershell
powershell -File scripts/prepare-castle-genesis-broadcast-ready.ps1
```

---

## Gunluk ritim (sabit)

| Saat | E-posta | YouTube (CastleGenesis) |
|------|---------|-------------------------|
| **06:44** | Morning report | **Premiere** (geri sayimli video) |
| **18:44** | SPIRALMMO arsiv | — |
| **19:44** | — | **Canli yayin** (OBS, manuel) |

Baglanti matrisi: `docs/exports/broadcast-ready/connection/EMAIL_YOUTUBE_CONNECTION_MATRIX.md`

---

## Sabah 06:44 — Premiere

- Dosya: `broadcast-ready/morning/morning_premiere_latest.mp4`
- Checklist: `broadcast-ready/morning/PREMIERE_0644_STUDIO_CHECKLIST.md`
- Uret: `scripts/build-castle-genesis-morning-premiere-video.ps1`

---

## Aksam 19:44 — Canli

- Checklist: `broadcast-ready/evening/LIVE_1944_STUDIO_CHECKLIST.md`
- OBS: `broadcast-ready/assets/castle-genesis-holding-slide.png`
- Playlist: `broadcast-ready/evening/evening_playlist_manifest.txt`
- Detay: [`CASTLE_GENESIS_YOUTUBE_LIVE_SETTINGS_V0.md`](CASTLE_GENESIS_YOUTUBE_LIVE_SETTINGS_V0.md)

---

## Aktivasyon (sen hazir deyince)

1. GoDaddy mail → `scripts/set-rhizoh-mail-identity.ps1`
2. `scripts/setup-castle-genesis-broadcast-rhythm-tasks.ps1 -EnableScheduledTasks`
3. Ilk gun Studio Premiere + tek mail test

**Simdi:** yalnizca `prepare-castle-genesis-broadcast-ready.ps1` (gorev kurmaz).
