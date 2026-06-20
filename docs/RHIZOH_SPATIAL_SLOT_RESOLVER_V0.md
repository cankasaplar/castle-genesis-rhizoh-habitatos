# Rhizoh Spatial Slot Resolver v0.1

**SPECFLOW:** `RESEARCH-ONLY`

**Prerequisites:** [`RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md`](RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md) · [`RHIZOH_ARENA_BINDING_LAYER_V0.md`](RHIZOH_ARENA_BINDING_LAYER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/spatialSlotResolverV0.js`

---

## SSOT sentence

> **Arena-bound cubes gain observer-relative world coordinates — logical grid projects from the user's observation origin, not a global Istanbul calibration root.**

---

## Before / After (v0 → v0.1)

| v0 | v0.1 |
|----|------|
| Sarıyer calibration root for all users | **Observation origin per observer** |
| Same world pin for everyone | Chess/sports entity pin at **your** location |
| — | Live sports **events** pin to **venue** when team name known |

---

## Three origins (do not conflate)

| Origin | Role | Used for arena pins? |
|--------|------|----------------------|
| **Calibration root** (Sarıyer) | Atmosphere / projection factory seed | Metadata only — **not** pin placement |
| **Observation origin** | Where this observer sees the world | **Yes** — chess, authority, sports entity |
| **HOME_BASE** | Castle identity (profile) | Feeds observation origin when set |

Observation origin resolves via `resolveWorldMapBootstrapGeoV0()`:

1. `__CASTLE_NEXUS_GEO__` (device/session)
2. User castle anchor
3. Serencebey seed
4. Beşiktaş fallback

---

## Arena projection policy

| Arena type | Origin |
|------------|--------|
| `authority_epistemic` | Observation origin |
| `chess` | Observation origin (local arena pin) |
| `sports` (entity) | Observation origin |
| `sports` (live event + team name) | Venue anchor (`resolveSportVenueAnchorV0`) |
| `media` | Locked — `MEDIA_LEDGERIZATION_LOCKED_PHASE_1` |

---

## Projection formula

```
worldPosition.lat = observationOrigin.lat + logical.y * 0.0008
worldPosition.lon = observationOrigin.lon + logical.x * 0.0008
worldPosition.alt = 120 + logical.z * 40
```

Scale aligns with `spatialWorldAdapterV0`.

---

## worldPosition shape

```javascript
{
  lat, lon, alt,
  coordinateSpace: "wgs84_epistemic_projection",
  observationOrigin: { lat, lon, source, policy, arenaType },
  calibrationOriginId: "anchor_sariyer_stability",  // metadata only
  resolverMethod: "logical_grid_observation_origin_v0.1",
  observerRelative: true,
  logicalSource: { x, y, z }
}
```

---

## Boot signals

- `spatial.slot.world_resolved`
- `spatial.binding.world_position_set`
- `spatial.observer_origin.active`

---

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.spatialSlotResolver.observationOrigin
m.spatialSlotResolver.resolvedCubes[0].spatialSlot.worldPosition

window.__rhizoh.resolveObservationOrigin()
window.__rhizoh.resolveArenaProjectionOrigin("chess")
window.__rhizoh.resolveLogicalToWorld({ x: 1, y: 2, z: 0 })
```

Boot: `boot.spatial_slot_resolver · armed world_projection`

---

## Multi-user model

Each observer resolves pins from **their** observation origin. Same entity ID (arena binding) can continuity-link across arenas; **world position is observer-relative projection**, not a single global Istanbul center.

---

## Deferred

| Item | Status |
|------|--------|
| Prism cube commit | Next |
| Cesium world commit | Deferred |
| Media ledgerization | Phase 1 gate |
| Worker consensus | Data-plane READY required |

---

## Module

`apps/client/src/rhizoh/runtime/spatialSlotResolverV0.js`
