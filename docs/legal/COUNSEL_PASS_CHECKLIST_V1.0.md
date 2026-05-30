# Counsel Pass Checklist v1.0

**Counsel OK tanımı:** [`COUNSEL_OK_DEFINITION_V1.0.md`](COUNSEL_OK_DEFINITION_V1.0.md)  
**Amaç:** Hukuki yüzeyi **operasyonel olarak mühürlemek** (system event değil; yazılı onay).  
**Odak:** Şu an **yalnızca KVKK / Türkiye** — GDPR tam programı counsel sonrası genişletme.

**Entity SSOT:** [`RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md`](RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md)  
**PRIMARY export:** `node scripts/export-legal-pack-pdf.mjs` → `docs/exports/legal/Rhizoh_Legal_Pack_Primary_v1.0_DRAFT.pdf`

---

## Bloklayıcılar (counsel öncesi repo)

| # | Madde | Durum |
|---|--------|--------|
| 1 | Entity SSOT: Can Kasaplar, sabit posta, cankasaplar@gmail.com | ☑ repo |
| 2 | PRIMARY PDF export — `npm run legal:export-pack-pdf` | ☑ repo |
| 3 | Counsel review + imza / onay kaydı | ☐ |
| 4 | KVKK aydınlatma wording son kontrol | ☐ |
| 5 | AI açık rıza wording son kontrol | ☐ |
| 6 | Yurtdışı aktarım / SCC yaklaşımı notu onayı | ☐ [`RHIZOH_CROSS_BORDER_TRANSFER_NOTE_V1.0.md`](RHIZOH_CROSS_BORDER_TRANSFER_NOTE_V1.0.md) |

---

## Counsel’e gönderilecek paket

1. `Rhizoh_Legal_Pack_Primary_v1.0_DRAFT.pdf`
2. E-posta: [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](COUNSEL_EMAIL_TEMPLATE_V1.0.md)
3. *(İç)* [`KVKK_COMPLIANCE_CHECKLIST_V0.1.md`](KVKK_COMPLIANCE_CHECKLIST_V0.1.md)

**Göndermeyin:** teknik mimari özeti (hukuki iddia içermez).

---

## Counsel sonrası (mühür)

- [ ] Onaylı metinler `apps/client/public/legal/*.html` ile senkron
- [ ] `SESSION_LOG` — legal thaw kaydı
- [ ] `node scripts/seal-legal-reality-spec.mjs` (checksum)
- [ ] [`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](../ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md) — Counsel satırı ☑

---

## Sıra (onaylanmış)

1. **Counsel finalize** (bu checklist)  
2. **READY / HOLD** imzası  
3. Staging smoke (ingress, cookie network tab)  
4. Kapalı signal probe (`VITE_RHIZOH_PHASE1_SIGNAL` off doğrulama)  
5. Çok kontrollü Phase 1 thaw  

**Not:** Deployment ≠ activation. Yüzey/domain/legal akış canlı olabilir; signal / ingestion / external→state coupling kapalı kalır.
