# Rhizoh Ops Mail Identity (V0)

## Sorun (mantiksal eksik)

Bugunku kurulumda **gonderen = alici** (ornegin `cankasaplar@gmail.com` → `cankasaplar@gmail.com`) olunca mail **kendine not** gibi gorunur; sistemden gelen rapor hissi olmaz.

Hedef:

| Rol | Adres ornegi | Anlam |
|-----|----------------|--------|
| **SMTP auth (relay)** | Teknik hesap / App Password | Postayi tasiyan motor |
| **From (kimlik)** | `morning@rhizoh.com`, `archive@rhizoh.com` | Kullanicinin gordugu gonderen |
| **To (alici)** | `cankasaplar@gmail.com` | Senin ops inbox'un |

Yani: **almak istedigin yer kisisel inbox; gelmesini istedigin kimlik sistem adresi.**

## Config

- `config/rhizoh-ops-mail-identity.v0.json` — varsayilan kanallar
- Env override:
  - `RHIZOH_MAIL_MORNING_FROM`, `RHIZOH_MAIL_MORNING_FROM_NAME`
  - `RHIZOH_MAIL_SPIRALMMO_FROM`, `RHIZOH_MAIL_SPIRALMMO_FROM_NAME`
  - `SPIRALMMO_REPORT_TO` — alici (degistirme: kisisel mailin)
  - `SPIRALMMO_SMTP_USER` + `SPIRALMMO_SMTP_APP_PASSWORD` — relay

Kurulum:

```powershell
powershell -File scripts/set-rhizoh-mail-identity.ps1
powershell -File scripts/set-spiralmmo-gmail-env.ps1 -GmailAddress "..." -AppPassword "..."
```

## rhizoh.com @ GoDaddy

Domain GoDaddy'deyse mail paketi de orada acilabilir (Professional Email, M365, Workspace). Adim adim: **[`RHIZOH_GODADDY_MAIL_SETUP_V0.md`](RHIZOH_GODADDY_MAIL_SETUP_V0.md)**.

## Gercek @rhizoh.com icin yollar

### A) Google Workspace (onerilen, domain sahibiysen)

1. `rhizoh.com` MX → Google
2. `morning@rhizoh.com`, `archive@rhizoh.com` kullanicilari veya alias
3. SMTP: Workspace SMTP + App Password **veya** ayni kutudan gonder
4. `RHIZOH_MAIL_MORNING_FROM=morning@rhizoh.com`, `SPIRALMMO_SMTP_USER=morning@rhizoh.com`

### B) Gmail + "Send mail as" (gecici)

1. Google Hesap → **Send mail as** → `morning@rhizoh.com` ekle (dogrulama maili)
2. `RHIZOH_MAIL_MORNING_FROM=morning@rhizoh.com`
3. `SPIRALMMO_SMTP_USER` = dogrulanmis Gmail

Gmail dis domain From'u reddedebilir; dogrulanmazsa From yine kisisel Gmail kalir.

### C) Resend / SendGrid / Postmark (API, Phase 1)

1. `rhizoh.com` DNS (SPF, DKIM)
2. Script'e API modu eklenir (SMTP yerine HTTPS)
3. From: `morning@rhizoh.com` — relay tamamen ayri

### D) Inbound (ileride — "gercek maillerden almak" baska anlam)

Dis kaynaktan **okumak** (IMAP / Gmail API) icin ayri kanal:

- `RHIZOH_MAIL_INBOUND_ENABLED=1`
- `RHIZOH_MAIL_INBOUND_IMAP_*` veya OAuth
- Morning raporu = gelen kutudan ozet + arsiv

Bu V0'da yok; outbound kimlik once cozulur.

## Morning report (guncel)

- Küp yok; yalnizca metin HTML
- `scripts/send-rhizoh-real-layer-morning-report.ps1`
- Dry-run: `-DryRun` (From / To / SMTP auth ayri satirlar)

## Hizli test

```powershell
powershell -File scripts/send-rhizoh-real-layer-morning-report.ps1 -DryRun
powershell -File scripts/send-rhizoh-real-layer-morning-report.ps1
```

Gelen kutuda **From: Rhizoh Morning &lt;morning@rhizoh.com&gt;** gormelisin. Gormuyorsan B veya A adimina gec.
