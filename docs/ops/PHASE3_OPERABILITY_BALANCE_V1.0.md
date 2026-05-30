# Phase 3 Operability Balance v1.0

**Status:** FROZEN · **Code:** `phase3OperabilityBalanceV0.js`

---

## Problem

| Metric set | Measures | Does NOT measure |
|------------|----------|------------------|
| containment / rollback / executionAllowed | **Operational health** (how locked) | **System usefulness** (locked but working) |

**Twin risk:**

| Risk | Symptom |
|------|---------|
| Over-gating | Safe but inert |
| Under-sensitivity | Looks active; misses drills that should gate |

---

## Dual lens (v1)

### A) Gating health (`computeOverGatingMetricsV0`)

- containment rate, rollback rate, executionAllowed (operational path)

### B) Usefulness proxy — **non-semantic** (`computeUsefulnessProxyV0`)

| Proxy | Meaning |
|-------|---------|
| `successfulCycleCompletionRate` | Loop completed with side-effects or allowed execution |
| `stableProjectionContinuityWindow` | Consecutive cycles with schema-valid projection |
| `usefulnessScore` | Weighted blend (0.55 / 0.45) |

Not user value or product KPI — **runtime operability only**.

### C) Containment / execution ratio

\[
\text{CER} = \frac{\text{containment rate}}{\max(\text{executionAllowed}, 0.05)}
\]

- \> 1.2 → lock heavier than execution  
- < 0.25 → execution-heavy, low lock  

### D) Under-sensitivity (`computeUnderSensitivityRiskV0`)

Failure drills (F1, F3, F4, F5) **expected to gate**. If `executionAllowed` anyway → missed gating.

---

## Operability balance score

\[
\text{operability} \approx \text{usefulness} \times (1 - \text{inertness}) \times \text{underSensPenalty}
\]

`balance` enum:

- `balanced`
- `over_gating_dominant`
- `under_sensitive_dominant`
- `unstable_gate_calibration`

Export: `operabilityBalance` in `phase3_execution_runtime_LATEST.json`

**Phase space map:** `PHASE3_OPERABILITY_PHASE_SPACE_V1.0.md` — `operabilityPhaseSpaceMap` (optimal / canlı / kilitli / kör regions in \((u,s,g)\))

---

## Harness gate (updated)

Pass requires:

- all scenarios ok  
- operational over-gating false  
- under-sensitivity false  
- `operabilityBalance.balance === "balanced"`

---

## Run

```bash
npm run ops:phase3-execution-runtime
```

---

*Operability Balance v1.0 — how locked AND whether it still runs.*
