# Phase 3 ↔ Phase 3D Control–Observation Firewall v1.0

**Status:** FROZEN · **Enforced in code + CI script**

---

## Principle

| Layer | Role | Must NOT |
|-------|------|----------|
| **Phase 3** | Control — gates G1–G5, `executeOrContain`, WAL | Read attractor / phase map / perturbation for decisions |
| **Phase 3D** | Observation — attractors, trajectory, sensitivity | Influence `phase3ExecutionGate` or live reflex |

**Anti-pattern blocked:** measure → interpret → govern

---

## Architecture

```
phase3ControlledDivergenceRuntimeV0.js   ← CONTROL ONLY
phase3ObservationExportV0.js             ← OBSERVATION ONLY
phase3HarnessExportV0.js                   ← compose at export boundary
phase3ControlObservationFirewallV0.js    ← manifest + verify
```

Composition happens **once** in `runPhase3ExecutionSpecHarnessV0()` (harness export).  
Live gateway turn uses **control runtime only** — no Phase 3D import.

---

## Gates (independent)

| Gate | Source | Drives deploy? |
|------|--------|----------------|
| `phase3ExecutionGate` | `phase3Control` only | **Yes** (harness script exit code) |
| `phase3dObservationGate` | `phase3Observation` only | **No** — audit / ops review |

`phase3ExecutionGate` inputs:

- All scenarios pass (G1–G5 path)
- Operational over-gating false
- Drill under-sensitivity false  

**Excluded:** `operabilityBalance`, `phase3DAttractorIntelligence`, `perturbationSensitivityMap`, trajectory class.

---

## Export shape

```json
{
  "firewall": { "rule": "observation_never_feeds_execution_gate" },
  "phase3Control": { "phase3ExecutionGate": "..." },
  "phase3Observation": { "phase3dObservationGate": "..." }
}
```

Top-level `phase3ExecutionGate` / `phase3dObservationGate` are mirrors for scripts — control gate is authoritative for exit code.

---

## Verify

```bash
node scripts/verify-phase3-control-observation-firewall.mjs
npm run ops:phase3-execution-runtime
```

---

## Shadow learning (observation may learn, control may not)

Observation can build **internal representation** (histograms, basin drift, proposals) if it never backflows to live gates.  
See [`PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md`](PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md).

---

*Firewall v1.0 — observation isolated from execution decisions.*
