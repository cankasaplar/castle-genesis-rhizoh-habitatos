# Phase 3 — Over-Gating Risk & Key-Dimension Schema Boundary v1.0

**Status:** FROZEN · **Code:** `phase3ProjectionSchemaV0.js`, `phase3ControlledDivergenceRuntimeV0.js`

---

## Over-gating risk (safe but inert)

| Symptom | Cause |
|---------|--------|
| Çok sık CONTAINED / ROLLBACK / FREEZE | Thresholds too conservative |
| Execution nadir | G2 + G5 + G4 stacked |
| Sistem “güvenli ama hareketsiz” | **over-gating** |

**Metrics (export):** `overGatingMetrics.operational` — see also **`PHASE3_OPERABILITY_BALANCE_V1.0.md`** (usefulness proxy, CER, under-sensitivity)

| Rate | Default alarm |
|------|----------------|
| containment | > 0.45 |
| rollback | > 0.15 |
| executionAllowed | < 0.35 |

`inertnessScore = containment + rollback + 0.5×freeze`

Failure-drill scenarios (F1–F5) **intentionally** gate hard — inertness scored on **NORMAL + F2** only.

**Mitigation knobs (config, schema-bumped only):**

- `entropyLimit` (default 1.5, lattice-calibrated)
- `divergenceLow/Mid/High` — do not tighten without ops review
- Split G4 vs G5 (no double entropy penalty in G4)

---

## G4 “key dimensions” — strict schema boundary

**Risk:** “key dimensions” drifts semantically over time.

| Drift direction | Effect |
|-----------------|--------|
| Dimensions **expand** without schema bump | Gate **loosens** (unknown keys ignored or admitted) |
| Dimensions **narrow** | False containment **increases** |

**Fix:** frozen schema `rhizoh.phase3.modeled_projection.v0.1`

| Required | Optional |
|----------|----------|
| stressClass | modelVariance |
| responseAction | |
| stressConfidence | |
| actionConfidence | |

- Unknown key → `unknown_dimension_not_in_schema` → G4 fail  
- Missing required → `required_dimension_missing` → G4 fail  
- Adding a dimension requires **schema version bump** (v0.1 → v0.2), not silent code change

**G4 does NOT** check entropy (G5 only) — avoids stacked conservative blocks.

---

## Code

```javascript
import { validateModeledProjectionDimensionsV0, REQUIRED_MODELED_DIMENSIONS_V0 } from "./phase3ProjectionSchemaV0.js";
import { computeOverGatingMetricsV0 } from "./phase3ControlledDivergenceRuntimeV0.js";
```

---

## Harness

```bash
npm run ops:phase3-execution-runtime
```

Check `overGatingMetrics.operational.overGating === false` on green path.

---

*Over-gating & schema boundary v1.0 — safe execution must remain operable.*
