# Rhizoh Cube Field — v0 (SPEC LOCK)

**SPECFLOW (primary):** `RESEARCH-ONLY` — meaning contract and projection rules; **does not** authorize frozen core (`apps/client/src/ghost/phase*.js`) changes or production execution paths by itself.

**Status:** **SPEC v0.1** — Phase 1 complete; Phase 2 math authorized (axis-specific motion rules + drift measurement invariant).

**SSOT sentence:**

> **Visual geometry is a projection of cognitive state, not a decoration of it.**

**Architecture sentence:**

> **SpiralMMO is not a runtime. It is a signal reservoir. Rhizoh Cube Field is the interpretation layer.**

| Related | |
|---------|--|
| Observation ≠ execution | [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) |
| UI reaction binding (2D channel) | [`apps/client/docs/OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md`](../apps/client/docs/OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md) |
| Existing meaning→visual pattern | `apps/client/src/scene/FieldVolumeMesh.js` |
| SpiralMMO boundary | [`RHIZOH_SPIRALMMO_DUAL_TRACK_OPERATING_PRINCIPLE_V0.md`](RHIZOH_SPIRALMMO_DUAL_TRACK_OPERATING_PRINCIPLE_V0.md) |
| Spiral expansion order | [`apps/client/docs/OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md`](../apps/client/docs/OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md) |
| Cognitive load / disclosure | [`COGNITIVE_LOAD_LAYER_V0.md`](COGNITIVE_LOAD_LAYER_V0.md) |
| Perceptual smoothing (downstream only) | [`PERCEPTUAL_STABILITY_LAYER_V0.md`](PERCEPTUAL_STABILITY_LAYER_V0.md) |
| Embodiment roadmap | [`RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md`](RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md) |
| **Signal contract (Phase 3)** | [`RHIZOH_CUBE_FIELD_SIGNAL_CONTRACT_ADDENDUM_V0.md`](RHIZOH_CUBE_FIELD_SIGNAL_CONTRACT_ADDENDUM_V0.md) |

---

## 0. Problem statement

External SpiralMMO prototypes (harici HTML archive — **not** in this monorepo) demonstrate compelling **procedural cognitive geometry**: multi-arm spirals, cube-bound motion, amplitude oscillation. They are **aesthetic-heavy** and **meaning-implicit**.

Castle / Rhizoh is **meaning-first**, **contract-first**, **drift-observable**, **execution-gated**. Importing SpiralMMO rendering before a locked meaning contract would produce:

> a beautiful but unreadable simulation layer — aesthetics dominant, semantics secondary noise.

**This spec exists to prevent that failure mode.**

---

## 1. What Cube Field is / is not

| Cube Field **is** | Cube Field **is not** |
|-------------------|------------------------|
| A **projection contract** from cognitive state → visible geometry | A game object, quest surface, or player avatar |
| A **measurement surface** (UI shows what was computed, not what was guessed) | Decorative shader art with post-hoc labels |
| **Read-only** relative to execution / WAL / sealer | An authority path or substrate write reason |
| **Deterministic given inputs** (regression-testable pure math in Phase 2) | Stochastic “oracle truth” or LLM-driven motion |
| An **interpretation layer** over bounded signals | SpiralMMO runtime imported wholesale |

**One-line product rule:**

> Every visible motion MUST bind to a named scalar or vector in `CubeState` (or its derived projection); unbound motion is forbidden in v0.

---

## 2. Layer placement

```text
┌─────────────────────────────────────────────────────────────┐
│  Execution core (frozen v562–v570) — NEVER fed by Cube Field │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ no write path
┌─────────────────────────────────────────────────────────────┐
│  Epistemic stack (v567–v570 rules) — observation only        │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ read-only projection inputs
┌─────────────────────────────────────────────────────────────┐
│  Rhizoh Cube Field v0 — interpretation + geometry contract   │
│  CubeState → spiral math → visual channels (scale, phase…)   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ optional, Phase 3+
┌─────────────────────────────────────────────────────────────┐
│  Signal reservoirs (SpiralMMO archive, CLAG, field samples)  │
│  SpiralMMO = reservoir · NOT runtime                         │
└─────────────────────────────────────────────────────────────┘
```

