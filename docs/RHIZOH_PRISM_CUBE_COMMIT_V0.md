# Rhizoh Prism Cube Commit v0

**SPECFLOW:** `RESEARCH-ONLY`

**Prerequisites:** [`RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md`](RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/prismCubeCommitV0.js`

---

## SSOT sentence

> **Resolved prism cubes become committed spatial objects — actionSurface opens; world sink wired via cesiumWorldCommit.**

---

## Before / After

| Before | After |
|--------|-------|
| `actionSurface.status: armed` | `active` (arena affordances) |
| Cube = semantic carrier | Cube = **spatial object** |
| `commitDeferred: true` | `commitDeferred: false` |
| No map pin eligibility flag | `mapPinEligible: true` when worldPosition set |

---

## Pipeline position

```
… → spatialSlotResolver → prismCubeCommit → (next: Cesium world commit)
```

---

## Spatial object shape

```javascript
{
  status: "committed",
  cubeId, entityId, slotId,
  worldPosition, logicalPosition,
  observerRelative: true,
  mapPinEligible: true,
  cesiumCommitDeferred: true
}
```

---

## Action surface affordances (by arena)

| Arena | Affordances |
|-------|-------------|
| `authority_epistemic` | observe · resolveIdentity · bindEntity |
| `chess` | observe · playMove (stub) · resolveIdentity |
| `sports` | observe · viewScore (stub) · resolveIdentity |
| `media` | locked — `MEDIA_LEDGERIZATION_LOCKED_PHASE_1` |

---

## Boot signals

- `prism.cube.committed`
- `prism.spatial_object.registered`
- `prism.action_surface.active`
- `prism.commit.complete`

---

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.prismCubeCommit.committedCubes[0].spatialObject.status       // "committed"
m.prismCubeCommit.committedCubes[0].actionSurface.status       // "active"
m.prismCubeCommit.committedCubes[0].actionSurface.affordances

window.__rhizoh.commitPrismCubes({ spatialSlotResolver: m.spatialSlotResolver })
window.__rhizoh.prismCubeCommitSignals()
```

Boot: `boot.prism_cube_commit · armed spatial_object`

---

## Deferred

| Item | Status |
|------|--------|
| Cesium world commit | ✔ [`RHIZOH_CESIUM_WORLD_COMMIT_V0.md`](RHIZOH_CESIUM_WORLD_COMMIT_V0.md) |
| Media ledgerization | Phase 1 gate |
| Worker consensus | Data-plane READY required |

---

## Module

`apps/client/src/rhizoh/runtime/prismCubeCommitV0.js`
