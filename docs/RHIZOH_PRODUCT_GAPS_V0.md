# Rhizoh Product Gaps v0 — Honest Inventory

**Status:** OPS snapshot · 2026-06-21  
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
| Paper evidence | `epistemicSeparationProof`, `invitationStudy.export` |
| Resonance (measure only) | `epistemicResonanceField.measure()` — no coupling |
| UI v1 | Epistemic dashboard panel, founder cohort panel |

---

## Partial

| Gap | Blocker |
|-----|---------|
| Epistemic dashboard full spec | Layer 2/3 UI minimal on world tab only |
| Invitation study aggregate | Per-browser export; no server rollup |
| Founder sees invitees on map | Auth + castle ACTIVE + geo + Show pins |
| Company dashboard | Spec only (`RHIZOH_COMPANY_DASHBOARD_SPEC_V1.md`) |
| Phase 1 real signal | READY/HOLD not signed |
| Preprint PDF export | `academic:export-paper` only; preprint script separate |

---

## Missing (product)

| Item | Priority |
|------|----------|
| Centralized cohort analytics backend | High for invitation study |
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
```

Founder UI: `?founder=1` or `?cohort=review` on rhizoh.com

---

## Related

- [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md)
- [`RHIZOH_INVITATION_STUDY_V0.md`](RHIZOH_INVITATION_STUDY_V0.md)
- [`RHIZOH_EPISTEMIC_DASHBOARD_V1.md`](RHIZOH_EPISTEMIC_DASHBOARD_V1.md)
