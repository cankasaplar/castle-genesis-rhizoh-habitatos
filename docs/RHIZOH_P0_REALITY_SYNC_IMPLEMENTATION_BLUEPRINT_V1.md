# P0 Reality Sync Layer — Implementation Blueprint v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_PRODUCT_LAYER_UNLOCK_MAP_V1.md`](RHIZOH_PRODUCT_LAYER_UNLOCK_MAP_V1.md) · [`RHIZOH_MATCH_BROADCAST_LAYER_V0.md`](RHIZOH_MATCH_BROADCAST_LAYER_V0.md)

---

## SSOT sentence

> **P0 = Reality Projection Layer** — state exists but must be **spatialized** across participants.

Not “broadcast only” — four parts:

| # | Component | Module |
|---|-----------|--------|
| 1 | Session router | `matchIngressSessionRouterV0.js` |
| 2 | State projection engine | `matchTruthUiProjectionV0.js` |
| 3 | Fan-out transport | `matchmakingBroadcastTransportV0.js` + gateway room |
| 4 | Client binding | `matchSessionSyncBridgeV0.js` + `chessRealitySyncAdapterV0.js` |

---

## Correct architecture (UI = projection only)

```text
WRONG (today before wire-up):
  UI → chess.js.tryMove() → local authoritative state

RIGHT (P0):
  UI → chess.js input check (probe only)
     → proposeMove → gateway
     → MATCH_STATE fan-out
     → truthKernel COMMIT
     → projectMatchTruthToUiV0()
     → UI render from committed FEN
```

**chess.js** = input validator · **truth kernel** = SSOT · **gateway** = sole commit writer

---

## WebSocket event schema (P0 minimum)

| Message | Direction | Payload |
|---------|-----------|---------|
| `MATCH_SESSION_JOIN` | C→G | `{ sessionId, role, playerId }` |
| `MATCH_SESSION_PRESENCE` | G→room | `{ members[], count }` |
| `MATCH_MOVE` | C→G | `{ sessionId, san, playerId }` |
| `MATCH_MOVE_ACK` | G→room | `{ fen, turn, serverSeq, commitAuthority: "server" }` |
| `MATCH_STATE` | G→room | `{ fen, turn, moveCount, serverSeq, lastSan }` |

Go-ready extension (not wired):

```json
{ "gameType": "go", "gtp": "B16", "playerId": "p1" }
```

Transport: `matchGameTransportV0.js` (`gameType` router).

---

## Module map

| Module | Role |
|--------|------|
| `matchIngressSessionRouterV0.js` | Parse `/match/:id`, build share URL |
| `matchSessionSyncBridgeV0.js` | Join · bind · emit `MATCH_REALITY_SYNC_STATE` |
| `matchTruthUiProjectionV0.js` | `truthKernel` → `{ fen, turn, serverSeq }` |
| `matchGameTransportV0.js` | Go-ready `proposeMatchGameMoveV0` |
| `chessRealitySyncAdapterV0.js` | Chess input check + propose + board reload |
| `matchmakingBroadcastE2eVerifyV0.js` | `verifyBroadcastE2e()` harness |
| `matchmakingGatewayWsV0.js` | WS registry (no manual `ws`) |

---

## Console API

```javascript
// Auto-start from URL: https://rhizoh.com/match/{sessionId}?role=player&playerId=you
await window.__rhizoh.matchSessionSyncApi.autoStartFromLocation()

// Manual
await window.__rhizoh.matchSessionSyncApi.start({
  sessionId: "sess_…",
  role: "player",
  playerId: "you"
})

// Share link
window.__rhizoh.matchSessionSyncApi.buildShareUrl({ sessionId: "…" })

// Reality probe (truth + sync + gateway WS)
window.__rhizoh.matchmaking.realityStatus()
window.__rhizoh.matchSessionSyncApi.realityStatus()

// Verify projection chain (no live WS required)
await window.__rhizoh.matchmaking.verifyBroadcastE2e({ reset: true })
```

---

## Two-tab test runbook

1. Tab A: open chess arena · DevTools:
   ```javascript
   const s = await window.__rhizoh.matchSessionSyncApi.start({ playerId: "a", role: "player" })
   console.log(s.shareUrl)
   ```
2. Tab B: open `shareUrl` (or `/match/{sessionId}`)
3. Tab A: move on board (reality sync active → proposes only)
4. Tab B: board updates from `MATCH_STATE` projection
5. Both:
   ```javascript
   window.__rhizoh.matchmaking.realityStatus().fen
   // or
   window.__rhizoh.matchSessionSync?.projection?.fen
   // starting position (before any server commit):
   window.__rhizoh.matchmaking.truthStatus().activeSession?.committed?.fen
   ```
   → **same FEN**

---

## Success criteria (P0 closed)

- [ ] `verifyBroadcastE2e({ reset: true })` → `ok: true`
- [ ] Two live tabs → same FEN after move
- [ ] Chess UI does not authoritative-commit locally when sync active
- [ ] `/match/:id` auto-joins on boot
- [ ] `phasesMissingUntilLive` empty after live e2e proof

---

## Go 48h path (after P0 on chess)

1. P0 chess multiplayer proof (this blueprint)
2. `goRulesEngineV0.js` + gateway `gameType` switch
3. `RhizohGoArenaWorkspaceV0` — same bridge, GTP moves
4. No new transport layer

---

## CI

```bash
npm run test -w apps/client -- --run src/rhizoh/runtime/__tests__/matchmakingBroadcastE2eVerifyV0.test.js
```

---

*RESEARCH-ONLY — does not extend frozen core.*
