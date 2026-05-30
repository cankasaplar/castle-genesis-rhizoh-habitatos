# Counsel OK — Tanım ve Süreç v1.0

**Counsel OK bir system event değildir.** Doküman + yazılı onay sürecidir.

**Faz çerçevesi:** Tam hukuki garanti değil; kontrollü düşük riskli yayın — [`CONTROLLED_EXPOSURE_FRAMEWORK_V1.0.md`](../ops/CONTROLLED_EXPOSURE_FRAMEWORK_V1.0.md).

---

## Counsel OK = TRUE ne demek?

Avukatın **yazılı olarak** şu üç başlığı onaylaması:

| # | Konu | Onay |
|---|------|------|
| 1 | **Kullanım Şartları (ToS)** | Uygun |
| 2 | **KVKK Aydınlatma + açık rıza** | Yeterli |
| 3 | **Yurtdışı veri aktarımı (AI sağlayıcılar)** | Hukuken kabul edilebilir seviyede açıklanmış |

**Örnek yazılı onay (e-posta / imzalı PDF / tercihen e-posta):**

> Rhizoh sistemine ait KVKK ve kullanım şartları incelenmiş, mevcut haliyle kullanıma uygun görülmüştür.

Bu metin `docs/exports/ops/counsel_approval_YYYY-MM-DD.json` veya e-posta arşivine kaydedilir.

---

## Avukat cevap tipleri

| Cevap | Aksiyon | Counsel OK |
|-------|---------|------------|
| ✔ Uygun | READY pipeline devam | **TRUE** |
| ⚠ Şu maddeler revize | Küçük döngü → yeniden export | FALSE → tekrar |
| ❌ Riskli | Yeniden yazım | FALSE |

---

## Süreç (OP-2 Activation Readiness)

### STEP 1 — Final legal export

```bash
npm run legal:export-pack-pdf
```

**Çıktı:** `docs/exports/legal/Rhizoh_Legal_Pack_Primary_v1.0_DRAFT.pdf`

İçerik (tek PDF): Entity SSOT kapak · ToS · KVKK · Çerez · AI açık rıza · Yurtdışı notu.

### STEP 2 — Counsel submission

Gönderilecekler:

1. PRIMARY PDF (yukarı)
2. *(İsteğe bağlı ayrı ek)* Cross-border not — PDF içinde Bölüm IX’da özet var

E-posta taslağı: [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](COUNSEL_EMAIL_TEMPLATE_V1.0.md)

### STEP 3 — Firebase staging deploy

- Domain çalışır · legal gate aktif · **signal OFF**
- **Deployment ≠ activation**

### STEP 4 — Readiness check

```bash
npm run activation:readiness-check
```

### STEP 5 — HOLD / READY

[`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](../ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md) — imza: mimar · counsel · ops

---

## Mühendislik ayrımı

**Counsel OK = sistemin çalışması için değil; çalışmasının yasal olarak izinli olması için.**

❌ Deploy ettik, sonra avukata sorarız  
✔ Avukat OK → sonra activation

---

## Şu anki durum (repo)

| Madde | Durum |
|-------|--------|
| Legal SSOT + adres + cankasaplar@gmail.com | ✔ |
| UI legal gate (3 checkbox) | ✔ |
| Cookie consent (analytics kapalı) | ✔ |
| AI open consent + provider tablosu | ✔ |
| PRIMARY PDF export | ✔ (yeniden üretin: `npm run legal:export-pack-pdf`) |
| **Counsel OK** | **❌ — sizde** |

Checklist: [`COUNSEL_PASS_CHECKLIST_V1.0.md`](COUNSEL_PASS_CHECKLIST_V1.0.md)