**Invariant (cross-boundary):** `sharedState: false` across SpiralMMO ↔ Rhizoh — same as [`spiralMMOAgreementLayerV0.js`](../apps/client/src/rhizoh/experience/spiralMMOAgreementLayerV0.js).

---

## 3. `CubeState` — canonical data model (v0)

`CubeState` is the **only** authoritative input to Cube Field geometry in v0. Renderers consume **projections** of `CubeState`, never raw aesthetic parameters.

### 3.1 Schema

```text
CubeState {
  schemaVersion: "rhizoh.cube_field.cube_state.v0"

  // Global scalars — all ∈ [0, 1] unless noted
  attention: number       // current focal weight on this node
  confidence: number      // epistemic certainty (high = resolved)
  uncertainty: number     // inverse pressure; MUST satisfy uncertainty ≈ 1 - confidence (tolerance §3.3)
  drift: number           // schema / interpretation drift risk (observable, not punitive)
  cognitiveLoad: number   // processing pressure (derived or supplied)

  // Four-axis intent vector — one scalar per cognition axis (§4)
  intentVector: {
    observation: number   // [0, 1]
    reasoning: number
    memory: number
    action: number
  }

  // Spiral kinematics (inputs to math layer — not free animation knobs)
  spiralPhaseRad: number           // master phase ∈ [0, 2π)
  armPhaseOffsetRad: [number × 4]  // per-axis phase offset ∈ [0, 2π)
  contradictionPressure: number    // [0, 1] — inter-arm phase tension

  // Provenance (required for drift audit)
  sourceKind: "clag_projection" | "field_sample" | "synthetic_fixture" | "spiral_reservoir_adapter"
  sourceRef: string                // opaque id — no PII
  correlationId: string            // ties to observation / tick bundle when present
  readOnly: true                   // always true in v0
}
```

### 3.2 Derived fields (math layer only — not stored as SSOT)

| Derived | Formula (v0 intent) |
|---------|---------------------|
| `expansion01` | `f(uncertainty, attention)` — monotonic in uncertainty (global) |
| `contraction01` | `f(confidence)` — monotonic in confidence (global) |
| `rotationRate` | `g(cognitiveLoad)` — monotonic in cognitiveLoad (global) |
| `colorShift01` | `h(drift)` — monotonic in drift (global schema-drift channel) |

Global derived fields are monotonic where noted. **Per-axis arm motion** follows §5.1 — axes are **not** uniformly monotonic.

Exact `f`, `g`, `h` are **Phase 2** (`cubeFieldSpiralMathV0.js`). This spec locks **meaning direction**, not numeric coefficients.

### 3.3 Consistency rules

| Rule | Enforcement |
|------|-------------|
| `uncertainty + confidence ≈ 1` | ±0.05 tolerance; violation → projection flagged `coherenceWarning` |
| All scalars clamped to `[0, 1]` | Math layer clamps; never silently wraps |
| `intentVector.*` independent | Axes MAY diverge; `contradictionPressure` rises when arm phases diverge |
| `readOnly: true` | Any adapter that sets `readOnly: false` is **invalid v0** |

---

## 4. Four spiral axes — semantic assignment (LOCKED v0)

Each spiral arm maps to **exactly one** cognition axis. Arm index is stable:

| Arm index | Axis | Rhizoh signal family (v0 anchor) | Semantics |
|-----------|------|----------------------------------|-----------|
| **0** | **Observation** | Passive perception field, external signal ingest | What is being sensed / noticed |
| **1** | **Reasoning** | CLAG / meaning frame / inference path | Active interpretation load |
| **2** | **Memory** | Continuity cache / cross-session echo | Retention vs fade |
| **3** | **Action** | Influence instrumentation (pre-LLM, observability) | Intent to act (never execution) |

