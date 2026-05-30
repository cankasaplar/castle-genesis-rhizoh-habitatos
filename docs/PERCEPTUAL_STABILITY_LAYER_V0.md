# Perceptual stability layer — V0

**SPECFLOW:** `RESEARCH-ONLY` — product-facing name for a **cross-cutting** stability strip, not a new execution authority. Truth and identity stay in L0 / freeze paths; this layer only **shapes how change is felt**.

## What it solves

| Symptom | Mechanism (today) |
|---------|-------------------|
| **UI jitter** (values or glow “nervous”) | `projectionSmoothingV0` — EMA / inertia on **hints** only (no world state). |
| **User-facing smoothness** | Same + orchestrator single tick → DOM CSS vars + Castle aura surface. |
| **Frame ↔ perception alignment** | `liveRuntimeTemporalLockV0` — drift, tick-wall vs interval lag **EMA**, `getLiveRuntimeRenderSyncHintsV0` for downstream throttle hints. |
| **Cesium “real-time but human-stable”** | `liveRuntimeCesiumAtmosphereBridgeV0` under **NORMAL** governance + orchestrator-driven consumer (no identity coupling); temporal hints can later tune render pressure without moving fog math into temporal. |

## What it explicitly does **not** do

- Does **not** mint or merge **identity** / `HOME_BASE` / profile truth ([`docs/TEMPORAL_LAYER_BOUNDARY_V0.md`](TEMPORAL_LAYER_BOUNDARY_V0.md), [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md)).
- Does **not** replace **freeze** or runtime snapshot SSOT — only **felt** continuity of permitted projections.

## Layer map (one glance)

```
World presence / feeds     →  numeric state (L1 runtime)
Temporal lock (v0)         →  tick alignment, lag EMA, render-sync pressure (no scene writes)
Projection smoothing (v0)  →  hint inertia (visual only)
Scene adapter + DOM/CSS    →  host + Castle aura
Cesium bridge (v0)         →  globe fog / atmosphere under NORMAL governance
```

## Primary code touchpoints

| Role | File |
|------|------|
| Hint inertia | `apps/client/src/rhizoh/runtime/projectionSmoothingV0.js` |
| Tick / lag / hints API | `apps/client/src/rhizoh/runtime/liveRuntimeTemporalLockV0.js` |
| Hint → CSS / aura | `apps/client/src/rhizoh/runtime/sceneProjectionAdapterV0.js` |
| Tick orchestration | `apps/client/src/rhizoh/runtime/liveRuntimeOrchestratorV0.js` |
| Cesium feel | `apps/client/src/castleFlight/liveRuntimeCesiumAtmosphereBridgeV0.js` |
| Single import barrel | `apps/client/src/rhizoh/runtime/liveRuntimeStreamingCoreV0.js` |

## Related docs

- [`docs/LIVE_RUNTIME_EXPERIENCE_PHASE_V0.md`](LIVE_RUNTIME_EXPERIENCE_PHASE_V0.md)
- [`docs/COGNITIVE_LOAD_LAYER_V0.md`](COGNITIVE_LOAD_LAYER_V0.md) — disclosure & attention budget (optional but inevitable)
- [`docs/LIVE_RUNTIME_STREAMING_CORE_V0.md`](LIVE_RUNTIME_STREAMING_CORE_V0.md)
- [`docs/TEMPORAL_LAYER_BOUNDARY_V0.md`](TEMPORAL_LAYER_BOUNDARY_V0.md)
- [`docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md`](RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md) (Yol A — perceptual stability)

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0 | 2026-05-12 | Initial naming: jitter, smoothness, frame–perception, Cesium human-stable feel |
