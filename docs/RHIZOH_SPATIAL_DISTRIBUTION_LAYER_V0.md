# Rhizoh Spatial Distribution Layer v0

**SPECFLOW:** `RESEARCH-ONLY` · **Phase 5.0 — SpiralMMO World Layer (foundation)**

**Prerequisites:** [`RHIZOH_CESIUM_WORLD_COMMIT_V0.md`](RHIZOH_CESIUM_WORLD_COMMIT_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/spatialDistributionLayerV0.js`

---

## SSOT sentence

> **Projection places pins at the observer; distribution separates colliding coordinates and assigns tower class + SpiralMMO map layer.**

---

## Problem solved

| Before | After |
|--------|-------|
| All pins at same `lat/lon` | Golden-angle spiral + logical grid spread |
| `AUTHORITY EPISTEMIC` label only | `towerClass` + `spiralLayer` taxonomy |
| Projection only | **Projection + distribution** |

---

## Pipeline position

```
… → cesiumWorldCommit → spatialDistribution → (SpiralMMO layers / arena diversity)
```

---

## Tower registry

| Tower class | Spiral layer |
|-------------|--------------|
| TRAVEL · EXPLORER · GHOST · CHESS · SPORTS | `explorer` |
| CASTLE · RESEARCH · ACADEMY · AUTHORITY_EPISTEMIC · LLM | `castle` |
| ECONOMY · MEDIA | `economy` |
| SEASONAL_EVENT · MIGRATION | `seasonal` (deferred ephemeral) |

---

## Distribution method

1. Base coordinate from observer-relative world projection
2. Logical grid offset (`x/y * 0.0012°`)
3. Golden-angle spiral for collision separation (`~220m` per ring step)

---

## Boot signals

- `spatial.distribution.spread`
- `spatial.distribution.layer_assigned`
- `spatial.distribution.complete`

---

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.spatialDistribution.uniqueCoordinateCount   // >1 when pins were colliding
m.spatialDistribution.distributedPins[0].towerClass
m.spatialDistribution.distributedPins[0].spiralLayer
window.__rhizoh.towerRegistry()
window.__rhizoh.prismCubeMapPins()            // distributed coordinates
```

Boot: `boot.spatial_distribution · armed pin_spread`

---

## Deferred

- Seasonal ephemeral pins
- Media ledgerization
- Chess arena ingest activation
- Worker consensus

---

## Module

`apps/client/src/rhizoh/runtime/spatialDistributionLayerV0.js`
