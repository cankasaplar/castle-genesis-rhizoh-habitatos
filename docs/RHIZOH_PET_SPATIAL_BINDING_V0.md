# Rhizoh Pet Spatial Binding v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modüller:** `rhizohPetSpatialGeoV0.js` · `rhizohPetCesiumSpatialBindingV0.js`

---

## Kilit cümle

```text
Engine produces world
SCR synchronizes world
UI displays world
Pet makes world spatially inhabited
WAL makes world temporally real
```

---

## Pipeline

```text
RCAL focus_lock (xy)
   ↓
Pet citizen (SCR read-only, owns_state: false)
   ↓
WGS84 cartographic (Istanbul bootstrap window)
   ↓
Cesium entity rhizoh-pet-citizen-v0 (CallbackProperty ← T0 breathe)
   ↓
WAL pet_citizen.cartographic
```

| Kaynak | Yasak |
|--------|--------|
| Local pet clock | ❌ |
| Independent Cesium tick | ❌ |
| RSBL/SCR breathe + intensity | ✅ |

---

## SSOT

```javascript
window.__rhizoh.petSpatialBinding
// { cesium_bound, cartographic: { lat, lon, heightM }, coherence_id }
```

Events: `rhizoh:pet-spatial-binding-v0` · `rhizoh:pet-citizen-v0`

CSS fallback marker hidden when `cesium_bound === true`.

---

## Sıra

1. ✅ Pet spatial (Cesium)  
2. ⏳ B2+ WAL IndexedDB  
3. ⏳ Studio deep binding  