**Directionality:** arms are placed at fixed world headings for v0 prototype — **+X, +Z, −X, −Z** (cardinal projection of the four axes). This is a **display convention**, not an geographic claim.

**Arm amplitude:** `intentVector[axis] × expansion01` — high intent + high uncertainty = visible reach; high confidence pulls arm inward (§5).

---

## 5. Motion → meaning mapping (LOCKED v0.1)

This table is **bidirectional contract**:

- **Forward (state → motion):** geometry MUST implement these bindings.
- **Reverse (motion → reading):** a human or observer inferring state from motion MUST be able to use this table without guessing.

**Design goal:** Cube Field is a **state-space visualizer**, not a generic animation system. Global channels may be monotonic; **per-axis arm motion follows axis-specific kinematic rules (§5.1)**.

### 5.0 Global visual channels

| Visual channel | Driven by | Meaning (reader interprets) | Kinematic rule |
|----------------|-----------|----------------------------|----------------|
| **Arm radial pull-in (global)** | `contraction01` ← confidence | Tighter = resolution / closure | Global: ↑ confidence → ↓ net reach |
| **Master rotation speed** | `cognitiveLoad` | Faster spin = heavier processing | Global monotonic: ↑ load → ↑ speed |
| **Per-arm phase spread** | `armPhaseOffsetRad[i]`, `contradictionPressure` | Spread = unresolved tension between axes | ↑ pressure → ↑ spread (no cross-axis intent bleed) |
| **Cube uniform scale (subtle)** | `attention` | Whole-node breathing = global focal intensity | Global monotonic: ↑ attention → ↑ scale (bounded) |
| **Color hue shift** | `drift` | Palette drift = schema / interpretation drift | Global monotonic: ↑ drift → ↑ shift magnitude |
| **Emissive intensity** | `confidence` | Brighter core = higher certainty | Global monotonic: ↑ confidence → ↑ emissive (cap in Phase 4) |
| **Opacity / mist** | `uncertainty` | More mist = less committed interpretation | Global monotonic: ↑ uncertainty → ↓ opacity |

### 5.1 Per-axis arm motion rules (LOCKED v0.1)

Each arm uses **only** its own `intentVector[axis]` plus **global** derived scalars (`expansion01`, `contraction01`). **Cross-axis coupling is forbidden** — no arm may read another axis's intent.

| Axis (arm index) | Kinematic class | Rule | Reader interprets |
|------------------|-----------------|------|-------------------|
| **Observation (0)** | **Monotonic + smoothing** | ↑ `intentVector.observation` → ↑ radial extent; attention may smooth (EMA-style blend) | More sensed signal = stronger reach |
| **Reasoning (1)** | **Oscillatory + phase shift** | Extent modulated by `sin(spiralPhaseRad + armPhaseOffset)` × reasoning intent | Active inference cycles; non-linear by design |
| **Memory (2)** | **Monotonic + decay floor** | ↑ memory intent → ↑ extent, but never below `memoryDecayFloor` (v0: 0.12) | Continuity persists; fade has a visible floor |
| **Action (3)** | **Threshold discrete jumps** | Intent quantized to discrete levels (v0: 4 steps); no continuous glide | Intent to act is staged, not analog execution |

**Global `expansion01`** still scales all arms uniformly from `uncertainty` + `attention` — but **shape** of each arm's response is axis-specific.

**Forbidden bindings (v0):**

- Motion driven only by `Date.now()` aesthetic curves with no `CubeState` input.
- Random phase without `sourceRef` / fixture id.
- Color or scale tied to **execution eligibility**, seal outcome, or auth state.
- **Cross-axis intent bleed** — e.g. reasoning intent changing observation arm extent without observation intent change.

