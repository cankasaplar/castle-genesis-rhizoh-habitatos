# Rhizoh Product Gaps v0 — Honest Inventory

**Status:** OPS snapshot · 2026-06-24  
**Phase:** 0.5 — perception frozen · data-plane HOLD

---

## Implemented (shipped)

| Area | What |
|------|------|
| Invite ingress | `/invite` landing, meaning layer, opaque tokens |
| Observer plane | `observe()`, visitor trace, fingerprint, return field |
| Narrative plane | semantic lookup, `narrativePlane.resolve/build` |
| Identity projection | `identityManifest`, audit bundle, public `.well-known` |
| Map / world | `/world/space`, sovereign pins, Cesium/Leaflet |
| Peer castles (conditional) | Firestore `active_castles` + opt-in grey pins |
| Founder tools | `inviteOps.generate()`, cohort inspect strip |
| **Academy landing** | `/academy` — trust page (what / not / stage / paper / roadmap) |
| **Founder Circle page** | `/founder-circle` — $25 framing + local interest API |
| **Paper PDF (public)** | `/rhizoh/academic/paper-v0.1.pdf` |
| Paper evidence | `epistemicSeparationProof`, `invitationStudy.export` |
| Resonance (measure only) | `epistemicResonanceField.measure()` — no coupling |
| UI v1 | Epistemic dashboard panel, founder cohort panel |
| **Life OS v0.1** | World Bridge · Memory graph · Habitat climate · `lifeOsStatus()` prod-verified |
| **Studio V1 visibility** | 8-camera dashboard · adapters · Life Memory panel · Director · Output Pack |
| **World Space broadcast** | `?channel=chess|go|checkers&broadcast=1` — no-scroll OBS layout |
| **Academy union boot wire** | Go + checkers demo moves on core boot (`armed 3/3` hedef) |
| **Full system report** | `__RHIZOH_FULL_REPORT__()` + Life OS diagnostic |

---

## Partial

| Gap | Blocker |
|-----|---------|
| Epistemic dashboard full spec | Layer 2/3 UI minimal on world tab only |
| Invitation study aggregate | Per-browser export; no server rollup |
| Founder sees invitees on map | Auth + castle ACTIVE + geo + Show pins |
| Company dashboard | Spec only (`RHIZOH_COMPANY_DASHBOARD_SPEC_V1.md`) |
| Phase 1 real signal | READY/HOLD not signed |
| Preprint PDF export | ✔ public static path; regenerate via `academic:export-preprint` |
| **Observation proof layer** | `?proof=1` panel · `observationState.snapshot()` · tier `broadcast_partial` |
| Reality Binding demo video | Runbook + proof overlay — [`RHIZOH_REALITY_BINDING_DEMO_RUNBOOK_V0.md`](RHIZOH_REALITY_BINDING_DEMO_RUNBOOK_V0.md) |
| Founder Circle billing (Stripe) | Manual onboarding only |

---

## Missing (product)

| Item | Priority |
|------|----------|
| **2-browser Reality Binding video** | **P0** — trust milestone |
| **Studio Life Memory panel** | ✔ shipped — Studio drawer |
| **First YouTube observation series** | **P0** — Ep 1 Chess Short kaydı (pack ready, manuel upload) |
| **Render API keys** | **P0** — [`RENDER_API_GAPS_CHECKLIST_V1.0.md`](ops/RENDER_API_GAPS_CHECKLIST_V1.0.md) |
| **First 20 Founder Circle witnesses** | **P0** — manual invites |
| Go/Dama 8-camera cluster parity | Medium — tek tahta + öğrenme şeridi var; chess parity sonraki sprint |
| KataGo / Lc0 sidecar on Render | Medium — env + ayrı servis |
| Founder Circle Stripe / membership backend | High after video |
| Founder multi-invitee map view | High — needs `active_castles` + UX |
| Epistemic dashboard on invite landing | Medium |
| Product insights dashboard wire-up | Medium — component orphan |
| Identity evolution (Phase 1) | Deferred by design |
| Epistemic resonance → system modulation | **Forbidden** (non-agentic) |

---

## Console quick check

```javascript
window.__rhizoh.founderCohort.build();
window.__rhizoh.epistemicSeparationProof.build();
window.__rhizoh.invitationStudy.export();
window.__rhizoh.epistemicResonanceField.measure();
__rhizoh.academyLearningUnion()
__rhizoh.outputPack({ locale: "tr" })
```

Founder UI: `?founder=1` or `?cohort=review` on rhizoh.com

---

## Related

- [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md)
- [`RENDER_API_GAPS_CHECKLIST_V1.0.md`](ops/RENDER_API_GAPS_CHECKLIST_V1.0.md)
- [`RHIZOH_INVITATION_STUDY_V0.md`](RHIZOH_INVITATION_STUDY_V0.md)
- [`RHIZOH_EPISTEMIC_DASHBOARD_V1.md`](RHIZOH_EPISTEMIC_DASHBOARD_V1.md)
