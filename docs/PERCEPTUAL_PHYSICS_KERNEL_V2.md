# Perceptual Physics Kernel V2 — charter sketch

**Tag:** `RESEARCH-ONLY`  
**Status:** Post–Step 3.2 architectural lock · V2 not implemented  
**Predecessor:** [`PERCEPTUAL_ALIGNMENT_RENDERING_V1.md`](PERCEPTUAL_ALIGNMENT_RENDERING_V1.md) (Steps 3.1–3.2 complete)  
**Execution spine:** [`CAMERA_UNIFICATION_SPEC_V1.md`](CAMERA_UNIFICATION_SPEC_V1.md) · [`CESIUM_EXECUTOR_SPEC_V1.md`](CESIUM_EXECUTOR_SPEC_V1.md)

---

## 0. Emergent law (system now enforces this)

> **Perception is not a reflection of execution.**  
> **Perception is a distortion of synchronization.**

| Old model | Current model |
|-----------|---------------|
| UI = state projection | UI = post-render deformation |
| UI = execution outcome | Execution fixed; perception has independent physics |
| Debugging = read UI | Debugging ≠ read UI · UI ≠ truth · UI ≠ state |

---

## 1. Four independent reality layers (post–3.2)

```
┌─────────────────────────────────────────────────────────┐
│ 4. FRACTURE — synchronization distortion (post-render) │
│    phaseMs · parallax freeze · depth · shimmer          │
├─────────────────────────────────────────────────────────┤
│ 3. PRESENTATION — Habitat · Wheel · Chat chrome         │
│    opacity · scale · phase lag · float                   │
├─────────────────────────────────────────────────────────┤
│ 2. COGNITIVE — Octo                                     │
│    fieldState · cube rhythm · tick (feeds execution)    │
├─────────────────────────────────────────────────────────┤
│ 1. EXECUTION — hard reality (never fracture-touched)    │
│    router · executor · input graph · spatial sink         │
└─────────────────────────────────────────────────────────┘
         ↑ data up (intent)          ↓ pixels down only
         └── fracture never feeds back ──┘
```

### Layer contracts

| Layer | Touches execution? | Touches routing? | User-visible as “system”? |
|-------|-------------------|------------------|---------------------------|
| **1 Execution** | — | authoritative | No (invisible spine) |
| **2 Cognitive** | produces intent | no | Octo as presence |
| **3 Presentation** | never | never | chrome / dock / wheel |
| **4 Fracture** | never | never | never (felt, not named) |

**Cognitive note:** Octo feeds execution with intent; execution does not deform cognitive truth. Fracture only deforms **how synchronization feels** after commit.

---

## 2. What Step 3.2 actually changed

| Before | After |
|--------|-------|
| UI feedback system | **Temporal field system** |
| visual response to state | **synchronization distortion engine** |
| alignment as debug artifact | alignment as **perception fracture renderer** |

Step 3.2 implementation map:

| Surface | Distortion type |
|---------|-----------------|
| Chat dock | habitat opacity + phase coupling |
| Capability wheel | wheel phase lag (opacity/scale rhythm) |
| Octo tick | `fracturePhaseMs` → elapsed-time offset |
| Cesium host | spatial opacity + parallax freeze + shimmer |
| Map strip | habitat float |

All **post-render only** ([`PERCEPTUAL_ALIGNMENT_RENDERING_V1.md`](PERCEPTUAL_ALIGNMENT_RENDERING_V1.md) §3.5 one-way rule).

---

## 3. Three guarantees (current production posture)

| Guarantee | Mechanism |
|-----------|-----------|
| **Execution purity** | Fracture influence = 0 on router / executor / `fieldState` |
| **Routing determinism** | Removing fracture leaves command graph identical |
| **Perception isolation** | UI changes only `opacity` / `transform` / `filter` / uniforms after commit |

CI: `stabilization:validate-perception-alignment-v0` (P2-F01…F05) + fracture regression tests.

---

## 4. Rhizoh.com surface (user mental model)

