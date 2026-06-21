# Rhizoh Match Authority Kernel v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_MATCH_AUTHORITY_LAYER_V1.md`](RHIZOH_MATCH_AUTHORITY_LAYER_V1.md) · [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md)

**Code:**
- `matchAuthorityKernelV0.js` — sequenced event state machine + commit log
- `matchStockfishValidatorBridgeV0.js` — domain validator (chess.js · Stockfish path)

---

## 0. SSOT sentence

> **WebSocket = transport · State machine = truth · Stockfish/chess.js = validator** — not alternatives, layers.

```
Client → proposeMove
WebSocket Gateway (transport only — no decisions)
Match Authority State Machine (sequence · turn · commit/reject)
Stockfish Validator Bridge (illegal move · anti-cheat heuristics)
Append-only Commit Log
Broadcast diff → clients reconcile
```

---

## 1. Layer separation

| Layer | Role | Must NOT |
|-------|------|----------|
| **WebSocket** | Event bus, ordering, reconnect | Decide, validate, commit |
| **Authority Kernel (SM)** | sequenceId, turn, transitions, commit/reject | Illegal move logic |
| **Validator Bridge** | Legal move, optional eval | Own session truth |

---

## 2. Sequenced event types

```typescript
type MatchEvent =
  | ProposeMove
  | CommitMove
  | RejectMove
  | ReconcileState
  | DriftDetected
```

---

## 3. Kernel state machine

```text
ACTIVE → PENDING_MOVE → COMMITTING → ACTIVE
              ↓ reject
           ACTIVE

ACTIVE → RECONCILING → ACTIVE
```

| State | Meaning |
|-------|---------|
| `ACTIVE` | Accepting proposals |
| `PENDING_MOVE` | Proposal validated, awaiting commit |
| `COMMITTING` | Writing commit log |
| `RECONCILING` | diff-merge in progress |

---

## 4. Correct flow (not client→accept)

```text
client → ProposeMove
kernel → validate (chess.js / Stockfish)
kernel → sequence check + turn enforcement
kernel → CommitMove OR RejectMove
commit log append (append-only)
broadcast diff (WS fan-out when gateway READY)
clients → reconcile shadow prediction
```

---

## 5. Shadow rehearsal role

Shadow is **prediction layer**, not fake truth:

| Lane | Role |
|------|------|
| Shadow | UI prediction |
| Kernel commit log | rehearsal truth |
| Server (future) | production truth |

`shadowRehearsal: true` — kernel runs full SM locally until WS server binds.

---

## 6. Commit log (event-sourced)

```json
{
  "seq": 3,
  "type": "CommitMove",
  "sessionId": "match_…",
  "san": "Nf3",
  "fen": "…",
  "kernelState": "ACTIVE",
  "atMs": 1710000000000
}
```

Append-only · monotonic `seq` · replay source for reconciliation.

---

## 7. Drift detection

```
driftScore = fenMismatch ? 0.5 : 0
           + |shadow.moveCount - committed.moveCount| / max(1, committed.moveCount + 1)

0.0–0.1  noise
0.3      pattern emergence
0.7      epistemic conflict
1.0      fork required
```

`DriftDetected` event emitted when `driftScore >= 0.7`.

---

## 8. API

```javascript
window.__rhizoh.matchmaking.kernel.proposeMove({ san: "e4", playerId: "user_a" });
window.__rhizoh.matchmaking.kernel.status();
window.__rhizoh.matchmaking.kernel.commitLog();
window.__rhizoh.matchmaking.kernel.drift();
```

---

## 9. Gateway integration (next)

WS carries `MatchEvent` envelopes only. Kernel runs **on server** in production; client kernel is shadow rehearsal until READY.

---

## Related

- [`schemas/rhizoh-match-event-v1.schema.json`](schemas/rhizoh-match-event-v1.schema.json)
- [`RHIZOH_MATCH_AUTHORITY_LAYER_V1.md`](RHIZOH_MATCH_AUTHORITY_LAYER_V1.md)
