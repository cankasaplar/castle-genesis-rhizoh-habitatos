# Rhizoh Pet Citizen Runtime v0 (C)

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohPetCitizenRuntimeV0.js`

---

## Rol (ontology validator)

Pet is **not** a UI feature. Pet is the first **non-authoring inhabited entity**:

```text
Engine produces world
SCR synchronizes world
UI displays world
Pet proves world is inhabited
```

| Soru | Cevap |
|------|--------|
| Kendi state üretir mi? | **Hayır** (`owns_state: false`) |
| Nereden beslenir? | RCAL focus_lock + MCIB/CCF read-only |
| Nerede yaşar? | RSBL world projection + SCR pet slot |
| Hafıza? | WAL `pet_citizen` snapshot per episode |

---

## Pipeline

```text
Studio loop → RSBL → SSL → SCR
        ↓
tickPetCitizenFromWorldStackV0
        ↓
WAL entry.pet_citizen
        ↓
RhizohPetCitizenMarkerV0 (projection only)
```

---

## SSOT

```javascript
window.__rhizoh.petCitizen
// { inhabited, validates_scr, position, coherence_id, wal_entry_id, owns_state: false }
```

Event: `rhizoh:pet-citizen-v0`

**Spatial:** [`RHIZOH_PET_SPATIAL_BINDING_V0.md`](RHIZOH_PET_SPATIAL_BINDING_V0.md) — Cesium entity, WGS84 from RCAL.

---

## Kilit

```text
Subject layer v0 — dünya içinde yaşayan özne (SCR validation entity)
```
