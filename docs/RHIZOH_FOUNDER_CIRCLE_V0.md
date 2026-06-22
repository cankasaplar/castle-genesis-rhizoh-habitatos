# Rhizoh Founder Circle v0

**SPECFLOW:** `RESEARCH-ONLY` · early validation · not billing-ready  
**Status:** Interest registration + honest promises · manual onboarding

---

## Purpose

Founder Circle is **early product validation**, not psychological support and not a chess subscription.

First members are **research witnesses** — they pay for the Rhizoh story (authority arbitration, observer-centric systems, reconciliation-based reality), not for a finished multiplayer game.

---

## Public surfaces

| URL | Purpose |
|-----|---------|
| `/academy` | Academy trust landing (what / what not / stage / paper / roadmap) |
| `/founder-circle` | Founder Circle page — $25/mo framing, interest form |
| `/rhizoh/academic/paper-v0.1.pdf` | Preprint PDF (static) |

---

## What we honor today (no oversell)

| Promise | Status |
|---------|--------|
| Early access to research preview surfaces | ✔ `/academy/*`, `/invite`, console APIs |
| Monthly live demo (Reality Binding) | ⏳ manual schedule — see runbook |
| Academy + paper access | ✔ landing + PDF |
| Closed dev log channel | ⏳ external (Discord/manual) — not in repo |
| Witness voice in decisions | ✔ interpretation only — never execution |

---

## What is NOT sold

- Finished chess / sports product
- WorldSports bundle
- Data-plane READY “live product” claim
- Investment returns

---

## Interest registration (v0)

No Stripe yet. Page stores interest in **browser localStorage** and exposes founder export:

```javascript
window.__rhizoh.founderCircle.interest({ email: "witness@example.com", note: "…" })
window.__rhizoh.founderCircle.export()
```

Mailto fallback: `cankasaplar@gmail.com`

---

## Launch stack (honest order)

1. Academy landing (`/academy`)
2. Founder Circle (`/founder-circle`)
3. Paper PDF (public path)
4. 2-browser Reality Binding video — [`RHIZOH_REALITY_BINDING_DEMO_RUNBOOK_V0.md`](RHIZOH_REALITY_BINDING_DEMO_RUNBOOK_V0.md)
5. First 20 invites (`inviteOps.generate()`)
6. **Then** Go / basketball / WorldSports

---

## Related

- [`RHIZOH_PRODUCT_GAPS_V0.md`](RHIZOH_PRODUCT_GAPS_V0.md)
- [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md)
- [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md)
- Runtime: `apps/client/src/components/RhizohFounderCirclePageV0.jsx`

*RESEARCH-ONLY — does not extend execution authority.*
