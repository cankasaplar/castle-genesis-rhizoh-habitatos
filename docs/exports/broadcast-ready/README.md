# Broadcast-ready (HOLD)

**Durum:** Dosyalar hazir · **test yok** · **zamanlanmis gorev yok** (GoDaddy mail + senin onayin sonrasi).

Yenile:

```powershell
powershell -File scripts/prepare-castle-genesis-broadcast-ready.ps1
```

## Klasorler

| Klasor | Icerik |
|--------|--------|
| `morning/` | Premiere MP4 + mail HTML onizleme |
| `evening/` | 19:44 canli checklist + playlist manifest |
| `connection/` | E-posta ↔ YouTube matrisi |
| `assets/` | OBS slide PNG/SVG |
| `STATUS.json` | Makine-okunur durum |

## Ritim (sabit)

- **06:44** — YouTube Premiere + morning e-posta
- **18:44** — SPIRALMMO e-posta
- **19:44** — Castle Genesis canli (OBS, manuel)

Baglanti: `connection/EMAIL_YOUTUBE_CONNECTION_MATRIX.md`
