# Rhizoh Gateway Consolidation Night v1

**SPECFLOW:** `RESEARCH-ONLY` · `CORE-ELIGIBLE` (gateway + client transport — not frozen `phase*.js`)  
**Status:** P0 spine — in progress  
**Parent:** [`RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md`](RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md) · [`RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md`](RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md)

---

## Strategic frame

Value chain (verified bottom-up):

```text
ENGINE → TRUTH LOG → GATEWAY → BROADCAST → OBSERVATION → PRODUCT EXPERIENCE
```

Engine + truth log are **largely validated**. Bottleneck is no longer chess engine, truth reducer, or drift lane under nominal load.

**Tonight:** connection centralization — not new sports, LLMs, or product features.

> Gateway is not a game server. Gateway = event distribution spine.

---

## Gateway contract

All producers speak one envelope:

```json
{
  "eventId": "gev_…",
  "sessionId": "…",
  "worldId": "…",
  "source": "chess",
  "type": "MOVE_COMMITTED",
  "seq": 123,
  "timestamp": 1782137584,
  "payload": {},
  "delivery": {
    "commitSeq": 123,
    "recipientCount": 2,
    "delivered": 2,
    "ackCount": 2,
    "deliveryState": "acknowledged"
  }
}
```

**Sources:** `chess` · `media` · `tower` · `voice` · `scheduler` · `observer` · `gateway`

Implementation: `packages/protocol/src/gatewayEventEnvelopeV0.js`

---

## P0 deliverables (this night)

| # | Deliverable | Module | Status |
|---|-------------|--------|--------|
| 1 | Event envelope standard | `gatewayEventEnvelopeV0.js` | ✓ |
| 2 | Presence registry (unified read) | `gatewayPresenceRegistryV0.js` | ✓ |
| 3 | ACK aggregation | `matchAckAggregatorV0.js` + `MATCH_STATE_APPLIED` | ✓ |
| 4 | Observation panel wiring | `rhizohObservationStateV1.js` + transport | ✓ |
| 5 | Service registration (tower/media) | `BROADCAST_REGISTER` + `gatewayServiceRegistrationV0.js` | ✓ stub |
| 6 | Media player event stream | `PLAY`/`PAUSE`/`SEEK`/`STOP`/`COMPLETE` | spec only (P1) |

---

## Presence registry

Gateway must know at a glance:

- Tower A online
- Media player online
- Chess session members
- Observer peers

**HTTP:** `GET /rhizoh/network/presence?room=…&sessionId=…`

Returns:

- `castlePeers` — castle network relay
- `matchMembers` — match session room
- `services` — tower/media/scheduler registrations

---

## ACK layer

Three states: `sent` → `delivered` → `acknowledged`

Client sends after successful projection apply:

```text
MATCH_STATE_APPLIED { sessionId, commitSeq, projectionVersion, clientConnectionId }
```

Gateway aggregates → `MATCH_BROADCAST_HEALTH` + `broadcast.ackCount` on commits.

Observation panel prefers **gateway `ackCount`** over local-only counter.

---

## Wiring diagram

```text
Chess ──MATCH_MOVE──► Gateway ──MATCH_STATE──► Clients
                         ▲                        │
                         └──MATCH_STATE_APPLIED───┘

Tower ──BROADCAST_REGISTER──► Gateway Presence Registry
Media ──BROADCAST_REGISTER──► Gateway Presence Registry
```

---

## Media player (P1 — not tonight)

Media is a state machine emitting events:

`PLAY` · `PAUSE` · `SEEK` · `STOP` · `COMPLETE`

All via gateway envelope — no private media socket.

---

## What this does NOT do

- World Router (needs presence SSOT first — this night delivers read path)
- Gateway heartbeat/tuning (after boundary failure tests)
- DATA-PLANE READY claim

---

## Related

- Archive proof: [`archive/broadcast-proof-2026-06-22/`](archive/broadcast-proof-2026-06-22/)
- Boundary tests: [`RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md`](RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md)

*Observation ≠ Execution · interpretationOnly: true*
