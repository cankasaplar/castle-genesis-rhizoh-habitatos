# T0 Interface Lock v1.0

**Tag:** `CORE-ELIGIBLE` · **Status:** lock SSOT  
**Purpose:** Freeze the last full Castle shell (swarm GPU, agent HUD, monolithic `AppRhizoh528`) for live rhizoh.com deploy and isolated dev.

| Artifact | Value |
|----------|--------|
| Commit | `8bd4ff9e6ce792e63fe3ac96875af23635ad34eb` |
| Tag | `t0-interface-v0-lock` |
| Branch | `t0-interface-lock` |
| Replaced by | `6dfe2d1` (Living World text shell) |
| Lock manifest | [`scripts/t0-interface-lock.v1.json`](../../scripts/t0-interface-lock.v1.json) |

## Anchor vs runnable tree

Commit `8bd4ff9` is the **UI anchor** (last monolithic `AppRhizoh528` before `6dfe2d1`). Genesis observatory (`a6dfa61`) added imports that need three files forward-ported from current `main`:

- `castleWorldLayerGateV0.js`
- `studioCapabilityProbeV0.js`
- `castleFlightConfig.js` (`getGenesisProtocolGatewayOrigin`)

```powershell
powershell -File scripts/apply-t0-interface-lock-patch.ps1
# or: npm run t0:patch
```

**rhizoh.com T0 deploy:** branch `t0-interface-lock` must include these forward-ports as a commit on top of `8bd4ff9`. Until then use **`spatial-main`** + GitHub secret `VITE_WORLD_LAYER=1` for hosted map + product bar on rhizoh.com.

---

## What T0 includes

- Monolithic `AppRhizoh528` (~11k lines) — Cesium, Three.js globe, ApexEngine
- GPU swarm + agent HUD
- `UnifiedProductShellBar` (World / Hall / Green Room / Broadcast / Studio / Profile)
- `RhizohCapabilityHaloV1` capability wheel
- Green Room presence mesh (when gateway connected)

**Not included by default:** Kadıköy/Barcelona research nodes — require explicit `VITE_SATELLITE_NODE_REGISTRY_V0=1` (see debug gate).

---

## Local dev (worktree)

```powershell
powershell -File scripts/run-t0-interface-worktree.ps1
cd ..\castle-t0-interface
npm install
powershell -File ..\castle\scripts\apply-t0-interface-lock-patch.ps1 -MainRoot ..\castle
powershell -File ..\castle\scripts\setup-rhizoh-t0-dev.ps1 -RepoRoot .
npm run dev -w apps/client
```

Cloud gateway — no second terminal. Local gateway: `setup-rhizoh-t0-dev.ps1 -Local`.

---

## Live verification

```bash
npm run verify:t0-live
# optional: node scripts/verify-t0-live-readiness.mjs --gateway https://YOUR-HOST.onrender.com
```

### Manual checklist (rhizoh.com)

1. Ingress → legal/cohort → **spatial shell** (not text-only genesis)
2. Full-screen map / globe
3. Bottom product bar + halo wheel
4. Gateway WS connected (Render, not localhost)
5. Agent HUD + swarm when active
6. Hall / Studio drawers open
7. Research overlays OFF unless granular flags set

---

## rhizoh.com deploy

1. GitHub → Actions → **Deploy Firebase (hosting + rules)**
2. `deploy_track` = **`t0-interface-lock`**
3. Secrets: `VITE_FIREBASE_CONFIG`, `VITE_GATEWAY_*`, `VITE_LIVE_GATEWAY_BASE`, `VITE_GATEWAY_TOKEN`, cohort allowlist
4. Env template: [`apps/client/.env.t0.example`](../../apps/client/.env.t0.example)

Build uses commit `t0-interface-lock` branch (anchor `8bd4ff9`) with `VITE_WORLD_LAYER=1`, `VITE_DEBUG=0`.

**Contrast — main spatial track:** current `main` → `RhizohSpatialWorldShell` when `VITE_WORLD_LAYER=1` (lighter restoration). Use `deploy_track=spatial-main` for that path.

---

## Relationship to stabilization track

| Track | Entry | Deploy ref |
|-------|-------|------------|
| **A — Spatial shell (main)** | `RhizohSpatialWorldShell` | `main` / default branch |
| **B — T0 lock** | Monolithic `AppRhizoh528` | `t0-interface-lock` @ `8bd4ff9` |

Both require gateway secrets and `VITE_WORLD_LAYER=1` for map visibility on rhizoh.com.

See also: [`SPATIAL_SHELL_LOCK_V1.0.md`](./SPATIAL_SHELL_LOCK_V1.0.md)
