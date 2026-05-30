# rhizoh.com — GoDaddy mail kurulumu (V0)

**Tag:** `OPERATIONS`  
**Hedef:** Morning / SPIRALMMO raporlari `morning@rhizoh.com` kimliginden gitsin; sen `cankasaplar@gmail.com` (veya baska) **alici** ol.

Repo scriptleri: `scripts/set-spiralmmo-gmail-env.ps1`, `scripts/set-rhizoh-mail-identity.ps1`, `docs/RHIZOH_OPS_MAIL_IDENTITY_V0.md`.

---

## GoDaddy'de ne var?

GoDaddy genelde su paketleri satar (panelinde isim degisebilir):

| Paket (ornek isim) | Arka plan | Script uyumu |
|--------------------|-----------|----------------|
| **Professional Email** / Email Essentials | Titan veya GoDaddy mail | SMTP var; App Password yok — normal sifre |
| **Microsoft 365 Email** | Outlook | `smtp.office365.com:587` |
| **Google Workspace** (GoDaddy uzerinden) | Gmail arayuzu | **En uyumlu** — mevcut Gmail SMTP + App Password scriptleri |

**Oneri:** Zaten GoDaddy'de **domain + mail paketi** varsa once panelde paketi ac. Yoksa veya sadece DNS varsa:

1. **Hizli + ucuz:** GoDaddy **Professional Email** → `morning@`, `archive@` kutulari  
2. **Uzun vade + script kolayligi:** **Google Workspace** (GoDaddy veya direkt Google) → ayni `smtp.gmail.com` akisi

---

## Adim 1 — GoDaddy panel

1. [GoDaddy](https://www.godaddy.com) → **My Products** → **rhizoh.com**
2. **Email** / **Professional Email** / **Microsoft 365** bolumune gir
3. Paket yoksa: **Add Email** — domain basina 1–2 kutu yeter (V0):
   - `morning@rhizoh.com` — sabah raporu gonderen
   - `archive@rhizoh.com` — SPIRALMMO gunluk (veya tek kutu + alias)

**Alias:** Tek kutuda `ops@rhizoh.com` acip `morning` / `archive` alias tanimlamak da olur (urune gore).

---

## Adim 2 — Kutulari olustur

| Adres | Rol |
|-------|-----|
| `morning@rhizoh.com` | From: Rhizoh Morning |
| `archive@rhizoh.com` | From: Rhizoh Archive |
| `cankasaplar@gmail.com` | **Sadece alici** (`SPIRALMMO_REPORT_TO`) |

MX kayitlari GoDaddy mail satin alinca genelde **otomatik** ayarlanir. DNS baska yerde (Cloudflare) ise MX'i bozma — mail doc: `docs/INFRASTRUCTURE_DNS_HARDENING_V0.1.md` (SPF/DMARC sonra).

---

## Adim 3 — SMTP (script icin)

### A) Google Workspace (GoDaddy veya google.com)

1. Workspace admin → kullanici `morning@rhizoh.com`
2. 2 adimli dogrulama + **App Password** (kullanici hesabinda)
3. SMTP: `smtp.gmail.com`, port `587` (script zaten dener)

```powershell
powershell -File scripts/set-spiralmmo-gmail-env.ps1 `
  -GmailAddress "morning@rhizoh.com" `
  -AppPassword "16 karakter app password" `
  -ReportTo "cankasaplar@gmail.com"

powershell -File scripts/set-rhizoh-mail-identity.ps1 `
  -MorningFrom "morning@rhizoh.com" `
  -MorningFromName "Rhizoh Morning" `
  -ArchiveFrom "archive@rhizoh.com" `
  -ArchiveFromName "Rhizoh Archive"
```

`SPIRALMMO_SMTP_USER` = **gonderen kutu**; From = ayni adres → domain uyarisi kalkar.

### B) GoDaddy Professional Email (Titan / secureserver)

GoDaddy yardim sayfasindaki SMTP bilgisini kullan (ornek, urune gore dogrula):

- Sunucu: `smtpout.secureserver.net` veya panelde yazan host
- Port: `465` (SSL) veya `587`
- Kullanici: tam adres `morning@rhizoh.com`
- Sifre: kutu sifresi (App Password degil)

**Not:** Mevcut script `smtp.gmail.com` kullaniyor. GoDaddy SMTP icin `scripts/lib/gmail-smtp-send.ps1` genisletmesi veya env `RHIZOH_SMTP_HOST` eklenmesi gerekir — Workspace yoksa bunu bir sonraki PR'da ekleyebiliriz.

### C) Microsoft 365 (GoDaddy)

- SMTP: `smtp.office365.com`, port `587`, TLS
- Kullanici: `morning@rhizoh.com`
- Modern auth bazen App Password ister; panel dokumanina bak

---

## Adim 4 — Test

```powershell
powershell -File scripts/send-rhizoh-real-layer-morning-report.ps1 -DryRun
powershell -File scripts/send-rhizoh-real-layer-morning-report.ps1
```

Gelen kutuda:

- **From:** Rhizoh Morning &lt;morning@rhizoh.com&gt;
- **To:** kisisel Gmail
- Icerik: metin morning report (kup yok)

---

## Hangisini secelim? (karar agaci)

```
GoDaddy'de mail paketi VAR mi?
  EVET → Panelde urun adi ne?
    "Google Workspace" → Adim 3A (en kolay script)
    "Microsoft 365"  → Adim 3C (+ ev SMTP host)
    "Professional Email" → Adim 3B (+ script SMTP host patch)
  HAYIR → Sadece domain DNS
    → GoDaddy'den Email ekle VEYA Google Workspace trial
```

**Pratik oner:** GoDaddy paketinde **Google Workspace** secenegi varsa onu al — Castle scriptleri degismeden calisir. Sadece **Professional Email** varsa once onu kullan; SMTP host patch'i iste.

---

## Sonraki (ops)

- SPF + DMARC TXT (`docs/INFRASTRUCTURE_DNS_HARDENING_V0.1.md`)
- `observe@rhizoh.com` Reply-To (zaten config'te planli)
- 06:44 gorev: `scripts/setup-rhizoh-real-layer-morning-task.ps1`
