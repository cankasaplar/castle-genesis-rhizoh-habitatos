# Activation Manual Evidence Runbook v1.0

**Tag:** `OPERATIONS` · **Checklist SSOT:** [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](../RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md)

Bu runbook MANUAL maddeleri (A1–A9) tamamlamak için adım adım rehberdir.

---

## Hızlı başlangıç

```bash
# 1) Otomatik toplanabilir kanıtlar (DNS, TLS, rules scan, cohort ref)
npm run activation:collect-evidence

# 2) AUTO slice
npm run activation:readiness-check

# 3) İnsan adımları (aşağıda) — kanıtları docs/exports/ops/evidence/ altına koy

# 4) Karar dosyasını güncelle → READY yalnızca tüm manual true + counsel sonrası
#    docs/exports/ops/activation_decision_YYYY-MM-DD.json
```

---

## Kanıt klasörü

| Dosya | Madde | Kim |
|-------|-------|-----|
| `evidence/A1_dns_*.txt` | DNS | Otomatik + Cloudflare screenshot |
| `evidence/A2_tls_*.txt` | TLS | Otomatik + SSL mode screenshot |
| `evidence/A3_counsel_*` | Hukuk | Avukat + founder (private) |
| `evidence/A4_firestore_rules_scan_*.txt` | Rules | Otomatik scan + Console screenshot |
| `evidence/A5_ingress_smoke_*.md` | Ingress smoke | Founder (tarayıcı) |
| `evidence/A6_ui_gate_*.md` | UI gate | Founder (screenshot) |
| `evidence/A8_cohort_sim_*.txt` | Cohort sim | Otomatik |
| `evidence/A9_surface_ack_*.md` | Surface ≠ activation | Founder imza |

---

## A1 — DNS proxied

**Hedef:** Origin IP dünyaya açık değil; edge (Cloudflare) proxied.

**Şu an (2026-06-14):** NS = GoDaddy (`domaincontrol.com`), A = Firebase (`199.36.158.100`). `cf-ray` yok → **henüz proxied sayılmaz**.

**Yapılacaklar:**

1. [Cloudflare](https://dash.cloudflare.com) → Add site `rhizoh.com`
2. Registrar’da NS → Cloudflare nameserver
3. DNS: `@` ve `www` → **Proxied** (turuncu bulut)
4. Transfer lock: GoDaddy panel → açık

**Doğrula:**

```bash
curl -sI https://rhizoh.com | grep -iE 'cf-ray|server:'
```

`cf-ray` görünce `activation_decision_*.json` → `A1_dns_proxied: true`

**Kanıt:** `evidence/A1_cloudflare_dns_screenshot.png` (ekle)

---

## A2 — TLS valid

**Otomatik:** `npm run activation:collect-evidence` — HTTPS 200 + HSTS + HTTP→301 zaten toplanır.

**İnsan:**

1. Cloudflare → SSL/TLS → **Full (strict)**
2. Edge Certificates → Always Use HTTPS **On**

**Kanıt:** `evidence/A2_cloudflare_ssl_screenshot.png`

`A2_tls_valid: true` yalnızca HTTPS smoke + Full (strict) onaylandıktan sonra.

---

## A3 — Legal / counsel

**Bloklayıcı.** Avukat imzası olmadan READY yok.

```bash
npm run legal:export-pack-pdf
```

1. PDF: `docs/exports/legal/Rhizoh_Legal_Pack_Primary_v1.0_DRAFT.pdf`
2. E-posta: [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](legal/COUNSEL_EMAIL_TEMPLATE_V1.0.md)
3. Counsel checklist: [`COUNSEL_PASS_CHECKLIST_V1.0.md`](legal/COUNSEL_PASS_CHECKLIST_V1.0.md)
4. Onay sonrası: `node scripts/seal-legal-reality-spec.mjs`
5. İmzala: [`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md)

**Kanıt:** `evidence/A3_counsel_approval.pdf` (private — repoya secret koymayın; offline arşiv veya private not)

`A3_legal: true` yalnızca counsel pass tamamlandığında.

---

## A4 — Firebase read-only

**Otomatik scan:** `npm run activation:collect-evidence` — `allow write: if true` arar.

**İnsan checklist:**

- [ ] Firebase Console → Firestore Rules = repo `firestore.rules`
- [ ] Anonim kullanıcı `active_castles` yazamaz (auth gerekli)
- [ ] Phase 1 heartbeat ingest route yok (R6 AUTO ✅)

**Kanıt:** Console rules screenshot → `evidence/A4_firebase_console_rules.png`

---

## A5 — Ingress inert smoke (tarayıcı)

Gizli pencerede `https://www.rhizoh.com`:

1. [ ] Legal preamble (3 checkbox) görünür
2. [ ] Onay olmadan uygulama açılmaz
3. [ ] Onayla → Castle shell yüklenir
4. [ ] Refresh → deterministik rota
5. [ ] DevTools Network: `heartbeat`, `phase1`, `device_heartbeat` **yok**

Şablonu kopyala ve doldur:

```bash
cp docs/exports/ops/evidence/A5_ingress_smoke_TEMPLATE.md \
   docs/exports/ops/evidence/A5_ingress_smoke_$(date +%F).md
```

Ekran görüntülerini aynı klasöre koy: `A5_legal_preamble.png`, `A5_network_tab.png`

---

## A6 — UI read-only gate

Kohort / closed admission ekranı:

- [ ] Slider yok
- [ ] Skor / motor çıktısı yok
- [ ] Yalnızca Kabul / Red

Kod kanıtı: `ClosedAdmissionCohortScreen.jsx` → `completeCohortGateNoOpV0` only.

```bash
cp docs/exports/ops/evidence/A6_ui_gate_TEMPLATE.md \
   docs/exports/ops/evidence/A6_ui_gate_$(date +%F).md
```

Screenshot: `A6_cohort_screen.png`

---

## A8 — Cohort sim filed

```bash
npm run legal:go-live-cohort-sim
```

Karar `proceed` ise `A8_cohort_sim_filed: true` (otomatik collect script set eder).

---

## A9 — Surface ≠ activation

Founder onayı (kopyala-imzala veya e-posta):

> rhizoh.com / www DNS canlıdır; bu deployment yüzey ve ingress içindir.  
> Data-plane ve `VITE_RHIZOH_PHASE1_SIGNAL` kapalı kalır.  
> READY ayrı insan switch’idir.

```bash
cp docs/exports/ops/evidence/A9_surface_ack_TEMPLATE.md \
   docs/exports/ops/evidence/A9_surface_ack_$(date +%F).md
```

---

## READY kapatma

Tüm `manualVerified` → `true` ve `npm run activation:readiness-check` → `go: "GO"`:

1. `docs/exports/ops/activation_decision_YYYY-MM-DD.json` → `"decision": "READY"`, `signedBy`, `date`
2. [`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md) imzala
3. Staging’de signal probe (checklist §3) — yalnızca counsel + READY sonrası

**NO-GO kalır:** A3 counsel eksik veya A1 Cloudflare proxied değil.