---

## 6. Drift — definition and measurement (v0.1)

**Drift** here means **interpretation drift** — divergence between expected and observed cognitive projection over time. It is **observable**, not an automatic punishment.

### 6.0 Drift invariant (LOCKED v0.1)

> **Drift is never a cause. Drift is always a measurement.**

| Drift **does** | Drift **does not** |
|----------------|-------------------|
| Display on the cube (color shift channel) | Trigger execution, WAL writes, or sealer paths |
| Append to `CubeFieldDriftObservation` audit envelope | Drive UI product decisions autonomously |
| Flag coherence warnings (§6.3) | Act as punishment, throttle, or auth downgrade |

**Corollary:** no downstream module may treat `drift` or `drift.delta` as an **input** to authority, eligibility, or substrate mutation — only as **observed telemetry**.

### 6.1 Scalar `drift` ∈ [0, 1]

Supplied by upstream projection (CLAG, field sample, adapter). Cube Field **displays** drift; it does **not** compute authority.

### 6.2 `CubeFieldDriftObservation` (audit envelope — append-only intent)

```text
CubeFieldDriftObservation {
  schemaVersion: "rhizoh.cube_field.drift_observation.v0"
  correlationId: string
  ts: string                    // ISO-8601
  cubeId: string                // stable node id
  driftBefore: number
  driftAfter: number
  delta: number                 // driftAfter - driftBefore
  trigger: "tick" | "adapter_ingress" | "manual_fixture"
  sourceKind: CubeState.sourceKind
  sourceRef: string
  visualBindingHash: string     // hash of motion→meaning table version + coefficients
}
```

### 6.3 Drift coherence checks (non-authoritative)

| Check | Condition | Surface |
|-------|-----------|---------|
| **Visual–semantic coherence** | If `confidence` ↑ but arm extent ↑ over same tick window | flag `coherenceWarning: "extent_confidence_mismatch"` |
| **Axis contradiction** | `contradictionPressure` > 0.7 for N consecutive ticks | flag `coherenceWarning: "sustained_contradiction"` (N = 3 in v0) |
| **Unbound motion** | Any visual channel updated without `CubeState` delta | **hard fail in dev**; drop frame in prod projection |

These checks **log / flag only** — no WAL, no sealer, no gateway auth side effects.

---

## 7. Relationship to `FieldVolumeMesh` (existing pattern)

[`FieldVolumeMesh.js`](../apps/client/src/scene/FieldVolumeMesh.js) already implements **meaning-bound regional volumes**:

- Input: `bridgeFrame.regionalMap` samples → constitutional weather.
- Output: scale, color, emissive, rotation — **no free animation**.

**Cube Field v0 is the single-node, four-axis specialization of the same discipline:**

| FieldVolumeMesh (today) | Cube Field v0 |
|-------------------------|---------------|
| Many district spheres | **One** cognition node (cube) |
| Regional map sample | `CubeState` |
| Weather turbulence → rotation | `cognitiveLoad` → rotation |
| Crystal stability → color | `confidence` / `drift` → color |

Phase 3 MAY extend FieldVolumeMesh with optional cube-cell mode — **only after** Phase 2 math is frozen and tested. FieldVolumeMesh remains SSOT for multi-district; Cube Field SSOT for single-node cognitive prototype.

---

## 8. Phase gate — implementation order (MANDATORY)

| Phase | Deliverable | Gate to proceed |
|-------|-------------|-----------------|
| **1 — SPEC LOCK** | This document (`RHIZOH_CUBE_FIELD_V0.md`) | Review complete; §4–§5 unchanged without simulation gate (§9) |
| **2 — MATH** | `cubeFieldSpiralMathV0.js` — pure functions, no React, no Three.js | Unit tests for **meaning mapping stability** (axis rules §5.1, no cross-axis bleed, drift measurement-only); clamp rules; `npm run stabilization:validate-client-boundaries-quick` green |
| **3 — ADAPTER** | `spiralReservoirCubeStateAdapterV0.js` + signal addendum | `spiral:validate-rhizoh-boundary` green; adapter sets `sourceKind: "spiral_reservoir_adapter"`; **no** SpiralMMO HTML import into client bundle |
| **4 — PROTOTYPE** | `CubeFieldPrototype.jsx` — 1 cube, 4 arms, state binding only | No product logic, nav, gateway, WAL; behind debug / research flag |

