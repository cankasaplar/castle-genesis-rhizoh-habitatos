# Rhizoh Arena Population Layer v0

**SPECFLOW:** `RESEARCH-ONLY` · **Phase 5.1 — which pins populate each SpiralMMO layer**

**Prerequisites:** [`RHIZOH_SPATIAL_DISTRIBUTION_LAYER_V0.md`](RHIZOH_SPATIAL_DISTRIBUTION_LAYER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/arenaPopulationLayerV0.js`

---

## SSOT sentence

> **Distribution separates coordinates; population decides which pins exist on each SpiralMMO layer — arena event → cube → tower → layer.**

---

## Problem solved

| Before | After |
|--------|-------|
| Pins exist at unique coordinates | **Which** pins populate explorer / castle / economy |
| Authority merge pins only | V11 layer seeds + authority enrichment |
| No arena → pin chain | Chess / Sports / Media population chains declared |

---

## Pipeline position

```
… → spatialDistribution → arenaPopulation → (Explorer Map UI / seasonal ephemeral)
```

---

## Arena population chains

| Source | Event | Cube | Tower | Layer |
|--------|-------|------|-------|-------|
| Chess move | `arena.chess.move.v1` | chess_cube | CHESS | explorer |
| Sports delta | `arena.sports.delta.v1` | sports_cube | SPORTS | explorer |
| Media frame | `arena.media.frame.v1` | media_cube | MEDIA | economy (locked) |
| Authority seal | `arena.authority.seal.v1` | prism_cube | AUTHORITY_EPISTEMIC | castle |

---

## V11 first-live seeds

| Layer | Pins | Status |
|-------|------|--------|
| **Explorer** | Traveler · Explorer · Ghost · Castle | ACTIVE |
| **Castle** | Castle · Research · Academy | DORMANT |
| **Economy** | Product · Design · Media · Shop | DORMANT |
| **Seasonal** | 06:44 cycles | deferred |

Authority merge pins from `spatialDistribution.distributedPins` are enriched and marked ACTIVE on the castle layer.

---

## Boot signals

- `arena.population.v11_seeded`
- `arena.population.complete`
- `arena.population.chess` / `arena.population.sports` (on-demand)

---

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.arenaPopulation.activePinCount
m.arenaPopulation.pinsByLayer.explorer.length
m.spatialDistribution.uniqueCoordinateCount
window.__rhizoh.arenaPopulationByLayer()
window.__rhizoh.arenaPopulationChains()
window.__rhizoh.populateChessArena({ move: 'e4', entityId: '...' })
```

Boot: `boot.arena_population · armed v11_layer_seeds`

---

## Deferred

- Seasonal ephemeral population (06:44 cycles)
- Media ledgerization unlock
- Chess auto-ingest on move stream
- Worker consensus

---

## Module

`apps/client/src/rhizoh/runtime/arenaPopulationLayerV0.js`
