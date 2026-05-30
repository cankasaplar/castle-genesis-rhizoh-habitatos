# Phase 3D — Dynamical Attractor Intelligence v1.0

**Status:** FROZEN · **Code:** `phase3DAttractorIntelligenceV0.js`  
**Kind:** `dynamical_attractor_intelligence`  
**Builds on:** Phase 3 trajectory + operability phase space (no new measurement primitives)

---

## Frontier

Phase 3 answered **where** and **how the path moves**.  
Phase 3D answers:

| Question | Object |
|----------|--------|
| Which stable attractors? | `attractors[]`, `primaryAttractor` |
| Why does the system stay there? | `stabilityAnalysis.whySystemStays` |
| Which stressor ejects it? | `stressorExitAnalysis.exits`, `primaryEjector` |

This is **not** a new runtime gate stack — it is an **analysis layer** on top of Phase 3 exports.

---

## Attractor catalog (design basins in \((u,s,g)\))

| Attractor | Region | Stability mechanism (engineering) |
|-----------|--------|-----------------------------------|
| `attractor_optimal` | optimal | High u, s, g balance |
| `attractor_alive` | canlı | Execution with moderate lock |
| `attractor_locked` | kilitli | Containment-dominant, low s |
| `attractor_blind` | kör | Under-sensitive guard failure |

Empirical basins: mean coords + dwell from trajectory samples, mapped to catalog via distance.

---

## Stability analysis

Per basin:

- `isStableBasin` — low spread + low intra-basin velocity  
- `holdsBecause` — non-semantic mechanism string  
- `whySystemStays` — aggregate of stable basins  

---

## Stressor exit analysis

Each region transition → exit record:

- `stressorId` (e.g. `F3_divergence_explosion`)  
- `ejectedFrom` → `deflectedTo`  
- `exitVector` in \((u,s,g)\)  
- `stressorClass`: `synthetic_failure_drill` | `operational_cycle` | …  

`primaryEjector` — ranked by total exit magnitude.

---

## Perturbation sensitivity map

[`PHASE3D_PERTURBATION_SENSITIVITY_V1.0.md`](PHASE3D_PERTURBATION_SENSITIVITY_V1.0.md) — `perturbationSensitivityMap`:

- input → attractor influence matrix  
- basin boundary fragility  
- transition probability field \(P(\text{to}\mid\text{from})\), \(P(\text{to}\mid\text{from},\text{input})\)

---

## Gates (observation only — firewall)

| Gate | Role |
|------|------|
| `phase3ExecutionGate` | **Control** (`phase3Control`) — deploy / harness exit code |
| `phase3dObservationGate` | **Observation** (`phase3Observation`) — audit readiness only |

Phase 3D **never** feeds `phase3ExecutionGate`. See [`PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md`](PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md).  
Shadow learning (representation without backflow): [`PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md`](PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md).

---

## Run

```bash
npm run ops:phase3-execution-runtime
```

Export: `phase3Observation.phase3DAttractorIntelligence`, `phase3dObservationGate` (not execution gate)

---

## Layer stack

```
Phase 3   → divergence instrumentation + gates
Phase 3   → operability phase map (static)
Phase 3   → trajectory (dynamics)
Phase 3D  → attractor intelligence (stable points + ejectors)
Phase 3.1 → adaptive feedback (design roadmap)
```

---

*Phase 3D v1.0 — dynamical attractor intelligence, engineering SSOT only.*
