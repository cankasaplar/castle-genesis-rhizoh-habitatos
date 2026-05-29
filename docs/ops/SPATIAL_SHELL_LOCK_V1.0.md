# Spatial Shell Lock v1.0

**Tag:** `CORE-ELIGIBLE` · **Status:** stabilization SSOT (main branch)  
**Purpose:** Lock gateway + map + halo behavior; isolate debug/research nodes behind explicit feature flags.

---

## Frozen surface (main)

| Component | Path | Behavior |
|-----------|------|----------|
| Entry router | `AppRhizoh528.jsx` | `VITE_WORLD_LAYER=1` → `RhizohSpatialWorldShell`; else text `RhizohLivingWorldEntryShell` |
| Spatial shell | `RhizohSpatialWorldShell.jsx` | Cesium full-screen + product bar + halo + drawer |
| Map | `CesiumRealMapLayer.jsx` | Loads when world layer on; **not** gated on gateway phase |
| Product bar | `UnifiedProductShellBar` | World / Hall / Green Room / Broadcast / Studio / Profile |
| Halo | `RhizohCapabilityHaloV1` | Default open; prefs in `rhizohSpatialUiPreferencesV0.js` |
| Gateway | `castleFlightConfig.js` | Default cloud: `castle-genesis-rhizoh-habitatos.onrender.com` |
| Live mesh | `startGreenRoomPresenceMesh()` | Only when gateway connected + Hall/Green Room/Broadcast surface |

Prefs SSOT: `apps/client/src/rhizoh/spatial/rhizohSpatialUiPreferencesV0.js` (localStorage key `rhizoh.spatial.ui.prefs.v0.2`).

---

## Debug node isolation

Research overlays (Kadıköy/Barcelona satellite registry, sovereign onboarding, epistemic graph) **must not** activate from `VITE_DEBUG=1` alone in dev.

Gate: `castleDebugGateV0.js` — membrane flags in `CASTLE_PRODUCTION_MEMBRANE_FLAGS_V0` require **explicit granular `=1`** even in DEV.

| Flag | Default (product) |
|------|-------------------|
| `VITE_DEBUG` | `0` |
| `VITE_SATELLITE_NODE_REGISTRY_V0` | `0` |
| `VITE_SOVEREIGN_NODE_ONBOARDING` | `0` |
| `VITE_EPISTEMIC_GRAPH_VIZ_V0` | `0` |

Setup script: `scripts/setup-rhizoh-spatial-dev.ps1`  
Dev command: `npm run dev:spatial`

---

## rhizoh.com (spatial track)

Production today: `VITE_WORLD_LAYER=false` (Genesis-first text shell).

To enable spatial shell on rhizoh.com without T0 monolith:

1. GitHub Actions → `deploy_track` = **`spatial-main`**
2. Set secret or build env: **`VITE_WORLD_LAYER=1`**
3. Gateway + Firebase secrets per [`apps/client/.env.production.example`](../../apps/client/.env.production.example)

For full T0 monolith deploy, use [`T0_INTERFACE_LOCK_V1.0.md`](./T0_INTERFACE_LOCK_V1.0.md).

---

## Regression guard

- Tests: `rhizoh/spatial/__tests__/rhizohSpatialUiPreferencesV0.test.js`, `rhizohProductShellBridgeV0.test.js`
- Debug gate: `rhizoh/runtime/__tests__/castleDebugGateV0.test.js`
- Deploy matrix row: [`apps/client/docs/DEPLOY_MATRIX_V1.0.md`](../../apps/client/docs/DEPLOY_MATRIX_V1.0.md) § T0 / spatial tracks

**Do not** change frozen v562–v570 `phase*.js` without STABILIZATION graph updates.
