# Rhizoh Organism Stabilization v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modüller:** `rhizohOrganismStabilizationV0.js` · `rhizohOrganismHeartbeatV0.js` · `rhizohPerceptualContinuitySmoothingV0.js`

---

## Rol

Single **organism heartbeat** — Studio loop, WAL, Castle, ICL, Pet motion, Agent perception aynı ritimde.

```text
Ontology ✔ · Inhabitation ✔ · Projection ✔ · Coherence ✔ · Boundary ✔
→ ORGANISM STABILIZATION (timing / rhythm)
```

---

## Heartbeat

- Grid: `1000ms` from T0 `presenceClockOriginMs`
- `deriveOrganismHeartbeatV0(frame)` → `aligned_at_ms`, `heartbeat_index`, `phase01`

---

## Stabilization

| Layer | Mechanism |
|--------|-----------|
| SCR tick | `markOrganismLayerPhaseV0` + jitter ≤ 64ms |
| Pet motion | `motion_frame_lock` on `petCitizen` + spatial binding |
| Agent perception | `perception_latency_ms` normalized (cap grid/4) |
| Cross-layer | `computeRhythmCoherenceV0` |

Studio loop stage: `organism_stabilization`

---

## Perceptual smoothing (v0 overlay)

`tickPerceptualContinuitySmoothingV0` — EMA on breathe/intensity (**non-authoritative**).  
"Always was there" hint for render; does not write T0.

---

## SSOT

```javascript
window.__rhizoh.organismHeartbeat
window.__rhizoh.organismStabilization
window.__rhizoh.organismRhythm
window.__rhizoh.perceptualContinuitySmooth
window.__rhizoh.petCitizen.motion_frame_lock
```

CI: `npm run ops:organism-stabilization-v0`

---

## Sıra (final)

1. ~~Organism stabilization~~ ✔ (this doc)  
2. Perceptual continuity polish (render consumers adopt smooth overlay)  
3. Externalization / Castle network — **only after rhythm stable**

Castle network = **still early** until `organismRhythm.ok` holds under load.

**Pre-deploy gate:** [`RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md`](RHIZOH_PRODUCTION_RHYTHM_STRESS_V0.md) · `npm run ops:production-rhythm-stress-v0`

**Deploy runbook:** [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md) · `npm run ops:production-deploy-gates-v0`

Bkz. [`RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md`](RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md)
