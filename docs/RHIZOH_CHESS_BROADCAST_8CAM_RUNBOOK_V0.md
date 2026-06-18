# Rhizoh Chess + 8-Camera YouTube Test Broadcast Runbook v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Goal:** First unlisted YouTube test with live chess observation — OBS manual path (no in-app RTMP).

---

## Two “8-camera” systems (do not merge)

| System | What it is | UI | Stream use |
|--------|------------|-----|------------|
| **Chess cluster** | 8 simultaneous board views | `RhizohChessClusterArenaV0` | OBS browser source on rhizoh.com |
| **Octo media lab** | 8 video/map lenses | `RhizohOctoEightCameraLabV0` | Separate OBS scene (optional B-roll) |

This runbook focuses on **chess grid** as primary content for first test stream.

---

## Prerequisites

- Prod bundle with chess cluster boot (`boot.chess_cluster` in console)
- Legal hold / shadow mode active (no external execution)
- OBS Studio installed
- YouTube channel (Castle Genesis / Rhizoh)
- Optional: `ffmpeg` for offline VOD test per [CASTLE_GENESIS_YOUTUBE_TEST_BROADCAST_V0.md](CASTLE_GENESIS_YOUTUBE_TEST_BROADCAST_V0.md)

---

## Match format (featured slot 0)

| Slot | White | Black | Format |
|------|-------|-------|--------|
| 0 (featured) | RhizohAI | Stockfish MAX | Bullet / blitz research preset |
| 1–7 | Octo / Fox / self-play | mixed | Background boards |

Open arena manually during legal hold:

```js
window.__rhizoh.openLegalHoldChessArena?.()
```

---

## OBS scene layout (chess grid)

### Scene: `Rhizoh_Chess_8Board`

1. **Browser source** — primary
   - URL: `https://rhizoh.com/` (or staging) with chess cluster arena visible
   - Size: 1920×1080
   - Tip: open cluster arena full-screen in browser before capture
   - CSS custom: hide ingress overlay if needed (dev-only) or use post-ack session

2. **Audio**
   - Desktop audio OR Rhizoh voice off for first test (chess-only silent stream acceptable)

3. **Lower third** (optional)
   - Static PNG: `apps/client/public/ops/youtube-test/castle-genesis-holding-slide.png`
   - Text: `Observation ≠ Execution · Shadow Production Mode`

### Scene: `Rhizoh_Featured_1Board` (alternate simple test)

- Crop browser to slot 0 only for first minimal test

---

## YouTube Studio settings

| Field | Value |
|-------|--------|
| Visibility | **Unlisted** |
| Title | `[TEST V0] Rhizoh Chess Cluster · 8-Board Shadow Observation` |
| Description | Shadow production mode — no execution authority. rhizoh.com |
| Category | Science & Technology |

See [CASTLE_GENESIS_YOUTUBE_LIVE_SETTINGS_V0.md](CASTLE_GENESIS_YOUTUBE_LIVE_SETTINGS_V0.md) for live RTMP if upgrading from VOD to live test.

---

## Pre-stream checklist

- [ ] `window.__rhizoh.executionGovernance.externalEffectPermitted === false`
- [ ] Chess cluster running (`chessGameCluster.running`)
- [ ] Stockfish WASM loaded (not heuristic fallback only)
- [ ] Shadow ledger recording (`shadowTraceLedger.recordCount` increasing)
- [ ] OBS browser source shows 8 boards
- [ ] YouTube stream key in OBS (live) OR MP4 upload (VOD test)

---

## Post-stream compliance export

```js
window.__rhizoh.exportShadowComplianceSnapshot?.('youtube_test_broadcast')
window.__rhizoh.refreshShadowDevTools?.()
```

Archive: governance mode, ledger count, council anomaly, inflation level, graph lifecycle pass.

---

## Engine roadmap (post–3-day)

| Engine | Status | Next step |
|--------|--------|-----------|
| Stockfish 16 WASM | ✅ prod | Bump featured movetime / depth |
| LC0 / Leela | ❌ not in repo | `chessEngineRegistryV0` slot + server UCI sidecar |
| Multi-engine cluster | ❌ | `engineInstances: 1` today — second worker post-READY |

---

## Non-goals

- Automated YouTube publish from client (`youtube-publisher-bridge` not in repo)
- WAL / execution writes triggered by broadcast
- Presenting sim profiles (Nisa, etc.) as live entities