**Explicit prohibition until Phase 3:**

- ❌ Import harici SpiralMMO HTML / assets into `apps/client` production paths.
- ❌ Wire Cube Field motion directly to LLM token stream or chat UI.
- ❌ Use Cube Field output as execution eligibility input.

---

## 9. Simulation gate — spec change policy

Changes to **§4 (axis assignment)** or **§5 (motion→meaning table)** require:

1. Written rationale in PR / session log ([`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) entry or ops note).
2. Bump `schemaVersion` suffix or document minor version (`v0.1`).
3. Re-hash `visualBindingHash` constant when math lands (Phase 2).
4. No silent "tweak because it looked better."

**Allowed without simulation gate:** typos, cross-links, Phase 2+ file path additions that do not alter semantics.

---

## 10. Anti-patterns

| Anti-pattern | Failure mode |
|--------------|--------------|
| Render first, label later | Aesthetic-dominant layer; meaning becomes post-hoc noise |
| SpiralMMO as runtime | Execution leakage; dual-track boundary break |
| Thousands of cubes before single-cube coherence | Scale masks semantic bugs |
| LLM chooses colors / motion live | Non-deterministic; untestable; observation→execution blur |
| Cube Field writes session or gateway state | Collapses projection into authority |
| Skipping `CubeFieldDriftObservation` in Phase 3+ | Drift visible in motion but not auditable |

---

## 11. v0 success criteria (definition of done for Phase 1)

- [x] This spec merged and tagged `RESEARCH-ONLY`.
- [x] §4 axis assignment and §5 mapping table reviewed — **locked** (v0.1 axis kinematic classes).
- [x] §6.0 drift measurement invariant — **locked**.
- [x] Team agrees: **no Phase 4 JSX** until Phase 2 math tests exist.
- [x] SpiralMMO harici archive referenced only as **signal reservoir** — not imported.

---

## 12. Planned code anchors (informative — NOT implemented by this spec)

| Phase | Path (planned) |
|-------|----------------|
| 2 | `apps/client/src/rhizoh/experience/cubeFieldSpiralMathV0.js` |
| 2 | `apps/client/src/rhizoh/experience/__tests__/cubeFieldSpiralMathV0.test.js` |
| 3 | `apps/client/src/rhizoh/experience/spiralReservoirCubeStateAdapterV0.js` |
| 3 | `apps/client/src/rhizoh/experience/__tests__/spiralReservoirCubeStateAdapterV0.test.js` |
| 3 | [`RHIZOH_CUBE_FIELD_SIGNAL_CONTRACT_ADDENDUM_V0.md`](RHIZOH_CUBE_FIELD_SIGNAL_CONTRACT_ADDENDUM_V0.md) |
| 4 | `apps/client/src/rhizoh/experience/CubeFieldPrototype.jsx` (research / debug mount only) |

---

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| **v0.1** | 2026-06-01 | §5.1 per-axis kinematic rules (non-uniform monotonicity); §6.0 drift measurement invariant; Phase 2 authorized |
| **v0.2** | 2026-06-01 | Phase 3 signal addendum linked; adapter path locked |
| **v0** | 2026-06-01 | SPEC FIRST LOCK — CubeState, four axes, motion→meaning table, drift observation, phase gates, SpiralMMO reservoir boundary |

---

*v0 — Rhizoh Cube Field meaning contract. Rendering is Phase 4; meaning is Phase 1.*
