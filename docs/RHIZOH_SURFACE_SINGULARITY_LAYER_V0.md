# Rhizoh Surface Singularity Layer (SSL) v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohSurfaceSingularityLayerV0.js`

---

## Problem

RSBL mapping var; yüzeyler hâlâ **ayrı runtime** gibi davranabiliyor (Cesium epistemic sim, Cap Wheel local pulse, drawer local state).

**Kırılma:** Single cognition · single time · single collapse — **multiple surfaces**.

---

## Çözüm

```text
T0 Unified Frame (single now)
        ↓
      RSBL (mapping)
        ↓
      SSL (enforcement)
        ↓
ALL SURFACES = projection endpoints only
```

| Kural | Açıklama |
|-------|----------|
| Tek NOW SOURCE | `window.__rhizoh.t0UnifiedFrame` (= `presenceFrame`) |
| Surface isolation yasak | Local clock / ayrı timeline → violation ring |
| Surface identity yok | Cesium/Studio/Drawer/Pet = projection only |

---

## Surface endpoints

| ID | Rol |
|----|-----|
| `t0_strip` | truth strip |
| `cesium` / `globe_three` | world projection |
| `cap_wheel` | tool_lens |
| `ui_drawer` | drawer projection |
| `studio` | output factory surface |
| `pet` | moving RCAL node (world_projection) |

---

## SSOT

```javascript
window.__rhizoh.surfaceSingularity
window.__rhizoh.t0UnifiedFrame          // alias
window.__rhizoh.surfaceSingularityAuthority
// { now_source: "t0_unified_presence_frame", isolation_forbidden: true }
```

Event: `rhizoh:surface-singularity-v0`  
React: `useRhizohSurfaceSingularityV0(surfaceId)` (legacy) · **`useSurfaceCitizenProjectionV0`** (SCR canonical)

Cesium: `applyEpistemicSimToCesiumSceneV0` — SCR/RSBL active → T0 atmosphere wins.

---

## Kilit

```text
Tek bilinç → tek dünya yüzeyi → farklı projeksiyonlar
```
