# Rhizoh Morning Report (V0)

Status: Observation only · **no execution authority**

## Icerik

- Küp / görsel yok — yalnizca kisa metin (REAL LAYER MORNING, 06:44)
- Mail kimligi: `docs/RHIZOH_OPS_MAIL_IDENTITY_V0.md`

## Ritim

| Saat | Kanal |
|------|--------|
| **06:30** | Premiere MP4 uret (`build-castle-genesis-morning-premiere-video.ps1`) |
| **06:44** | YouTube **Premiere** (geri sayim) + e-posta morning report |
| **19:44** | Castle Genesis **canli** (OBS, HOLD) — [`CASTLE_GENESIS_BROADCAST_RHYTHM_V0.md`](CASTLE_GENESIS_BROADCAST_RHYTHM_V0.md) |
| **18:44** | SPIRALMMO arsiv tablosu (e-posta) |

## Komutlar

```powershell
powershell -File scripts/set-rhizoh-mail-identity.ps1
powershell -File scripts/send-rhizoh-real-layer-morning-report.ps1 -DryRun
powershell -File scripts/send-rhizoh-real-layer-morning-report.ps1
powershell -File scripts/setup-rhizoh-real-layer-morning-task.ps1 -DailyTime "06:44"
```
