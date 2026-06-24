# Rhizoh Studio Observation Adapter Registry v0

**SPECFLOW:** `RESEARCH-ONLY` — binds observation cameras to UI consumers; no execution authority.

## Problem

`studioVisibility()` produces data. Dashboard tiles showed metrics only — **no visual consumer adapters**. Users saw console `No available adapters` on `/academy/observe` and assumed Studio was broken.

## Clarification (critical)

| Signal | Meaning |
|--------|---------|
| Chrome `No available adapters` | **WebGPU** `navigator.gpu.requestAdapter()` — GPU probe only |
| `__rhizoh.studioAdapters()` | **Studio observation adapter registry** — 8 camera UI consumers |

These are unrelated systems.

## Adapter map

| Camera | Adapter kind | Consumer |
|--------|--------------|----------|
| chess_arena | `visual_arena` | Mini board + recent SAN moves |
| go_arena | `feed_arena` | Stone count + move feed |
| checkers_arena | `sparse_arena` | Sparse move observe |
| habitat | `climate` | Climate bar + label |
| memory | `graph` | Memory node chips |
| academy | `union_digest` | Union label + discipline count |
| world_sports | `live_feed` | Honest empty feed placeholder |
| spatial | `held_placeholder` | Legal hold badge |

## Console

```javascript
__rhizoh.studioVisibility()
__rhizoh.studioAdapters()   // adapter registry snapshot
```

## Sprint alignment

| Sprint | Focus |
|--------|-------|
| Sprint 1 | Studio dashboard + **adapter registry** (this doc) |
| Sprint 2 | Chess Observation #001 short (31+ moves threshold) |
| Sprint 3 | WorldSports feed → camera |
| Sprint 4 | Spatial (legal hold lift) |

## Related

- [`RHIZOH_STUDIO_DASHBOARD_V1.md`](RHIZOH_STUDIO_DASHBOARD_V1.md)
- [`RHIZOH_STUDIO_V1_VISIBILITY_LAYER_V0.md`](RHIZOH_STUDIO_V1_VISIBILITY_LAYER_V0.md)
