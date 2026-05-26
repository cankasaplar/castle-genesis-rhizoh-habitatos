# Rhizoh Legal Ingress Freeze v1.0

**Status:** FROZEN — access consent layer (not growth onboarding)  
**Phase:** Pre-READY — data-plane inert; legal surface primary

---

## 1. Purpose

| Is | Is not |
|----|--------|
| Hukuki geçit / access consent | Onboarding funnel |
| Modular TR legal pages | Single dev manifesto PDF |
| Separate checkboxes + audit timestamp | Bundled “I agree to everything” |

---

## 2. Modular documents (public)

| Document | Path | Ingress checkbox |
|----------|------|------------------|
| Kullanım Şartları | `/legal/terms-tr.html` | `terms` |
| Gizlilik Politikası | `/legal/privacy-tr.html` | (linked; covered under kvkk flow) |
| KVKK Aydınlatma | `/legal/kvkk-aydinlatma-tr.html` | `kvkkAydinlatma` |
| Çerez Politikası | `/legal/cookies-tr.html` | cookie banner (separate layer) |
| Açık Rıza (AI + yurtdışı) | `/legal/ai-open-consent-tr.html` | `aiCrossBorderConsent` |

**Markdown SSOT:** `docs/legal/RHIZOH_*_TR_V1.0.md` · **Entity:** [`RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md`](RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md) · **AI map:** [`RHIZOH_AI_PROVIDER_MAPPING_V1.0.md`](RHIZOH_AI_PROVIDER_MAPPING_V1.0.md)

---

## 3. Ingress UI (frozen behavior)

1. User sees **short lead** + links to full texts.  
2. **Three separate checkboxes** — all required to proceed.  
3. **Continue disabled** until all checked.  
4. On accept → `acknowledgeLegalAccessV0()` writes session ack + **audit ring** (localStorage).  
5. Cohort step (if enabled) remains **no-op gate** — not legal replacement.

---

## 4. AI provider disclosure (current framing)

> Yapay zekâ özellikleri, **ileride** yurtdışında bulunan hizmet sağlayıcıları üzerinden çalışabilir.

**Potansiyel sağlayıcı listesi (disclosure only):** OpenAI, Anthropic, Google, xAI.

**Operational truth:** Data-plane inactive; no live user ingestion / heartbeat until READY + `VITE_RHIZOH_PHASE1_SIGNAL`.

---

## 5. Cookie layer

| Rule | Value |
|------|--------|
| Analytics default | **OFF** |
| Banner | Minimal — necessary cookies only note |
| Policy page | Published before analytics enable |

---

## 6. Sequence (ops)

1. **Counsel pass** — [`COUNSEL_PASS_CHECKLIST_V1.0.md`](COUNSEL_PASS_CHECKLIST_V1.0.md) (PRIMARY PDF, imza, KVKK/AI wording, SCC notu)  
2. Ingress freeze (this doc + code) — **deployment ≠ activation**  
3. READY / HOLD sign-off — [`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](../ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md)  
4. Staging smoke → kapalı signal probe → kontrollü Phase 1 thaw  

---

## 7. Code map

| Module | Role |
|--------|------|
| `ingress_router.js` | Ack schema v0.2, audit append, cookie consent |
| `LegalPreambleScreen.jsx` | Three checkboxes |
| `CookieConsentBanner.jsx` | Cookie gating |
| `RhizohIngressFlow.jsx` | Wire banner |

---

*Legal ingress freeze v1.0 — May 2026.*
