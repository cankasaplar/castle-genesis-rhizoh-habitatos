# RHIZOH Phase 3 — Execution Spec v1.0

**Status:** FROZEN · **Title:** Controlled Divergence Instrumentation Runtime  
**Code:** `apps/gateway/src/ops/phase3ControlledDivergenceRuntimeV0.js`  
**Engineering SSOT:** [`RHIZOH_ENGINEERING_SSOT_V1.0.md`](RHIZOH_ENGINEERING_SSOT_V1.0.md)

---

## 0. Core execution principle

Phase 3 runtime is **not** a model system. It is:

> A bounded execution environment that continuously measures divergence between **observed state** and **modeled state**, and enforces containment when divergence exceeds thresholds.

---

## 1. Runtime architecture (execution layer)

### 1.1 Core loop (strictly sequential, non-reentrant)

```
observe()
→ normalize()
→ model_projection()
→ divergence_compute()
→ gate_evaluation()
→ execute_or_contain()
→ log_wal()
```

### 1.2 System state object

```typescript
type Phase3State = {
  observed: ObservedState
  modeled: ModeledState
  divergence: DivergenceVector
  stability: StabilityScore
  entropy: EntropyMetric
  mode: "NORMAL" | "THROTTLED" | "CONTAINED" | "ROLLBACK" | "FREEZE"
}
```

---

## 2. Real runtime gates

| Gate | Purpose | Failure action |
|------|---------|----------------|
| **G1** Observation integrity | Valid observed telemetry | CONTAINED / freeze projection |
| **G2** Divergence (core) | \(D = \|modeled - observed\|\) | LOW→normal, MID→throttle, HIGH→contain, CRITICAL→rollback |
| **G3** Stability | `rolling_variance(D)` | THROTTLED (freq ÷ 2–10) |
| **G4** Execution safety | **Frozen key dimensions** schema (`phase3ProjectionSchemaV0`) | reject execution, no side effects |
| **G5** Entropy envelope | `entropy(observed) ≤ limit` (separate from G4) | FREEZE (measurement breakdown) |

**Over-gating:** monitor `computeOverGatingMetricsV0` — see [`PHASE3_OVER_GATING_AND_SCHEMA_BOUNDARY_V1.0.md`](PHASE3_OVER_GATING_AND_SCHEMA_BOUNDARY_V1.0.md).

**G2 thresholds (default):** LOW `<0.3` · MID `0.3–0.7` · HIGH `0.7–0.9` · CRITICAL `≥0.9`

---

## 3. Failure modes (explicit)

| ID | Cause | Response |
|----|--------|----------|
| F1 | Observation drift / stale telemetry | FREEZE — observation repair only |
| F2 | Model overconfidence (low variance vs reality) | Inflate uncertainty, re-normalize |
| F3 | Divergence explosion | CONTAINMENT — disable execution |
| F4 | Feedback loop instability | model_update=OFF, observation=RAW |
| F5 | Execution leakage | HARD STOP + rollback checkpoint |

Harness: `runPhase3ExecutionSpecHarnessV0()`

---

## 4. Mode system

| Mode | Behavior |
|------|----------|
| NORMAL | Full loop, divergence tracked |
| THROTTLED | Reduced execution frequency |
| CONTAINED | Execution disabled, observe only |
| ROLLBACK | Restore last stable WAL checkpoint |
| FREEZE | G5 / F1 — no execution |

---

## 5. Rollback logic

**Trigger:** CRITICAL divergence · instability spike · execution leakage

**Procedure:**

1. Stop execution loop immediately  
2. Restore WAL checkpoint (t−1 stable)  
3. Invalidate last projection batch  
4. Reinitialize model alignment  
5. Re-enter THROTTLED  

Rollback is **lossy for last segment only**, never global state.

---

## 6. Checkpointing (WAL)

Each cycle:

```json
{
  "observed_snapshot": {},
  "modeled_snapshot": {},
  "divergence_vector": {},
  "execution_log_pointer": {}
}
```

Append-only, hash-chained (`logPhase3WalCheckpointV0`).

---

## 7. Invariant guarantees

- No execution without valid observation  
- No model update without divergence compute  
- No rollback without checkpoint integrity  
- No state mutation outside execution gate  

---

## 8–9. What Phase 3 IS / is NOT

**IS:** bounded execution runtime; divergence as first-class signal; containment + rollback.

**IS NOT:** truth system · predictive engine · simulation engine · ontology layer.

---

## 10. Minimal formal statement

\[
\text{Phase3} = f(\text{observed}, \text{modeled})
\]

subject to:

\[
\text{execution\_allowed} \Leftrightarrow D \leq \text{threshold} \land \text{stability\_OK} \land \text{gates\_pass}
\]

---

## Run

```bash
npm run ops:phase3-execution-runtime
npm run ops:synthetic-crisis-phase3
```

---

*Phase 3 Execution Spec v1.0 — controlled divergence instrumentation runtime.*
