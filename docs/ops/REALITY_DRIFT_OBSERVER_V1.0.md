# Reality Drift Observer Layer (RDOL) v1.0

**Position:** Above **ETCL** — first layer that models **modes of operational misapprehension** (yanılma şekilleri), not only errors.

---

## Three observers

| Observer | Detects |
|----------|---------|
| **realityModelDrift** | Live physics vs model / `coordination_sim`; GCL–rollout drift; narrative–RAW divergence |
| **propagationLiveDivergence** | Social propagation high-residual vs live health; mythology fork gap |
| **roboticsFeedbackMismatch** | Sensor-verified path vs blockActuation; matrix vs feedback conflict |

---

## Misapprehension shape taxonomy

| shapeId | Meaning |
|---------|---------|
| `reality_model_drift` | Model/sim assumptions diverge from live |
| `propagation_live_system_divergence` | Compressed external narrative ≠ live ops |
| `robotics_feedback_mismatch` | Actuation path ≠ sensor feedback |
| `simulation_read_as_live_signal` | Sim output treated as production truth |
| `narrative_raw_measurement_divergence` | DERIVED story diverges from RAW |

Catalog: `misapprehensionShapeCatalog` on export.

---

## Stack

```
… → ETCL → RDOL → human
```

RDOL **observes** only — no auto-remediation (`nonExecutable`).

---

## Export

`buildUnifiedStateNarrativeV0()` → `realityDriftObserver`

```bash
npm run ci:reality-drift-observer-gate
```

Module: `realityDriftObserverLayerV0.js`

---

**DCL** (`DRIFT_CAUSALITY_V1.0.md`) — above RDOL; explains *why* each drift shape occurs.

---

*RDOL v1.0 — misapprehension shapes as first-class operational objects.*
