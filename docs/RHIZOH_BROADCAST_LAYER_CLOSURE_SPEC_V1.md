# Rhizoh Broadcast Layer Closure Spec v1

**Tag:** `RESEARCH-ONLY` · `CORE-ELIGIBLE` (gateway + client transport only — **not** frozen `phase*.js`)  
**Parent:** [`RHIZOH_PRODUCTION_OBSERVATION_LAYER_V1.md`](RHIZOH_PRODUCTION_OBSERVATION_LAYER_V1.md) · [`RHIZOH_MATCH_BROADCAST_LAYER_V0.md`](RHIZOH_MATCH_BROADCAST_LAYER_V0.md)

---

## Engineering question (only one that matters now)

> **How do we prove one `CommitMove` reached two browsers with the same `projectionVersion`?**

Not: “How do we add a new sport?”

---

## Pipeline (target)

```text
TRUTH_LOG (eventSeq)
    ↓
Gateway commit (commitSeq / serverSeq)
    ↓
Room fan-out (broadcastSeq, recipientCount, delivered)
    ↓
Client apply + ACK (ackCount)
    ↓
Projection update (projectionVersion)
    ↓
Browser A · Browser B · Observer C · AI Node D
```

---

## Parameter closure matrix

### 1. Transport (P0)

| Parameter | Required | Today | Closure |
|-----------|----------|-------|---------|
| `transport` | `websocket` | ✓ `matchmakingGatewayWsV0` | PASS |
| `fallback` | `http-poll` (match) | ✗ | P1 — document voice fallback separate |
| `sessionId` | string | ✓ | PASS |
| `connectionId` | per-tab id | ◐ | add `clientConnectionId` on join |
| `gatewayClientId` | gateway socket id | ✓ | PASS |
| `role` | `player` \| `observer` \| `ai_node` | ✓ | PASS |

**Acceptance test:**

```javascript
// gateway unit test
join(player) + join(observer) → presence.count === 2
observer proposes MATCH_MOVE → rejected or ignored
```

---

### 2. Fan-out guarantee (P0 — critical gap)

| Field | Required envelope | Today |
|-------|-------------------|-------|
| `commitSeq` | on every ACK/STATE | ✓ `serverSeq` |
| `broadcastSeq` | per fan-out | ✗ — use `commitSeq` alias v1 |
| `recipientCount` | room size at send | ◐ `presence.count` |
| `delivered` | sockets written | ✓ `fanOutMatchSessionV0` |
| `ackCount` | clients confirmed | ✗ |

**Target gateway payload** (append to `MATCH_MOVE_ACK` / `MATCH_STATE` meta):

```json
{
  "broadcast": {
    "commitSeq": 142,
    "broadcastSeq": 142,
    "recipientCount": 2,
    "delivered": 2,
    "ackCount": null,
    "interpretationOnly": true
  }
}
```

**Acceptance test:**

```javascript
// apps/gateway/src/__tests__/matchBroadcastRoomV0.test.js
2 sockets in room → fanOut → delivered === 2
1 socket closed → delivered === 1, retry queue has 1 entry
```

**Client ACK (new message — P0.5):**

`MATCH_STATE_APPLIED` · client → gateway · `{ sessionId, commitSeq, projectionVersion, clientConnectionId }`

Gateway aggregates → `ackCount` on next presence or dedicated `MATCH_BROADCAST_HEALTH`.

---

### 3. Projection versioning (P0)

| Field | v1 rule |
|-------|---------|
| `eventSeq` | truth log length after reducer |
| `commitSeq` | `serverSeq` from gateway |
| `projectionVersion` | `commitSeq` until independent counter needed |
| `snapshotVersion` | floor(`eventSeq / 100`) — P1 |

**Acceptance test:**

```javascript
// client
after ACK: projectionVersion === commitSeq
replay from offset: eventSeq monotonic
```

---

### 4. Presence protocol (P0.5)

| Event | Direction | Status |
|-------|-----------|--------|
| `JOIN` | client → gateway | ✓ `MATCH_SESSION_JOIN` |
| `PRESENCE` | gateway → room | ✓ `MATCH_SESSION_PRESENCE` |
| `LEAVE` | on socket close | ◐ implicit |
| `TIMEOUT` | heartbeat miss | ✗ P1 |
| `RECONNECT` | resume + tail | ✗ P0.5 SNAPSHOT+TAIL |

**Acceptance:** leave removes member from next `recipientCount`.

---

### 5. Truth snapshot recovery (P0.5)

Late join must **not** replay 1M events.

```text
MATCH_SNAPSHOT { snapshotVersion, commitSeq, fen, projectionVersion }
+
MATCH_TAIL { events from commitSeq+1 }
```

**Acceptance:** client joining at commit 5000 receives snapshot ≤ 1 RTT, then ≤ 20 tail events.

---

### 6. Drift-aware broadcast (P0)

Wire events (not only client-local):

| Type | Broadcast |
|------|-----------|
| `CommitMove` / `MATCH_STATE` | ✓ |
| `DRIFT_DETECTED` | ◐ client only → wire P0.5 |
| `RECONCILIATION_STARTED` | ◐ |
| `RECONCILIATION_COMPLETE` | ◐ |

**Acceptance:** paper contribution visible in session timeline UI.

---

## Six metrics → implementation map

| Metric | Computed from |
|--------|----------------|
| commitSeq integrity | gateway session `serverSeq` monotonic |
| broadcastSeq coverage | `broadcastSeq` present on every commit |
| ackRate | `ackCount / recipientCount` |
| projectionConsistencyScore | `hash(fenA) === hash(fenB)` |
| snapshotReconciliationLag | `eventSeq - client.eventSeq` on join |
| driftRate | `driftEvents / commitSeq` rolling window |

Exposed via `window.__rhizoh.observationState.snapshot()`.

---

## DATA-PLANE READY checklist

| # | Criterion | Owner |
|---|-----------|-------|
| 1 | WS transport stable 5 min session | client + gateway |
| 2 | Fan-out `delivered === recipientCount` (open sockets) | gateway |
| 3 | `ackRate === 1` for 2-tab demo | gateway + client ACK |
| 4 | `projectionConsistency` true on proof panel | observation UI |
| 5 | SNAPSHOT+TAIL late join | gateway |
| 6 | Drift events on wire | gateway fan-out |

**Explicitly NOT in READY:** World Router · sports · media · scheduler v2.

---

## Code map (closure targets)

| Work | File |
|------|------|
| Fan-out meta | `apps/gateway/src/rhizoh/matchBroadcastRoomV0.js` |
| ACK on commit | `apps/gateway/src/rhizoh/matchMoveAuthorityV0.js` |
| Client ACK send | `apps/client/src/rhizoh/runtime/matchmakingBroadcastTransportV0.js` |
| Observation aggregate | `apps/client/src/rhizoh/runtime/rhizohObservationStateV1.js` |
| Proof UI | `apps/client/src/components/RhizohObservationProofPanelV0.jsx` |
| E2E harness | extend `matchBroadcastE2eVerifyV0` + gateway integration test |

---

## Phase alignment

```text
Phase A.1  Instrumentation + proof UI     ← this spec + observation layer v1
Phase A.2  ACK aggregation + retry       ← fan-out guarantee
Phase A.3  SNAPSHOT+TAIL                   ← late join
Phase B    World router                    ← blocked until A.3 PASS
```

*RESEARCH-ONLY until signed READY/HOLD.*
