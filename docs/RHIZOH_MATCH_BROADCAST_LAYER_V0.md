# Rhizoh Match Broadcast Layer v0 (P0)

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_PRODUCTIZATION_PHASE_GATE_V0.1.md`](academic/RHIZOH_PRODUCTIZATION_PHASE_GATE_V0.1.md)

---

## SSOT sentence

> **Rhizoh is already a working epistemic kernel — but not yet a shared world until truth propagates.**

P0 closes: `phasesMissingUntilLive: live_gateway_ws_transport`, `broadcast_to_all_clients` → **session-scoped** `broadcast_to_session_members`.

---

## Architecture

```text
Client A (simulator)                Gateway (finalizer)              Client B (observer)
     │                                      │                                │
     ├─ MATCH_SESSION_JOIN ───────────────►│◄──────── MATCH_SESSION_JOIN ───┤
     ├─ ProposeMove → TRUTH_LOG_PREVIEW      │                                │
     ├─ MATCH_MOVE ───────────────────────►│ validate → commit              │
     │                                      ├─ MATCH_MOVE_ACK ───────────────►│
     │                                      ├─ MATCH_STATE (world projection)►│
     │◄─────────────────────────────────────┤                                │
     └─ applyAck / applyRemoteState         └─ fanOutMatchSessionV0           └─ same reality
```

---

## Observer routing model

| Role | `role` value | May propose | Sees |
|------|--------------|-------------|------|
| Player | `player` | yes (`MATCH_MOVE`) | full session state |
| Observer | `observer` | no | broadcast state |
| AI node | `ai_node` | shadow only (future) | broadcast state |

Visibility = **session room membership** on gateway (`matchBroadcastRoomV0.js`).

---

## Protocol messages

| Message | Direction | Purpose |
|---------|-----------|---------|
| `MATCH_SESSION_JOIN` | client → gateway | enter session room + role |
| `MATCH_SESSION_PRESENCE` | gateway → room | roster / visibility graph |
| `MATCH_MOVE` | client → gateway | proposal transport |
| `MATCH_MOVE_ACK` | gateway → room | authoritative commit |
| `MATCH_STATE` | gateway → room | world state projection |

---

## Code map

| Component | Path |
|-----------|------|
| Session room + fan-out | `apps/gateway/src/rhizoh/matchBroadcastRoomV0.js` |
| Commit + broadcast | `apps/gateway/src/rhizoh/matchMoveAuthorityV0.js` |
| Client transport | `apps/client/src/rhizoh/runtime/matchmakingBroadcastTransportV0.js` |
| World projection | `apps/client/src/rhizoh/runtime/matchmakingWorldProjectionV0.js` |

---

## Console API

**Do not pass a bare `ws` variable** — it is not a global. Use the helpers below (they reuse or open the gateway socket for you).

### One-liner (recommended)

```javascript
await window.__rhizoh.matchBroadcast.quickStart({
  playerId: "you",
  proposeFirstMove: true
})
```

### Step by step

```javascript
await window.__rhizoh.matchBroadcast.connect()
await window.__rhizoh.matchBroadcast.joinSession({ sessionId: "…", role: "player", playerId: "you" })
await window.__rhizoh.matchBroadcast.proposeMove({ sessionId: "…", san: "e4", playerId: "you" })
window.__rhizoh.matchBroadcast.bind({
  ws: window.__rhizoh.matchBroadcast.getWs(),
  sessionId: "…",
  onState: (s) => console.log("[MATCH_STATE]", s),
  onPresence: (p) => console.log("[PRESENCE]", p),
  onAck: (a) => console.log("[ACK]", a)
})
```

### Low-level (advanced — you supply an open `WebSocket`)

```javascript
const ws = window.__rhizoh.matchBroadcast.getWs()
window.__rhizoh.matchBroadcast.join(ws, { sessionId, role: "player", playerId })
window.__rhizoh.matchBroadcast.propose(ws, { sessionId, san: "e4", playerId })
```

`wsStatus()` and `window.__rhizoh.matchGatewayWs` expose connection readiness without opening DevTools globals in production.

---

## What P0 does NOT include (P1+)

- Tower / world router isolation
- Cross-session mesh
- Guaranteed delivery / CRDT merge
- Media timeline events

**Observation layer (P0.1):** [`RHIZOH_PRODUCTION_OBSERVATION_LAYER_V1.md`](RHIZOH_PRODUCTION_OBSERVATION_LAYER_V1.md) · closure [`RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md`](RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md) · `?proof=1` overlay

---

*RESEARCH-ONLY — no frozen `phase*.js` changes.*
