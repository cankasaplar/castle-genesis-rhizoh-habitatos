# Rhizoh Shadow Production — 3-Day Sprint Plan v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** active — legal hold lane, governance verified on prod (`index-GV2ifLCg.js`)  
**Mental model:** pre-production simulation runtime — not debug. Goal = **deterministic failure-free state transitions**, not “bug-free.”

---

## Current truth (prod-verified)

```text
execution        = OFF
simulation       = ON
persistence      = ON
external effect  = OFF
legal gate       = HARD BLOCK
```

System = **production-ready engine + closed output valve**. Correct staging.

---

## Three-layer hard separation

| Layer | Role | Writes | Blocks |
|-------|------|--------|--------|
| **Epistemic** | council, stress, graph, anomaly, lifecycle | observation truth | drift/move feedback |
| **Execution** | chess, UI, voice, gateway render | presentation only | upstream authority |
| **Legal** | switchboard, ingress, cohort | policy snapshot | external + user mutations |

Module: `rhizohHardSeparationLayerV0.js` + `rhizohInvitedUserAuthorityGateV0.js`

---

## Day 1 — Governance motor bolt + stability contract

| Block | Deliverable | Files / surfaces |
|-------|-------------|------------------|
| **C1** | Hard separation enforcement wired to switchboard | `rhizohHardSeparationLayerV0.js`, stress/council/memory gates |
| **C2** | Invited-user authority lock (graph write, council trigger, stress inject) | `rhizohInvitedUserAuthorityGateV0.js` |
| **C3** | Subject ref SSOT (sessionStorage = ingress) | `ingress_router.js`, switchboard |
| **A1** | Drawer state machine on T0 (parity with World Space) | ✅ `rhizohT0DrawerShellIntegrationV0.js`, `AppRhizoh528T0.jsx` |
| **A2** | `rhizohUiLayoutResolverV0` — z-index + bottom offset SSOT | ✅ `rhizohUiLayoutResolverV0.js`; T0 + World Space wired |
| **B1** | Stress determinism harness (same profile → same conflict graph hash) | test + export `stressRunFingerprint` |

**Exit criteria Day 1:** quarantine user cannot `injectEpistemicStress`; founder DevTools still works; `executionGovernance` unchanged on legal hold.

---

## Day 2 — Surface stability + chess strength

| Block | Surface | Action |
|-------|---------|--------|
| **A3** | **Drawer** | ✅ T0 detail ↔ product drawer coordinator (`rhizohT0DrawerCoordinatorV0.js`) |
| **A4** | **Map / pins** | Single Cesium pin owner; Leaflet fallback documented; no Sarıyer flyTo on world surface |
| **A5** | **Voice** | ✅ `RhizohConversationDockShellV0` + `conversationDock` layout SSOT (T0 + World Space) |
| **A6** | **Studio / greenroom** | Greenroom mesh gate aligned with drawer surface id; `RhizohStudioCitizenShellV0` mount order locked |
| **A7** | **Robotics academy** | Regression-only: drawer tab stable, no duplicate mount (perception alignment snapshot) |
| **B2** | **Council** | Cooldown + inflation dampening frozen in compliance export |
| **B3** | **Graph lifecycle** | Lifecycle pass fingerprint in shadow compliance snapshot |
| **Chess1** | **Engine presets** | Cluster featured slot: `STRONG`/`MAX` movetime bump (800–2000ms featured) |
| **Chess2** | **Engine registry stub** | `chessEngineRegistryV0.js` — Stockfish today, LC0 slot reserved (no weights yet) |
| **Chess3** | **8-board arena** | `RhizohChessClusterArenaV0` OBS browser-source URL documented |

**Exit criteria Day 2:** `/` ↔ `/world/space` drawer behavior deterministic; chess slot 0 visibly stronger; no drawer flicker on legal preamble.

---

## Day 3 — Broadcast test + replay lock + invited cohort

| Block | Deliverable |
|-------|-------------|
| **YT1** | 8-camera test runbook — chess grid + Octo lens lab OBS layout | `RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md` |
| **YT2** | Unlisted YouTube test: holding slide OR live chess grid capture (OBS manual) |
| **YT3** | RhizohAI vs Stockfish MAX featured match format for stream |
| **YT4** | Opponent matrix: RhizohAI / Stockfish tiers / Octo heuristic / Fox heuristic |
| **C4** | Replay fingerprint tag `interpretationOnly` in compliance export |
| **C5** | Invited cohort: server gate + engine admission wired (replace UI no-op when enforce on) |
| **C6** | Shadow prod soak checklist (3-day window, not 7–14) |

**Exit criteria Day 3:** one unlisted YouTube upload (test); compliance bundle export with governance + replay tags; invited user blocked from epistemic authority in prod.

---

## Layer-by-layer production behavior (target)

### Pin marker / map
- Cesium: `cesiumMapPinCatalogV0.js`, `cesiumMapAnchorMarkersV0.js` — single owner per session
- World Space: `VITE_RHIZOH_WORLD_SPACE_CESIUM=1` for globe; marker layer filter stable
- No execution writes from map clicks during legal hold (observation events only)

### Drawer
- One coordinator: `rhizohDrawerStateMachineV0` on T0 + World Space
- Product drawer `z-[58]`; no competing right drawer on T0

### Studio / greenroom
- Drawer tab: `RhizohStudioCitizenShellV0` — observe + sandbox interaction
- Greenroom waiting: `RhizohGreenroomWaitingPanelV0` — legal hold chess manual gate (C2)
- Mesh: start only when surface id matches `hall|greenroom|broadcast`

### Robotics academy
- Drawer domain tab — regression-only, no new L-layers
- Mount via `RhizohProductSurfaceDrawerV0` panel registry

### Chess
- Today: Stockfish 16 WASM single-thread, 8-board cluster, heuristic fallback
- Day 2: stronger featured slot presets; engine registry for future LC0
- LC0: **not in repo** — requires weights + UCI bridge (post-sprint if needed)

### YouTube / 8-camera
- **Chess 8-camera** = 8 board panels (`RhizohChessClusterArenaV0`) — OBS browser source
- **Octo 8-lens** = video lab (`RhizohOctoEightCameraLabV0`) — separate OBS scene
- No in-app RTMP; OBS manual per `CASTLE_GENESIS_YOUTUBE_LIVE_SETTINGS_V0.md`

---

## Invited users (quarantine cohort)

| Allowed | Blocked |
|---------|---------|
| system observe | graph write authority |
| UI interaction (sandbox) | council trigger authority |
| feedback events | stress injection authority |
| limited writes (feedback only) | external effects |

---

## What we are NOT doing (3-day scope)

- Frozen core `phase562–570` changes
- LC0 weights / server farm (stub only)
- In-app RTMP encoder
- Legal gate open / `VITE_RHIZOH_LIVE_READY` without signed READY

---

## Prod verification (daily)

```js
window.__rhizoh.refreshShadowDevTools?.()
console.log({
  governance: window.__rhizoh.executionGovernance,
  hardSeparation: window.__rhizoh.hardSeparation,
  quarantine: window.__rhizoh.executionGovernance?.quarantineCohort
})
```

---

## Related docs

- [RHIZOH_SHADOW_PRODUCTION_MODE_V0.md](RHIZOH_SHADOW_PRODUCTION_MODE_V0.md)
- [RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md](RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md)
- [RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md](RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md)
