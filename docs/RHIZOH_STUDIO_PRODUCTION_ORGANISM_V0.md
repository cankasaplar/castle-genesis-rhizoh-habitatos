# Rhizoh Studio Production Organism v0 (deep binding)

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohStudioProductionOrganismV0.js` · `rhizohStudioOrganismSurfaceRolesV0.js`

---

## Kilit cümle

```text
Engine produces world
SCR synchronizes world
UI displays world
Pet makes world spatially inhabited
Studio deep binding makes world a single lived + produced surface
WAL makes world temporally real (B2+ next)
```

---

## Problem

Inhabitance exists; temporal identity is still fragile in memory-only WAL. Before IndexedDB (B2+), **production surfaces were split** from pet + episode + pack.

---

## Çözüm — world as production organism

| Yüzey | Rol |
|--------|-----|
| **Pet** | `world_subject_anchor` — production-aware studio actor |
| **Cap Wheel** | `gesture_field` — SCR gesture projection |
| **Product drawer** | `memory_organ` — episode, WAL entry, pack id |
| **Cesium** | `spatial_truth_layer` — pet entity + cartographic truth |
| **Studio panels** | `production_surface` — Kernel / World map / Director inside citizen shell |

Studio ≠ isolated editor. Panels read the same SSOT as engine output.

---

## Pipeline

Studio execution loop (B1) ends with:

```text
… → pet_citizen_tick → studio_production_organism
```

`publishStudioProductionOrganismV0({ run })` after pack + WAL + pet.

---

## API

- `buildStudioProductionOrganismV0(ctx?)`
- `publishStudioProductionOrganismV0(ctx?)`
- `readStudioProductionOrganismV0()`
- `useRhizohStudioProductionOrganismV0()` — React; rebuilds on loop / pet / spatial events

Event: `rhizoh:studio-production-organism-v0`

---

## SSOT

```javascript
window.__rhizoh.studioProductionOrganism
// + existing: studioOutputPack, worldEpisode, petCitizen, petSpatialBinding
```

UI: `RhizohStudioProductionContextStripV0` inside `RhizohStudioCitizenShellV0`; `data-rhizoh-studio-organ-role` on Cap Wheel, drawer, studio shell.

---

## Sıra (locked)

1. **Studio deep binding** (this doc) ✔ v0  
2. **B2+ WAL** — IndexedDB + world identity ✔ [`RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md`](RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md)  
3. Replay identity harness · Studio polish · **Castle co-presence** [`RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md`](RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md)

Bkz. [`RHIZOH_STUDIO_EXECUTION_LOOP_V0.md`](RHIZOH_STUDIO_EXECUTION_LOOP_V0.md) · [`RHIZOH_PET_CITIZEN_RUNTIME_V0.md`](RHIZOH_PET_CITIZEN_RUNTIME_V0.md) · [`RHIZOH_PET_SPATIAL_BINDING_V0.md`](RHIZOH_PET_SPATIAL_BINDING_V0.md)
