# Phase 3 — Operability Phase Trajectory (Time Series) v1.0

**Status:** FROZEN · **Code:** `buildOperabilityPhaseTrajectoryV0`, harness `operabilityPhaseTrajectories`  
**Kind:** `system_behavior_dynamics` — not a debug snapshot

---

## Purpose

Static phase map answers: **where** is the system?  
Trajectory answers: **how does it move** through \((u,s,g)\) over time?

| Lens | Question |
|------|----------|
| Phase space map | Region at a point |
| **Trajectory** | Path, velocity, transitions, attractors |

---

## Two time series (export)

### 1) `executionOrder`

- Clock: harness / WAL execution order  
- Each step: **cycle-local** \((u,s,g)\) from mode + gate outcome  
- Dynamics: `pathLength`, `meanStepVelocity`, `regionTransitionCount`, `optimalDrift`, `oscillationIndex`, `classification`

### 2) `rollingOperational`

- Clock: prefix window grows (`rolling_prefix`)  
- Each step: **operational metrics** recomputed on records \([0..i]\) (NORMAL + F2 path for inertness)  
- Answers: does the **operational window** converge to optimal as live traffic accumulates?

---

## Dynamics classifications

| Class | Meaning |
|-------|---------|
| `stable_attractor` | Ends optimal; `optimalDrift` negative |
| `lock_recovery` | Visited kilitli → returns optimal |
| `stress_induced_deflection` | Containment deflection, no kör |
| `blind_exposure` | Trajectory entered kör |
| `oscillatory` | High region churn |
| `drift_away_from_optimal` | Moving away from \(\mathbf{p}^*\) |

Harness aggregate: `behaviorDynamics.primary` + `behaviorDynamics.rollingOperational`

---

## Metrics (geometry only)

\[
L = \sum_i \|\mathbf{p}_{i+1} - \mathbf{p}_i\|_2 \quad\text{(path length)}
\]

\[
\bar{v} = L / (n-1) \quad\text{(mean step velocity)}
\]

\[
\Delta d^* = d^*_n - d^*_0 \quad\text{(optimal drift)}
\]

---

## Run

```bash
npm run ops:phase3-execution-runtime
```

Inspect: `operabilityPhaseTrajectories.executionOrder.samples`, `.dynamics`

---

## Phase 3D (downstream)

Trajectory feeds **attractor intelligence**: [`PHASE3D_ATTRACTOR_INTELLIGENCE_V1.0.md`](PHASE3D_ATTRACTOR_INTELLIGENCE_V1.0.md)

---

## Live traffic (Phase 3.1+)

Append one sample per control-loop cycle to a ring buffer; export weekly trajectory JSON. Same primitives — no new sensors.

---

*Trajectory v1.0 — system behavior dynamics in operability phase space.*
