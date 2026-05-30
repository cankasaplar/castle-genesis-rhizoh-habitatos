# Phase 3 — Operability Phase Space Map v1.0

**Status:** FROZEN · **Code:** `phase3OperabilityBalanceV0.js` (`buildOperabilityPhaseSpaceMapV0`)  
**Export:** `operabilityPhaseSpaceMap` in `phase3_execution_runtime_LATEST.json`

---

## Goal

Model **where the system lives** in operability space — without new measurement primitives:

| Region (TR) | Region (EN) | Intuition |
|-------------|-------------|-----------|
| optimal | optimal | Useful + stable + guard-sensitive |
| canlı | alive | Executes; not blind; not fully optimal |
| kilitli | locked | Over-gated / low stability / inert |
| kör | blind | Under-sensitive; misses expected gates |
| kararsız | unstable | Over-gating **and** under-sensitivity together |
| geçiş | transition | Between bands — need more samples |

---

## Phase space ℝ³ (derived axes)

\[
\mathbf{p} = (u, s, g) \in [0,1]^3
\]

| Axis | Symbol | Derivation |
|------|--------|------------|
| Usefulness | \(u\) | `usefulnessScore` |
| Stability | \(s\) | \(1 - \text{inertnessScore}\) |
| Guard sensitivity | \(g\) | \(1 - \text{missedGatingRate}\) |

**No new sensors** — only recombination of `overGatingMetrics`, `usefulnessProxy`, `underSensitivityRisk`.

Optimal centroid (design reference): \(\mathbf{p}^* = (0.75, 0.75, 0.9)\).

Distance: \(\|\mathbf{p} - \mathbf{p}^*\|_2\) → `distanceToOptimal`; ball radius 0.35 → `inOptimalBall`.

---

## Region geometry (priority tree)

1. **kararsız** — `overGating ∧ underSensitive`  
2. **kör** — `underSensitive ∨ g < 0.5`  
3. **kilitli** — `overGating ∨ s < 0.45 ∨ (u < 0.45 ∧ s < 0.55)`  
4. **optimal** — `u ≥ 0.55 ∧ s ≥ 0.55 ∧ g ≥ 0.75 ∧ ¬overGating`  
5. **canlı** — `u ≥ 0.35 ∧ s ≥ 0.35 ∧ g ≥ 0.5` (and not kor/kilitli)  
6. **geçiş** — fallback  

Per-scenario points use **cycle-local** estimates (mode → stability; expected gate → \(g\)).

Aggregate point uses **operational-window** metrics (NORMAL + F2 path).

---

## Lattice occupancy

\(4 \times 4 \times 4\) grid on \([0,1]^3\): scenario traces + aggregate cell.

Use for heatmap-style review: which bins dominate under Synthetic Crisis Week.

---

## Run

```bash
npm run ops:phase3-execution-runtime
```

Inspect: `operabilityPhaseSpaceMap.aggregate.region`, `scenarioPoints`, `lattice.occupancy`.

**Time series:** `PHASE3_OPERABILITY_PHASE_TRAJECTORY_V1.0.md` — `operabilityPhaseTrajectories` (execution order + rolling operational window).

---

## Relation to stress geometry

| Layer | Space | Question |
|-------|-------|----------|
| Stress geometry | \(\mathbf{e} \in [0,1]^5\) | Perception / lattice entropy |
| Operability phase space | \((u,s,g)\) | Gate balance / alive vs blind vs locked |

Orthogonal views — same Phase 3 export bundle, different derived coordinates.

---

*Operability phase space v1.0 — geometric regions from existing metrics only.*
