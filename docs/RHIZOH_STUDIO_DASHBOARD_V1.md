# Rhizoh Studio Dashboard V1

**SPECFLOW:** `RESEARCH-ONLY` — read-only product surface; no execution authority.

## Problem

`__rhizoh.studioVisibility()` already produces all observation data. Investors, players, and first users will not read console logs. They need one screen.

## Solution

**Studio Dashboard** — 2×4 camera grid wired to `studioVisibility()`:

```
┌──────────────┬──────────────┐
│ Chess Arena  │ Go Arena     │
├──────────────┼──────────────┤
│ Checkers     │ Academy      │
├──────────────┼──────────────┤
│ Habitat      │ Memory       │
├──────────────┼──────────────┤
│ WorldSports  │ Spatial      │
└──────────────┴──────────────┘
```

## Insertion points

| Surface | Component |
|---------|-----------|
| Studio drawer (P0) | `RhizohStudioEightCameraDashboardV0` above Life Memory panel |
| `/academy/observe` | Same dashboard in hub section A0b |
| Console | `__rhizoh.studioVisibility()` (unchanged) |

## Chess camera live

Chess tile shows **● live** when `isChessGameClusterRunningV0()` — cluster active, not just historical moves. Deep link: `/world/space?channel=chess`.

## Adapter registry

Each camera tile binds a **visual consumer adapter** via `rhizohStudioObservationAdapterRegistryV0`:

```javascript
__rhizoh.studioAdapters()  // 8/8 consumerReady
```

Chrome `No available adapters` on `/academy/observe` = **WebGPU GPU probe** — not missing studio adapters. See [`RHIZOH_STUDIO_OBSERVATION_ADAPTER_REGISTRY_V0.md`](RHIZOH_STUDIO_OBSERVATION_ADAPTER_REGISTRY_V0.md).

## Sprint alignment

| Sprint | Focus |
|--------|-------|
| **Sprint 1 (today)** | Studio Dashboard · 8-camera visibility · chess live |
| Sprint 2 | YouTube short — Chess Observation #001 |
| Sprint 3 | WorldSports feed → camera → YouTube |
| Sprint 4 | Spatial / Cesium (legal hold lift) |
| Director | `directorTimeline()` + Sora prompt stub — [`RHIZOH_DIRECTOR_ENGINE_V1.md`](RHIZOH_DIRECTOR_ENGINE_V1.md) |

## Honest framing

> Observation only. Not executive Life OS. `mutationPermitted: false`.

## Related

- [`RHIZOH_STUDIO_V1_VISIBILITY_LAYER_V0.md`](RHIZOH_STUDIO_V1_VISIBILITY_LAYER_V0.md)
- [`RHIZOH_YOUTUBE_OBSERVATION_SERIES_V0.md`](RHIZOH_YOUTUBE_OBSERVATION_SERIES_V0.md)
