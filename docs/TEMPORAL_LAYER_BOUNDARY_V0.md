# Temporal layer boundary — V0

**SPECFLOW:** `RESEARCH-ONLY` — normative **separation** text; execution remains `liveRuntimeTemporalLockV0.js` + orchestrator.

## Non-negotiable distinctions

| Must **not** conflate | Reason |
|----------------------|--------|
| **Temporal ≠ Identity** | Drift and lag are **perception / scheduling** concerns; they never mint or repair `castleId`, `homeAnchor`, or auth truth. |
| **Temporal ≠ Freeze** | Frozen core / SSOT snapshots are **change-controlled elsewhere**; temporal metrics do not rewrite freeze artifacts or identity graphs. |

## Four-layer stack (runtime product shape)

```
IDENTITY (freeze / L0 — reference, not driven by ticks)
        ↓
WORLD STATE (runtime — worldPresence, feeds, L1 slices)
        ↓
TEMPORAL LAYER (drift, lag estimates, tick normalization, render-sync **hints**)
        ↓
PROJECTION (sceneProjectionAdapter, Cesium bridge, UI — **visual only**)
```

**Temporal layer:** corrects **when** and **how smoothly** perception is applied; it **never** becomes a second source of truth.

## In-scope vs out-of-scope (`liveRuntimeTemporalLockV0.js`)

| In scope | Out of scope |
|----------|----------------|
| Tick drift vs planned interval | Building or mutating `worldPresence` state |
| Missed-frame **hint** (extra render nudges) | Identity, subscription ACL, Firestore writes |
| Tick-wall vs interval lag + **EMA estimate** (read-only signals) | `deriveProjectionHintsV0` math, tint curves |
| Orchestrator **interval clamp** (normalization) | Smoothing blend inside `projectionSmoothingV0` (stays separate; temporal may only **expose hints** for callers to use later) |
| `getLiveRuntimeRenderSyncHintsV0` — derived **hints** from lag metrics | Embedding Cesium or React |

## Related code

- `apps/client/src/rhizoh/runtime/liveRuntimeTemporalLockV0.js`
- `apps/client/src/rhizoh/runtime/projectionSmoothingV0.js` — visual continuity only
- [`docs/LIVE_RUNTIME_STREAMING_CORE_V0.md`](LIVE_RUNTIME_STREAMING_CORE_V0.md)
- [`docs/PERCEPTUAL_STABILITY_LAYER_V0.md`](PERCEPTUAL_STABILITY_LAYER_V0.md) — jitter, smoothness, frame–perception, Cesium feel (cross-cutting; `RESEARCH-ONLY`)

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.1 | 2026-05-12 | Code alignment (lag EMA, render-sync hints, interval clamp; orchestrator passes interval into `complete`); link perceptual stability umbrella doc |
| v0 | 2026-05-12 | Initial boundary: temporal ≠ identity ≠ freeze; four-layer diagram |
