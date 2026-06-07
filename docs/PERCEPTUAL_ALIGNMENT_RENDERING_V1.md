# Perceptual Alignment Rendering V1

**Tag:** `RESEARCH-ONLY`  
**Status:** Charter locked — perceptual architecture gate before visual evolution code  
**Depends on:** [`CAMERA_UNIFICATION_SPEC_V1.md`](CAMERA_UNIFICATION_SPEC_V1.md) (Steps 2.1–2.3 complete)  
**Execution:** Observation only — never routes spatial commands, never interprets drift into authority

---

## 0. One law (spine)

> **UI never connects two lenses. It only renders the breakdown of synchrony.**

| Forbidden framing | Allowed framing |
|-------------------|-----------------|
| "Octo spoke → map moved" | Same moment, decoupled rhythm |
| "This event triggered that" | Phase lag, no relational line |
| "Alignment 87%" | Texture of separation, not score |

Alignment UI is **not a UI**. It is a **fracture surface** — perception fracture renderer.

---

## 1. Three locks

### 1.1 UI ≠ explanation

No surface may:

- show cause ("because X, Y")
- suggest fix ("sync", "re-align", "acknowledge drift")
- decide ("primary mount", "correct lens")

Contract already sets `causalClaim: false` on all drift explanations. Visual layer must not contradict this.

### 1.2 UI ≠ measurement

No surface may:

- expose `semanticDriftRisk` as user-facing label or badge in production
- show gauges, percentages, healthy/unhealthy states
- promote dev strip (`PerceptionAlignmentObservationStripV0`) to prod HUD

Developer mirror (dev flag / `VITE_RHIZOH_PERCEPTION_ALIGNMENT_DEBUG`) remains text — ceiling, not target aesthetic.

### 1.3 UI ≠ merger

No surface may:

- bind cube position to globe geo as unified truth
- composite Octo + Cesium + Habitat into one "world" viewport
- draw arrows, flows, or narrative links between lenses

Spec: **align, do not merge** ([`CAMERA_UNIFICATION_SPEC_V1.md`](CAMERA_UNIFICATION_SPEC_V1.md) §1).

---

## 2. What remains: temporal texture of separation

Only **non-connecting co-presence** — systems that are:

- not in the same scene
- not in the same story
- present at the same time with **mismatched choreography**

```
same time  ≠  same scene
same time  ≠  same story
same time  =  incompatible rhythm (visible as texture)
```

---

## 3. Permitted visual behaviors (safe list)

These read alignment snapshot **read-only** and output **atmosphere only** (CSS / WebGL uniforms / opacity — no copy, no CTA):

| Signal (from contract) | Visual behavior | Lens |
|------------------------|-----------------|------|
| `blockFalseCorrelation` | Map motion visually non-contiguous under conversation hero | Cesium vs Habitat |
| `P2_PRESENTATION_AHEAD_OF_SPATIAL` | Map strip slight float — weak terrain gravity | Habitat |
| `P2_TIME_SKEW_*` | Phase lag between chrome layers | Habitat |
| `P2_OCTO_MOUNT_FRAGMENTATION` | Depth separation — two presences, no relational line | Octo |
| spatial stale / zoom unchanged | Subtle spatial drift shimmer | Cesium |
| perception internal inconsistency | Cube rhythm desync (phase, not emotion label) | Octo |

**Uniform rules for all behaviors:**

- `pointer-events: none` on fracture layer
- no text derived from `explanations[].code` in production
- no listener that calls `routeCesiumCommandV0` or mutates `fieldState`
- CI: [`perception-alignment-forbidden-grep.mjs`](../scripts/perception-alignment-forbidden-grep.mjs) (P2-F05 mirror influence)

---

## 3.5 Fracture influence model — **locked (Step 3.2 gate)**

Fracture may deform **how things look**. It may never deform **what the system does** or **what the user is steered toward**.

### A / B / C (system position)

| Mode | Fracture effect | Status |
|------|-----------------|--------|
| **A — Passive fracture** | Perception only; no input or execution influence | **✔ Current — intentional** |
| **B — Emotional fracture** | Attention steering; user decision bias | **✗ Forbidden** |
| **C — Behavioral fracture** | Command routing; execution graph leakage | **✗ Forbidden** (P2-F05 CI) |

> **Locked decision:** Castle stays at **A**. Fracture = passive perception fracture renderer.

### One-way influence (post-render only)

Fracture is **strictly downstream** of execution. It may distort **after** state is committed to the view; it never participates in **before** or **during** routing.

| Phase | Fracture may touch? |
|-------|---------------------|
| Pre-routing (intent, grammar, registry) | **Never** |
| Mid-routing (router, executor dispatch) | **Never** |
| Post-render (pixels, uniforms, CSS after commit) | **Only here** |

```
execution graph → committed UI state → fracture distortion (view-layer)
                      ↑                      ↓
                      └── no feedback loop ──┘
```

**Temporal + spatial desync:** fracture simultaneously applies **time distortion** (`phaseMs`, rhythm lag) and **space distortion** (opacity, parallax freeze, float, depth) — both are post-render only.

### View-layer vs interaction-layer (hard boundary)

| Layer | Fracture may touch? | Examples |
|-------|---------------------|----------|
| **View-layer physics** | **Yes** | habitat opacity, cube phase shift, map parallax freeze, shimmer, float, depth separation |
| **Interaction-layer physics** | **No** | chat attention bias, input latency feel, focus drift, disabled controls, delayed send, mic/camera gating |

