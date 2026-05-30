# E-posta + YouTube baglanti matrisi (V0)

Durum: **BEKLEME** â€” GoDaddy mail paketi + ilk Premiere zamanlama onaylanana kadar otomatik gorev YOK.

## Gunluk ritim (sabit)

| Saat | E-posta | YouTube (CastleGenesis) |
|------|---------|-------------------------|
| **06:44** | Morning report | **Premiere** (geri sayimli video) |
| **18:44** | SPIRALMMO arsiv tablosu | â€” |
| **19:44** | â€” | **Canli yayin** (OBS, manuel baslat) |

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

1. **YouTube Premiere** â€” morning/morning_premiere_latest.mp4 â†’ Studio â†’ Premiere 06:44
2. **E-posta** â€” morning/morning_report_latest.html icerigi â†’ send-rhizoh-real-layer-morning-report.ps1

Icerik tonu ayni: observation only, canonical execution yok.

## Aksam 19:44 (canli)

- OBS sahne: ssets/castle-genesis-holding-slide.png
- Ses: evening/evening_playlist_manifest.txt
- Studio stream key: manuel (repoya yazma)
- Baslik sablonu: [LIVE] Castle Genesis Â· 19:44 Â· YYYY-MM-DD

## Aktivasyon (sen hazir deyince)

1. GoDaddy mail â†’ scripts/set-rhizoh-mail-identity.ps1
2. scripts/setup-castle-genesis-broadcast-rhythm-tasks.ps1 -EnableScheduledTasks
3. Ilk gun: Studio Premiere + bir kez mail test

