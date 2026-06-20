# Rhizoh Explorer Map UI v0

**SPECFLOW:** `RESEARCH-ONLY` · **Phase 5.2 — full-screen Leaflet + SpiralMMO layer filter**

**Prerequisites:** [`RHIZOH_ARENA_POPULATION_LAYER_V0.md`](RHIZOH_ARENA_POPULATION_LAYER_V0.md)

**Surface:** `/world/space` · `RhizohWorldSpaceMapHostV0` · `V11CoreMapLayerV0`

---

## SSOT sentence

> **Arena population decides which pins exist; Explorer Map UI decides which spiral layer is visible on the full-screen Leaflet surface.**

---

## V11 first-live default

| Layer | Default | Pins |
|-------|---------|------|
| **Explorer** | ON | Traveler · Explorer · Ghost · Castle · CHESS · SPORTS |
| **Castle** | OFF | Castle · Research · Academy · Authority |
| **Economy** | OFF | Product · Design · Media · Shop |
| **Seasonal** | OFF | deferred |

Sovereign / portal / live-match pins without `spiralLayer` remain always visible.

---

## UI location

World · Space bottom strip → **Layers · filter** → **SpiralMMO layers**

- Toggle per layer
- Double-click layer chip = single-layer focus
- **Show dormant seed pins** reveals castle/economy DORMANT seeds from arena population

---

## Pin update subscription

`V11CoreMapLayerV0` subscribes to:

- `rhizoh:prism-cube-map-pins-v0`
- `rhizoh:arena-population-v0`
- `rhizoh:spiral-map-layer-filter-v0`

---

## Deep link

```
/world/space?spiralLayer=explorer
/world/space?spiralLayer=castle
```

---

## DevTools

```javascript
window.__rhizoh.epochMergeAndAssimilate()
window.__rhizoh.prismCubeMapPins()
window.__rhizoh.arenaPopulationByLayer()
// Filter state in localStorage: rhizoh.spiral_map_layer_filter.v0
```

Boot: `boot.explorer_map_ui · armed spiral_layer_filter`

---

## Module map

| Concern | Path |
|---------|------|
| Layer filter state | `spiralMapLayerFilterStateV0.js` |
| Pin SSOT + filter | `rhizohMapPinOwnerV0.js` |
| Filter UI | `RhizohSpiralMapLayerFilterV0.jsx` |
| Leaflet host | `RhizohWorldSpaceMapHostV0.jsx` |
| Shell | `RhizohWorldDomainShellV0.jsx` · `AppRhizohWorldSpaceV0.jsx` |
