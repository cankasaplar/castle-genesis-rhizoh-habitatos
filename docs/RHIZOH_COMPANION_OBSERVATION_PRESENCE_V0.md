# Companion observation presence v0

**SPECFLOW:** `RESEARCH-ONLY` — observation-first companion; frozen core untouched.

Aligned with [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md): *Agents may influence interpretation, never execution.*

## Stack order

```
World
  ↓
Camera (observation field)
  ↓
Companion (lives where you look)
  ↓
Castle (optional — continuity archive)
```

## Three roles (not one)

| Concept | Role | SSOT |
|---------|------|------|
| **Nexus** | User ↔ world connection | `__CASTLE_NEXUS_GEO__`, world observation |
| **Companion** | Lives in observation field | `__CASTLE_PWE__` + `__RHIZOH_COMPANION_PRESENCE__` |
| **Castle** | Memories, habits, items, records | `castleLink` on PWE when user creates anchor |

Castle is **not** Companion’s home. Castle is where observations **accumulate**.

## Presence model

```javascript
presence: {
  kind: "observer_follow",
  mode: "camera",
  state: "observing",   // PWE truth: observing | following | sleeping | exploring | training
  observable: true,      // link-layer: camera open + map active
  cameraOpen: true,
  dormancy: "active",    // link-layer only: active | waiting | dormant (not presence.state)
  camera: { lat, lon, heightM }  // frustum center (primary)
}

projection: {
  primary: "camera",
  secondary: "map_pin"   // anchor.lat/lon — secondary only
}
```

| Camera / map | Companion |
|--------------|-----------|
| Map active + Cesium ready + `getCameraGeo()` | **observable** — render at camera center |
| Map hidden or Cesium off | **waiting** / **dormant** — dormancy overlay only; **does not** set `state: sleeping` |

### Dormancy UI vs presence.state

| Layer | Meaning |
|-------|---------|
| `dormancy` + overlay | “Gözlemlenmiyor” / “Bekliyor” — presentation when camera closed |
| `presence.state: sleeping` | Intentional PWE truth — user/studio sets explicitly |

## UI (v0.1)

| Component | Role |
|-----------|------|
| `CompanionDormancyOverlayV0` | Read-only overlay from `__RHIZOH_COMPANION_PRESENCE__` |
| `CompanionTimelinePanelV0` | `buildCompanionTimelineV0(eventLog)` |
| Studio presence.state select | `patchCastlePwePresenceStateV0` |

User mental model: **Companion is where you are looking**, not “which coordinate did I spawn?”

## Boot without castle

1. `WorldObservationGateV0` — world + optional location  
2. `spawnObservationCompanionV0` — Shane (`castle_companion`), `castleLink.bound: false`  
3. Later: `CastleInitiationGateV0` — binds `castleLink`, adds map anchor as archive center  

## Code map

| Module | Purpose |
|--------|---------|
| `castleCompanionObservationPresenceV0.js` | Camera tick, `__RHIZOH_COMPANION_PRESENCE__` |
| `castlePersistentWorldEntityV0.js` | PWE truth + presence + projection + castleLink |
| `CesiumRealMapLayer.jsx` | Installs observation presence bridge |
| `rhizohPetCesiumSpatialBindingV0.js` | Renders when `observable` |

## Observer console

```javascript
window.__RHIZOH_COMPANION_PRESENCE__  // live presence snap
window.__CASTLE_PWE__                   // entity + state + castleLink
```

## Render note

Full GLB (`asset://castle/pet/shane-core.glb`) remains contract ref; Cesium may still use point/billboard until asset load. **State survives render failure** — PWE on disk is truth.
