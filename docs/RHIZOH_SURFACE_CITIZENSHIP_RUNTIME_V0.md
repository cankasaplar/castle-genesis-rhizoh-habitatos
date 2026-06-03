# Rhizoh Surface Citizenship Runtime (SCR) v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohSurfaceCitizenshipRuntimeV0.js`

---

## Problem

SSL **contract** verir; UI hâlâ kendi küçük `now`'larını üretebilir (external pulse, local world tick).

**Kırılma:** Spatial citizenship unity yok — mapping var, vatandaşlık yok.

---

## Reverse ownership rule

```text
❌ UI state üretmez (temporal)
✔ UI sadece projection tüketir

T0 Frame → RSBL → SSL → SCR → UI surface
```

| Yasak | İzin (chrome) |
|-------|----------------|
| Local clock | open / hover / focus / navigate |
| External pulse override | — |
| Local world tick | — |
| Session timeline as truth | — |

---

## Stack

```text
MCIB → … → RESL → RAR → Studio pack
                ↓
              RSBL (mapping)
                ↓
              SSL (enforcement)
                ↓
              SCR (execution substrate)  ← UI reads here
                ↓
        Cap Wheel · Drawer · Cesium · …
                ↓
         T0 Unified Frame
```

---

## API

| Fonksiyon | Rol |
|-----------|-----|
| `publishSurfaceCitizenshipV0` | SSL sonrası citizen manifest |
| `readCitizenProjectionV0` | **Tek** UI temporal read path |
| `assertReverseOwnershipV0` | Violation guard |
| `readCapWheelCitizenPulseV0` | Cap Wheel breathe |
| `readCesiumCitizenProjectionV0` | Cesium atmosphere |

React: `useSurfaceCitizenProjectionV0(surfaceId)`

---

## SSOT

```javascript
window.__rhizoh.surfaceCitizenship
window.__rhizoh.surfaceCitizenshipAuthority
// { reverse: true, projection_only: true, … }
```

Event: `rhizoh:surface-citizenship-v0`

---

## Sıra (önerilen)

1. **SCR** — UI citizenship ✅ B3 swarm/studio  
2. **C — Pet runtime** — SCR validation entity — [`RHIZOH_PET_CITIZEN_RUNTIME_V0.md`](RHIZOH_PET_CITIZEN_RUNTIME_V0.md)  
3. **B2+ — WAL persistence** — IndexedDB  

---

## B3 surfaces (completion)

| Surface | SCR citizen |
|---------|-------------|
| Cap Wheel | ✅ |
| Drawer | ✅ |
| Cesium | ✅ |
| Swarm / collective | ✅ `swarm` |
| Studio panels | ✅ `studio` + `studio_panel` |
| Pet | ✅ citizen runtime (C) |

Temporal visuals: `useScrCitizenCollectiveFieldV0` — **not** `visualCognitionState.collectiveField`.

---

## Kilit

```text
Her UI bir feature değil, T0 zamanının vatandaşıdır.
```
