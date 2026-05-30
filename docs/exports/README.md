# Castle / Rhizoh — export ciktilari (SSOT)

Tek `export` adi altinda karismasin diye alt klasorler:

| Klasor | Icerik |
|--------|--------|
| **`ops/`** | Ops harness JSON, simulasyon raporlari, activation readiness |
| **`legal/`** | Counsel PDF/HTML (legal pack) |
| **`media/youtube/`** | YouTube test videolari, ses kopyalari, ffmpeg log |
| **`media/mail/`** | Morning report HTML onizleme |

Eski yollar (kaldirildi):

- ~~`docs/exports/ops/`~~ → `docs/exports/ops/`
- ~~`docs/exports/legal/`~~ → `docs/exports/legal/`

Outreach briefing: `docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0/export/` (ayri, degismedi).

## Broadcast-ready (HOLD — sabah/aksam paketi)

**`docs/exports/broadcast-ready/`** — Premiere MP4, mail HTML, OBS assets, 19:44 checklist.

```powershell
powershell -File scripts/prepare-castle-genesis-broadcast-ready.ps1
```

## YouTube media

`docs/exports/media/youtube/` — test VOD + morning premiere uretim ciktilari
