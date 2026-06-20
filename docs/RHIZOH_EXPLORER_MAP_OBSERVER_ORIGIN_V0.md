# Rhizoh Explorer Map — Observer Origin v0

**SPECFLOW:** `RESEARCH-ONLY`

**Related:** [`RHIZOH_EXPLORER_MAP_UI_V0.md`](RHIZOH_EXPLORER_MAP_UI_V0.md) · [`RHIZOH_ARENA_POPULATION_LAYER_V0.md`](RHIZOH_ARENA_POPULATION_LAYER_V0.md)

---

## SSOT sentence

> **Arena pins project at the observer origin; the map must center there — not on the global sovereign mesh or Istanbul demo cluster.**

---

## Observation origin chain

```
GPS / Konum seç → __CASTLE_NEXUS_GEO__
continuity hydrate → __CASTLE_NEXUS_GEO__
Serencebey seed → bootstrap geo
Beşiktaş fallback (last resort)
```

`epochMergeAndAssimilate()` → `spatialSlotResolver` → `arenaPopulation` seeds spread from this origin.

---

## Why pins looked “wrong”

| Symptom | Cause |
|---------|-------|
| World globe + spiral continents | No nexus geo → neutral/world viewport + sovereign mesh always visible |
| Istanbul cluster | Fallback bootstrap before GPS grant |
| Pins not at GPS | `epochMerge` ran before `Konum seç` — re-merge after geo |

---

## Fix (v0)

1. Explorer-only filter hides legacy sovereign + spiral continent pins
2. Map `setView` / `fitBounds` uses arena population pins + observation origin
3. `Konum seç` persists geo + re-runs epoch merge + recenters map
4. Auto epoch merge on `/world/space` mount
5. Opaque `window_error` events no longer trip `CASTLE_FATAL`

---

## User flow

1. Open `/world/space`
2. **HOME CASTLE** (Serencebey) is always visible — immutable origin seed
3. Tap **Konumumu kullan** or **Haritadan seç** (GPS / map pick)
4. **MY CASTLE** persists at your coordinates; Explorer seeds cluster there
5. Live sports match pins remain visible in explorer-only filter
6. Optional: `await window.__rhizoh.epochMergeAndAssimilate()` in DevTools to verify

---

## Pin model (v0.1)

| Pin | Location | Persistence |
|-----|----------|-------------|
| `origin_home_serencebey` | Serencebey 41.0422 · 29.0089 | Always |
| `my_castle` | User GPS / map pick | Continuity + nexus geo |
| Explorer seeds | Observer origin offsets | Re-project on epoch merge |

---

## DevTools

```javascript
window.__rhizoh.resolveObservationOrigin()
window.__rhizoh.arenaPopulationByLayer()
window.__CASTLE_NEXUS_GEO__
```
