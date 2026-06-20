# Rhizoh Cesium World Commit v0

**SPECFLOW:** `RESEARCH-ONLY`

**Prerequisites:** [`RHIZOH_PRISM_CUBE_COMMIT_V0.md`](RHIZOH_PRISM_CUBE_COMMIT_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/cesiumWorldCommitV0.js`

---

## SSOT sentence

> **Committed prism cube spatial objects reach the world sink — Cesium commit + map pin rows for Leaflet fallback.**

---

## Pipeline position (terminal)

```
… → prismCubeCommit → cesiumWorldCommit
```

---

## What it does

1. Reads `prismCubeCommit.committedCubes` with `mapPinEligible` spatial objects
2. Registers `STATIC` spatial nodes (`prism-cube-{cubeId}`)
3. Commits via `spatialWorldAdapter` → `commit_spatial_node` Cesium op
4. Publishes map pin rows to `getPrismCubeMapPinRowsV0()` (Leaflet + session pin owner)

---

## Map pin row shape

```javascript
{
  id: "prism_cube:{cubeId}",
  name, label, type: "agent",
  lat, lon, color,
  prismCube: { cubeId, entityId, arenaType, observerRelative }
}
```

Arena colors: authority `#6366f1` · chess `#f59e0b` · sports `#22c55e`

---

## Boot signals

- `cesium.world.pin_committed`
- `cesium.world.commit_complete`

---

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.cesiumWorldCommit.worldCommittedCount
m.cesiumWorldCommit.mapPins
m.cesiumWorldCommit.deferredCount   // >0 if Cesium sink not ready

window.__rhizoh.prismCubeMapPins()
window.__rhizoh.cesiumWorldCommitSignals()
```

Boot: `boot.cesium_world_commit · armed world_sink`

---

## Deferred vs committed

| State | Meaning |
|-------|---------|
| `worldCommittedCount > 0` | Cesium sink accepted spatial nodes |
| `deferredCount > 0` | Sink not ready — retries on `CASTLE_CESIUM_COMMAND_READY` |
| `mapPinCount > 0` | Pins always registered for Leaflet fallback |

---

## Module

`apps/client/src/rhizoh/runtime/cesiumWorldCommitV0.js`