Fracture is **not** a UX nudge engine. If drift is visible, the user may *feel* discontinuity — the system must not *act* on that feeling.

### 3.2 scope (when implemented)

**In scope — still view-layer, still passive:**

- Chat dock habitat opacity / phase coupling (CSS on dock chrome only)
- Capability wheel phase lag modulation (opacity / scale rhythm — not hit targets)
- Octo motion tick ← fracture `phaseMs` sync (read-only uniform into studio tick — not new camera authority)

**Explicitly out of scope for 3.2+ unless charter revision:**

- `fieldState` / `habitatFocusMode` derivation from fracture tokens
- Input debounce, placeholder copy, or CTA prominence from `semanticDriftRisk`
- Wheel node emphasis, seed ordering, or onboarding steering from alignment
- Any fracture listener on `pointer-events: auto` surfaces that changes routing

### Influence test (PR gate)

A 3.2 change passes only if:

1. Removing fracture tokens leaves **identical** command routing, field state machine, and input timing
2. Fracture diff touches only `opacity` / `transform` / `filter` / WebGL uniforms — not event handlers or store dispatches
3. `npm run stabilization:validate-perception-alignment-v0` stays green

---

## 4. Forbidden visual behaviors (explicit)

| Pattern | Why |
|---------|-----|
| Causality arrows (Octo → Cesium) | Oracle narrative |
| Risk badge / color alarm | Measurement + corrective bias |
| Geo overlay cube ↔ WGS84 | Merge illusion |
| Split-screen lens diff for users | Encourages unification |
| Companion voice explaining drift | Explanation engine |
| Click-to-fix on drift texture | Control from observation |
| Prod expansion of mono dev strip | Dashboard regression |

---

## 5. Architecture placement

```
alignment snapshot (read-only)
        ↓
perception fracture renderer   ← Phase 3 (this doc)
        ↓
texture on existing lenses (Octo / Cesium chrome / Habitat)
        ↓
never back to router / executor / fieldState
```

| Layer | Role after Phase 3 |
|-------|-------------------|
| **Octo** | Perception truth; fracture = rhythm desync |
| **Cesium** | World truth; fracture = non-contiguous motion under conversation |
| **Habitat** | Presentation; fracture = float / opacity mismatch |
| **T0 dev strip** | Developer mirror only — not fracture renderer target |

Rhizoh / inbox: memory only ([`CAMERA_UNIFICATION_SPEC_V1.md`](CAMERA_UNIFICATION_SPEC_V1.md) §4.3) — no fracture narration.

---

## 6. Phase 3 implementation sketch (minimal)

**Step 3.1 — Fracture composer (read-only)** ✔

| File | Role |
|------|------|
| `castleFlight/perceptionFractureAtmosphereV0.js` | Map `contract.alignment` → frozen atmosphere tokens (opacity, phaseMs, shimmer, floatPx) — no strings for prod |
| `castleFlight/usePerceptionFractureAtmosphereV0.js` | Subscribe to alignment snapshot; no publish side effects |
| `components/PerceptionFractureLayerV0.jsx` | Lens hosts; `aria-hidden`; CSS vars + texture only |
| `castleFlight/__tests__/perceptionFractureAtmosphereV0.test.js` | Determinism + no explanatory string leak |

Wired: `AppRhizoh528T0` (spatial · map strip) + `RhizohT0ShellChromeV1` (Octo co-presence).

**Step 3.2 — Temporal desync rendering (passive, post-render)** ✔

| Hook | Post-render only |
|------|------------------|
| Chat dock wrapper | habitat opacity + `phaseMs` coupling |
| Capability wheel host | wheel phase lag (opacity/scale rhythm) |
| Octo motion tick | read-only `fracturePhaseMs` → `clock.elapsedTime` offset |

No pre/mid-routing influence. No interaction-layer physics.

**Step 3.3 — Defer**

- Geodetic binding
- Single merged viewport
- Prod risk labels
- Companion drift dialogue

---

## 7. Acceptance criteria (charter compliance)

Before any Phase 3 PR merges:

1. No production UI renders `semanticDriftRisk`, `explanations[].code`, or executor forensics as user-visible text
2. No fracture layer registers click handlers or dispatches spatial commands
3. No visual merges three lenses into one coordinate frame
4. Fracture inputs sourced only from `readPerceptionAlignmentFromRuntimeV0` / hook — not direct `window.__CASTLE_CESIUM__` writes from Octo
5. Existing P2-F01…F05 CI remains green; no new alignment → execution edges
6. **Passive fracture (A):** removing all fracture styling does not change routing, `fieldState`, or input latency

---

## 8. Mental model (founder lock)

| Was | Now |
|-----|-----|
| Produce reality (executor spine) | **Prevent reality from merging** (fracture renderer) |
| Alignment invisible | Alignment **felt**, not read |
| Self-observing + self-protecting system | + **self-fracturing perception** (intentional discontinuity) |

**Alignment ≠ control panel · explanation engine · chart**

**Alignment = perception fracture renderer**

---

## 9. Post–3.2 state · V2 pointer

Four-layer reality model, emergent law, and Rhizoh surface framing: [`PERCEPTUAL_PHYSICS_KERNEL_V2.md`](PERCEPTUAL_PHYSICS_KERNEL_V2.md)

> Perception is not a reflection of execution. Perception is a distortion of synchronization.

Next phase (spec only until approved): **Perceptual Physics Kernel V2** — fracture primitive registry, distortion field schema, cross-layer invariants, illegal perceptual couplings CI.
