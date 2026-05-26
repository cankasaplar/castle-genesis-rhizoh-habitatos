# Live runtime streaming core — V0

**SPECFLOW:** `RESEARCH-ONLY` — wire map for the **single merge direction** (world → presence → projection → sinks).

## Pipeline (normative)

```
worldPresenceStoreV0     (weather ingest + cache + provenance)
        ↓
worldPresenceRuntimeV0 (buildWorldPresenceStateV0 — atmosphere slice)
        ↓
sceneProjectionAdapterV0 (deriveProjectionHintsV0 → CSS vars + Castle aura DOM)
        ↓
liveRuntimeOrchestratorV0 (tick: refresh → state → hints → smoothing → DOM →
                           registerLiveRuntimeProjectionConsumerV0 →
                           registerLiveRuntimeCesiumRenderSinkV0)
        ↓
CesiumRealMapLayer       (consumer: liveRuntimeCesiumAtmosphereBridgeV0 + requestRender)
        ↓
Castle presence surface   (documentElement CSS + [data-rhizoh-atmosphere-castle-surface])
```

**React entry:** `RhizohAtmosphereRuntime.jsx` starts `startLiveRuntimeOrchestratorV0` and publishes the observation envelope (lane + payload) — not SSOT for identity.

## Single import surface (barrel)

`apps/client/src/rhizoh/runtime/liveRuntimeStreamingCoreV0.js` — re-exports store, runtime, adapter, orchestrator registration APIs + `LIVE_RUNTIME_STREAMING_CORE_SCHEMA_V0`.

## Cesium bridge rules

`apps/client/src/castleFlight/liveRuntimeCesiumAtmosphereBridgeV0.js`:

- Applies fog + `globe.atmosphereLightIntensity` from **smoothed** projection hints.
- Runs only when `window.__CASTLE_WORLD_PROJECTION__.governance` is **NORMAL** so `cesiumWorldProjectionBind` governance atmospheres stay authoritative in FROZEN / RECOVERY / DEGRADED.

## ACTIVE tick → scene mutation (controlled risk)

Direct Cesium mutation only runs on the **orchestrator tick**, after **single** registration of the projection consumer, and is torn down with **`unregisterLiveRuntimeProjectionConsumerV0`** on viewer teardown. Together with the **governance gate** and **ACTIVE vs PASSIVE** execution split, the main hazards (multi-consumer double-apply, stray applies after unmount) stay bounded.

Remaining class of issues (drift, lag, missed frames) is intentionally **not** solved in the bridge file — see temporal layer below.

## Next boundary: temporal consistency (already seeded in v0)

Natural evolution **without** touching frozen epistemic core:

| Concern | Where it lives today |
|---------|----------------------|
| Hint smoothing (visual continuity) | `projectionSmoothingV0.js` |
| Tick drift, missed-frame hint, `setTimeout` catch-up, Cesium sink / projection wall metrics, lag EMA, render-sync hints | `liveRuntimeTemporalLockV0.js` + orchestrator `completeLiveRuntimeOrchestratorTickTemporalV0` |
| **Perceptual stability (felt continuity)** | [`docs/PERCEPTUAL_STABILITY_LAYER_V0.md`](PERCEPTUAL_STABILITY_LAYER_V0.md) — jitter, smoothness, frame–perception, Cesium “human-stable” |
| Lane / frame envelope for UI observation (not SSOT truth) | `observationEnvelopeV0.js`, `RhizohAtmosphereRuntime.jsx` |

**Snapshot alignment** for replay / audit belongs to **runtime observation** paths (e.g. `runtimeSnapshotV1`, observation lane) — **not** the identity freeze SSOT unless an explicit stabilization amendment says otherwise.

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.3 | 2026-05-12 | Perceptual stability layer doc link; table row for felt continuity |
| v0.2 | 2026-05-12 | Temporal boundary doc; lag EMA + `getLiveRuntimeRenderSyncHintsV0`; tick interval clamp |
| v0.1 | 2026-05-12 | Risk note (ACTIVE → scene); next boundary = temporal consistency map |
| v0 | 2026-05-12 | Document chain + `registerLiveRuntimeProjectionConsumerV0`; Cesium hooks atmosphere from live hints under NORMAL governance |
