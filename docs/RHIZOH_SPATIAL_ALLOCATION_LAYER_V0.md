# Rhizoh Spatial Allocation Layer v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_PRISM_CUBE_ENGINE_V0.md`](RHIZOH_PRISM_CUBE_ENGINE_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/spatialAllocationLayerV0.js`

---

## 0. SSOT sentence

> **Prism Cube defines reality; Spatial Allocation places it — logical grid first, world coordinates deferred.**

---

## 1. Pipeline position (correct physical order)

```
Semantic Field
    ↓
Prism Cube Engine v0
    ↓
Spatial Allocation Layer v0   ← this module
    ↓
Arena Binding
    ↓
Spatial Slot Resolver v0
    ↓
Media Ledgerization
    ↓
Worker Consensus
```

---

## 2. v0 scope

| Job | v0 | Deferred |
|-----|-----|----------|
| cube → `spatialSlot` | logical grid via topology BFS | WGS84 `worldPosition` |
| arena → cube binding | `arenaBinding.status: pending` | shared identity kernel |
| event → world position | `eventAnchor: null` | media / arena events |

---

## 3. spatialSlot shape

```javascript
{
  slotId,
  logicalPosition: { x, y, z },
  coordinateSpace: "logical_epistemic_grid",
  allocationMethod: "topology_bfs_v0",
  worldPosition: null,
  eventAnchor: null
}
```

Link-type offsets drive BFS placement:

| `linkType` | Axis offset |
|------------|-------------|
| `cross_epoch_bridge` | +X |
| `temporal_chain` | +Y |
| `semantic_coherence` | +Z |

---

## 4. DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.spatialAllocation.placedCubes[0].spatialSlot.logicalPosition
m.spatialAllocation.placedCubes[0].arenaBinding.status  // "pending"

window.__rhizoh.allocateSpatialSlots({ prismCubes })
window.__rhizoh.spatialAllocation()
```

Boot: `boot.spatial_allocation · armed logical_placement`

---

## 5. Prism Cube Engine v1 path

| v0 | v1 target |
|----|-----------|
| `spatialSlot: null` on raw cubes | filled by this layer |
| logical grid only | + world projection (arena-bound) |
| — | + `actionSurface` activation |

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L4b Prism cube v0 | ✔ #228 |
| L4c **Spatial allocation v0** | ✔ this module |
| L5a Arena binding v0 | ✔ [`RHIZOH_ARENA_BINDING_LAYER_V0.md`](RHIZOH_ARENA_BINDING_LAYER_V0.md) |
| L5b Spatial slot resolver | ✔ [`RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md`](RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md) |
| L6 Media ledgerization | ❌ Phase 1 signal gate |
