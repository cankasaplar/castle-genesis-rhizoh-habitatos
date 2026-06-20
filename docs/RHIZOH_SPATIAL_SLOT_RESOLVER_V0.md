# Rhizoh Spatial Slot Resolver v0

**SPECFLOW:** `RESEARCH-ONLY`

**Prerequisites:** [`RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md`](RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md) · [`RHIZOH_ARENA_BINDING_LAYER_V0.md`](RHIZOH_ARENA_BINDING_LAYER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/spatialSlotResolverV0.js`

---

## SSOT sentence

> **Arena-bound cubes gain world coordinates — logical grid projects to WGS84 epistemic space; Cesium commit deferred.**

---

## Before / After

| Before | After |
|--------|-------|
| `worldPosition: null` | WGS84 projection from calibration root |
| `eventAnchor: null` | entity + slot + world anchor |
| `actionSurface: null` | `armed` (commit deferred) |
| Identity without place | Entity-first + world place |

---

## Pipeline position

```
… → spatialAllocation → arenaBinding → spatialSlotResolver → (next: prism cube commit)
```

---

## Projection model

| Input | Output |
|-------|--------|
| `logicalPosition: { x, y, z }` | `worldPosition: { lat, lon, alt }` |
| `coordinateSpace: logical_epistemic_grid` | `wgs84_epistemic_projection` |
| Origin | `anchor_sariyer_stability` (calibration root — not user HOME_BASE) |

Scale constants align with `spatialWorldAdapterV0` vec projection (`0.0008°` per grid unit, `40m` per z).

---

## worldPosition shape

```javascript
{
  lat, lon, alt,
  coordinateSpace: "wgs84_epistemic_projection",
  originAnchorId: "anchor_sariyer_stability",
  resolverMethod: "logical_grid_calibration_root_v0",
  logicalSource: { x, y, z }
}
```

---

## Boot signals

- `spatial.slot.world_resolved`
- `spatial.binding.world_position_set`

---

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.spatialSlotResolver.resolvedCubes[0].spatialSlot.worldPosition
m.spatialSlotResolver.signals

window.__rhizoh.resolveSpatialSlots({ arenaBinding: m.arenaBinding })
window.__rhizoh.resolveLogicalToWorld({ x: 1, y: 2, z: 0 })
window.__rhizoh.spatialSlotResolverSignals()
```

Boot: `boot.spatial_slot_resolver · armed world_projection`

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
