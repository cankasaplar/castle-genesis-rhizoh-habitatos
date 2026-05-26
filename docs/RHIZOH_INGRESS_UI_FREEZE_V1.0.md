# Rhizoh Ingress UI Freeze v1.0

**Status:** FROZEN (copy SSOT) — low-risk polish pass applied  
**Code SSOT:** `ingress_router.js` copy functions

---

## 1. Legal preamble (first screen)

| Field | Value |
|-------|--------|
| Title | Kullanım ve gizlilik özeti |
| Body | 3-bullet ToS/KVKK özeti |
| Data controller | Can Kasaplar · Serencebey Yokuşu 13/2 Beşiktaş · cankasaplar@gmail.com (`legalEntityConstantsV0.js`) |
| Consent | 3 ayrı checkbox (ToS, KVKK, AI açık rıza) — `acknowledgeLegalAccessV0` v0.2 |
| CTA | **Kabul et ve devam et** |
| Links | ToS + KVKK only (no technical spec link on main screen) |

Removed from UI: lore, manifesto footer, “epistemic” system language on surface.

---

## 2. Erişim onayı (flag on) — NOT onboarding

| Control | Value |
|---------|--------|
| User sees | **Evet, devam et** / **Hayır** |
| User does not see | Sliders, scores, stress class, “beta signup” framing |

Backend: `completeCohortGateNoOpV0` — **no-op evaluation hook**; admission engine **not** called; output ignored.

---

## 3. Error screen

Kinds: `offline` · `timeout` · `gateway` · `unknown` — `IngressErrorScreen.jsx`

---

## Related

- [`RHIZOH_LOW_RISK_ZONE_OPERATIONS_V1.0.md`](RHIZOH_LOW_RISK_ZONE_OPERATIONS_V1.0.md)
- [`RHIZOH_INGRESS_FLOW_V1.0.md`](RHIZOH_INGRESS_FLOW_V1.0.md)