User perceives:

- one world
- one presence (Octo)
- one interaction surface
- one map

User never perceives (by design):

- alignment engine
- executor graph
- fracture system
- CI firewall

Engineering truth lives in dev mirror + docs — not in product copy or HUD.

---

## 5. Architectural threshold crossed

```
engineering system  →  perceptual system
backend/frontend    →  reality model separation
```

Not a styling pass. Not a dashboard. **Algı fiziği** — distortion of synchrony, not display of state.

---

## 6. V2 scope (next phase — spec only, not code)

V2 turns fracture from ad-hoc hooks into a **Perceptual Physics Kernel**:

### 6.1 Fracture primitive registry

Frozen catalog of allowed distortion primitives — each maps alignment signal → numeric field only:

| Primitive ID | Field | Layers |
|--------------|-------|--------|
| `PP_PHASE_LAG_V0` | `phaseMs` | octo, habitat, wheel |
| `PP_OPACITY_MISMATCH_V0` | `opacity` | octo, habitat, spatial, wheel |
| `PP_SPATIAL_FLOAT_V0` | `floatPx` | habitat |
| `PP_PARALLAX_FREEZE_V0` | `parallaxFreeze` | spatial |
| `PP_DEPTH_SEPARATION_V0` | `depthSeparation` | octo co-presence |
| `PP_SHIMMER_INSTABILITY_V0` | `shimmer` | spatial |

No primitive may emit copy, CTA, or routing side effects.

### 6.2 Allowed distortion field

Single frozen schema: `castle.perceptual_distortion_field.v0`

- Inputs: alignment contract (read-only)
- Outputs: numeric fields per layer
- Validator: determinism + no string leak + no execution keys

### 6.3 Cross-layer visual invariants

| ID | Invariant |
|----|-----------|
| `VI_NO_LENS_CONNECT` | No visual line/flow between Octo ↔ Cesium ↔ Habitat |
| `VI_POST_RENDER_ONLY` | Distortion applies after committed UI state |
| `VI_NO_MEASUREMENT` | No risk/score/healthy surfaced to user |
| `VI_CO_PRESENCE_NOT_MERGE` | Same time ≠ same scene ≠ same story |

### 6.4 Illegal perceptual couplings (V2 CI extension)

Extend firewall beyond P2-F01…F05:

| ID | Forbidden |
|----|-----------|
| `PP-IL01` | Fracture primitive → `routeCesiumCommandV0` |
| `PP-IL02` | Fracture primitive → `setFieldState` / habitat focus derivation |
| `PP-IL03` | Fracture primitive → input `pointer-events` / latency / debounce |
| `PP-IL04` | Alignment mirror read inside fracture tick → execution feedback |
| `PP-IL05` | User-facing string derived from `explanations[].code` |

### 6.5 V2 deliverables (when approved)

| Artifact | Role |
|----------|------|
| `perceptualDistortionFieldV0.js` | Registry + composer (replaces ad-hoc atmosphere branches) |
| `perceptualPhysicsInvariantV0.test.js` | Cross-layer invariant regression |
| `perceptual-physics-forbidden-grep.mjs` | PP-IL01…IL05 |
| Migrate `perceptionFractureAtmosphereV0.js` | Thin wrapper over distortion field |

---

## 7. Founder lock (summary sentence)

> **Execution produces reality.**  
> **Fracture does not change reality — it changes how reality’s time and space feel out of sync.**

---

## 8. Decision gate before V2 code

V2 implementation starts only when:

1. This charter reviewed and frozen
2. V1 fracture hooks stable in prod observation window
3. Explicit go on `perceptual-physics-forbidden-grep` CI expansion

Until then: **no new distortion primitives** without registry entry + invariant test.

---

## 9. Social + event pointer

Multi-Castle invites, live concert, visit/call, and full event taxonomy (solo/multi · mono/multi-lang · planned/live/replay): [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md)

Social events use the same fracture/passive rules — crowd and stream desync are **post-render texture only**, never RSVP or routing influence.
