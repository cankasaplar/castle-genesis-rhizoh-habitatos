# Rhizoh Media Player Gateway Citizenship v0

**SPECFLOW:** `CORE-ELIGIBLE` (gateway + client media lane — not frozen `phase*.js`)
**Parent:** [`RHIZOH_TOWER_GATEWAY_CITIZENSHIP_V0.md`](RHIZOH_TOWER_GATEWAY_CITIZENSHIP_V0.md) · [`CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md`](CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md)

---

## Problem

Media tube channels had **UI playback** but were not **gateway citizens**:

| Passport item | Before | After v0 |
|---------------|--------|----------|
| Presence registry | stub only | ✓ `BROADCAST_REGISTER` kind=media × N channels |
| Boot registration | — | ✓ auto on gateway WS open |
| Channel focus | — | ✓ `affirmActive` on media tube open / switch |
| Observation slice | — | ✓ `observationState.snapshot().media` |
| System report | tower + voice | ✓ `media citizenship: registered/partial/detached` |

---

## Channels registered

All rows in `listWorldSpaceMediaChannelsV0()` including **`world_sports`** (WorldSports).

Service id = channel id (`castle_genesis`, `world_sports`, `nasa`, …).

---

## WorldSports channel

| Field | Value |
|-------|--------|
| ID | `world_sports` |
| Default type | `world_sports_feed` — live scores + headlines via gateway world-feed |
| Optional VOD | `VITE_RHIZOH_WORLDSPORTS_YOUTUBE_VIDEO_ID` → YouTube embed |
| Map pin | **deferred** — next PR |

---

## Modules

| Layer | Path |
|-------|------|
| Client | `apps/client/src/rhizoh/runtime/mediaPlayerGatewayCitizenshipV0.js` |
| Channel SSOT | `worldSpaceMediaChannelsV0.js` |
| Observation | `rhizohObservationStateV1.js` → `.media` slice |
| Boot | `matchmakingConsoleV0.js` → `ensure()` after WS open |
| Media tube | `RhizohWorldSpaceMediaTubeV0.jsx` → `affirmActive` |

---

## Console

```javascript
await window.__rhizoh.mediaGateway.ensure()           // register all channels
await window.__rhizoh.mediaGateway.registerAll()      // alias
window.__rhizoh.mediaGateway.listRegistered()
window.__rhizoh.mediaGateway.listChannelIds()
window.__rhizoh.observationState.snapshot().media
```

Citizenship labels:

| `citizenship` | Meaning |
|---------------|---------|
| `detached` | 0 channels registered |
| `partial` | 1..N-1 channels registered |
| `registered` | all SSOT channels registered |

---

## Not in v0

- WorldSports **map pin** — `worldsports` on sovereign mesh (`SOVEREIGN_CORE_NODES_V0`)
- Per-channel ACK / `MEDIA_STATE_APPLIED` wire
- Ticket mesh E2E (`traceGraphIndex` mount)

*interpretationOnly: true · Observation ≠ Execution*
