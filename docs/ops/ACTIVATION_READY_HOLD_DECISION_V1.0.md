# Activation READY / HOLD Decision v1.0

**Date:** __________ · **Signed by:** __________ · **Environment:** staging / production

| Check | Status |
|-------|--------|
| Entity SSOT (adres + cankasaplar@gmail.com) | ☐ |
| Counsel pass ([`COUNSEL_PASS_CHECKLIST_V1.0.md`](../legal/COUNSEL_PASS_CHECKLIST_V1.0.md)) | ☐ |
| PRIMARY PDF export + counsel imza | ☐ |
| DNS proxied (`rhizoh.com`) | ☐ |
| TLS valid | ☐ |
| Legal ingress (3 checkbox + audit) | ☐ |
| Cookie analytics default OFF + gated | ☐ |
| Firebase rules reviewed (no public heartbeat write) | ☐ |
| `VITE_RHIZOH_PHASE1_SIGNAL` OFF | ☐ |
| Heartbeat route absent / inert | ☐ |
| `npm run activation:readiness-check` AUTO pass | ☐ |
| Manual checklist A1–A9 | ☐ |

**Auto report:** `docs/exports/ops/activation_readiness_v1.0.json`

---

## Decision

| | |
|-|-|
| ☐ **READY** | All above verified; staging signal may be considered per ops protocol |
| ☐ **HOLD** | Blockers: _________________________________ |

**Signature:** _________________________ **Date:** __________

**JSON log:** copy `docs/ops/activation_decision_LOG.template.json` → `docs/exports/ops/activation_decision_YYYY-MM-DD.json`
