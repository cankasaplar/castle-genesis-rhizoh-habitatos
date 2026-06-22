# Rhizoh Matchmaking Core Spec v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Priority:** P0 — game requests + WebSocket matchmaking backbone  
**Parent:** [`SESSION_GRAPH_V1.md`](SESSION_GRAPH_V1.md) · [`RHIZOH_UGL_V1.md`](RHIZOH_UGL_V1.md) · [`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) · [`RHIZOH_SHADOW_DATA_PLANE_V0.md`](RHIZOH_SHADOW_DATA_PLANE_V0.md)

**Schemas:** [`schemas/rhizoh-match-beacon-v1.schema.json`](schemas/rhizoh-match-beacon-v1.schema.json) · [`schemas/rhizoh-match-session-v1.schema.json`](schemas/rhizoh-match-session-v1.schema.json) · [`schemas/rhizoh-matchmaking-ws-envelope-v1.schema.json`](schemas/rhizoh-matchmaking-ws-envelope-v1.schema.json)

**Code (shadow rehearsal):**
- `apps/client/src/rhizoh/runtime/matchmakingRuntimeSurfaceV0.js` — API ≠ engine contract boundary
- `apps/client/src/rhizoh/runtime/matchmakingConsoleV0.js` — facade publisher
- `apps/client/src/rhizoh/runtime/matchmakingBeaconRegistryV0.js`
- `apps/client/src/rhizoh/runtime/matchmakingEngineV0.js`
- `apps/client/src/rhizoh/runtime/matchSessionLifecycleV0.js`
- `apps/client/src/rhizoh/runtime/matchmakingCodexBridgeV0.js`

---

## 0.1 Contract boundary (API ≠ engine)

Shadow rehearsal exposes DevTools/console access without collapsing layers:

```text
window.__rhizoh.matchmaking          → frozen read-only facade (delegates only)
window.__rhizoh.runtimeSurface.matchmaking → mutable engine mount (sub-modules)
sessionStorage commit / beacon rows  → append-oriented truth during rehearsal
```

| Layer | Mutable? | Role |
|-------|----------|------|
| `window.__rhizoh.matchmaking` | **No** (`Object.freeze` facade) | Console API · blocks property injection |
| `runtimeSurface.matchmaking` | Yes | Engine bags (`emitBeacon`, `session`, `kernel`, …) |
| Event log / registry rows | Append + rebuild | Deterministic replay · drift detection |

**Freeze is not the security model** — reconciliation + append-only commit log is. Freeze on the facade only prevents `window` reassignment and documents that **API ≠ engine**.

---

## 0.2 Truth kernel (event-sourced reducer)

Session and kernel mutations route through a single writer:

```text
dispatch(event) → append truth log → reduce(state, event) → projection snapshot
replay(log) → deterministic rebuild (no live object mutation)
```

| Surface | Frozen? | Role |
|---------|---------|------|
| `window.__rhizoh.matchmaking` | Yes | API facade |
| `runtimeSurface.matchmaking` | Yes | Engine projection shell (`truthKernel`, `session`, …) |
| Truth log (`truth_log.v0`) | Append-only | SSOT during shadow rehearsal |
| Projection cache | Rebuildable | Derived snapshot; replay-safe |

**Code:** `matchmakingTruthKernelV0.js` · `matchSessionStateMachineV0.js`

Beacon + session + kernel events share one truth log (`BeaconEmit`, `SessionCreate`, `ProposeMove`, …).  
`runtimeSurface.matchmaking` is **frozen after publish** — not a mutable object graph.

## 0.3 Truth authority observability (honest)

Boot declares **contract** vs **effective** authority without faking gateway readiness:

| Boot phase | Meaning |
|------------|---------|
| `boot.match_authority` | `authority=server_primary` (contract) |
| `boot.truth_commit_bridge` | `mode=append_only · commitAuthority=client_shadow` until gateway |
| `boot.reconciliation` | `shadow_vs_truth enabled` |
| `boot.drift_detector` | noise / pattern / conflict thresholds |

Runtime dispatch chain (console):

```text
MATCH_EVENT_APPENDED seq=N
MATCH_EVENT_COMMITTED seq=N   (on commit paths)
MATCH_STATE_REDUCED seq=N
MATCH_STATE_RECONCILED seq=N  (on reconcile)
```

`serverAuthoritative: true` and `truthOrigin: gateway_ack` appear only after gateway READY + server ack — not during shadow rehearsal.

**Code:** `matchmakingTruthAuthorityObservabilityV0.js`

---

```javascript
Object.isFrozen(window.__rhizoh.runtimeSurface.matchmaking)  // true
window.__rhizoh.matchmaking.singleRealitySource               // "truth_log_v0"
window.__rhizoh.matchmaking.truthKernel.replay()              // rebuild from log
```

---

## 0. SSOT sentence

> **Matchmaking is a server-authoritative state machine** — not a UI event.  
> Client emits beacons · gateway indexes · engine scores · session manager owns chess state stream.

Until data-plane `READY`, all modules run in **shadow rehearsal** (`realityMutationPermitted: false`).

---

## 1. Why this is core (not polish)

Without matchmaking backbone:

| Layer | Without matchmaking |
|-------|---------------------|
| Daily matches | empty data |
| Three.js arena | decoration only |
| CODEX memory | meaningless logs |
| Behavior sediment | no repeatable game sessions |

Rhizoh already models **three time classes**:

| Class | Example | Transport |
|-------|---------|-----------|
| **KINETIC** | blitz / live PvP | WebSocket stream |
| **ASYNC** | daily turn | DB + push notification |
| **HYBRID** | beacon-based pairing | WS beacon + session fork |

All three must attach to one **Matchmaking Event Layer**.

---

## 2. Minimal architecture (real spine)

```text
Client
  ↓ MATCH_BEACON_EMIT (WS)
WebSocket Gateway (apps/gateway)
  ↓
Matchmaking Engine (server-authoritative)
  ↓
Beacon Registry (indexed by mode · TC · rating · entropy)
  ↓
Game Session Manager
  ↓
Chess State Stream (UGL / FEN deltas)
```

**Not in v1 scope:** Three.js visual mapping (see §9).

---

## 3. Beacon model

```typescript
type Beacon = {
  beaconId: string
  userId: string
  mode: "KINETIC" | "ASYNC"
  timeControlMs: number
  ratingRange?: [number, number]
  entropyTag?: number
  createdAtMs: number
  expiresAtMs: number
}
```

| Field | Role |
|-------|------|
| `mode` | KINETIC = live WS session · ASYNC = daily turn queue |
| `timeControlMs` | base time (blitz 180000 · daily 86400000) |
| `ratingRange` | optional Elo window `[min, max]` |
| `entropyTag` | habitat entropy bucket for variety matching |
| `expiresAtMs` | anti-stale beacon TTL (default 120s kinetic · 24h async) |

---

## 4. Match flow

```text
1. user emits beacon          → MATCH_BEACON_EMIT
2. system indexes beacon      → registry shard by mode+TC
3. match engine scores pairs  → compatibilityScore ∈ [0, 1]
4. opponent found OR          → MATCH_SESSION_CREATED
   AI fallback                → MATCH_AI_FALLBACK
5. session created            → lifecycle ACTIVE
6. websocket channel opened   → MATCH_MOVE / MATCH_STATE
```

### Compatibility scoring (v1)

```
score = w_mode   * modeMatch
      + w_tc     * timeControlProximity
      + w_rating * ratingOverlap
      + w_entropy* entropyDistanceInverse
      + w_fresh  * recencyBoost

defaults: w_mode=0.35, w_tc=0.25, w_rating=0.25, w_entropy=0.10, w_fresh=0.05
threshold: score >= 0.62 → pair
```

### AI fallback

When `now - beacon.createdAtMs > aiFallbackMs` (default 45s kinetic):

- Emit `MATCH_AI_FALLBACK`
- Create session with `opponentKind: "ai_stockfish"`
- Preserve UGL stream for CODEX snapshot on finish

---

## 5. Session lifecycle state machine

**Server-authoritative.** Client may only propose moves; server validates.

```text
BEACON_PENDING → MATCHING → MATCH_FOUND → SESSION_ACTIVE
                              ↓                ↓
                         SESSION_CANCELLED   SESSION_PAUSED (async only)
                                              ↓
                                         SESSION_FINISHED
```

| State | Meaning |
|-------|---------|
| `BEACON_PENDING` | Beacon registered, not yet scored |
| `MATCHING` | Engine evaluating candidates |
| `MATCH_FOUND` | Pair locked, channel opening |
| `SESSION_ACTIVE` | Moves accepted |
| `SESSION_PAUSED` | Async deadline window |
| `SESSION_FINISHED` | Terminal — CODEX snapshot eligible |
| `SESSION_CANCELLED` | User cancel or TTL expiry |

Illegal transitions are rejected server-side (not UI-gated).

---

## 6. WebSocket event protocol (v1)

Extends [`packages/protocol/src/index.js`](../packages/protocol/src/index.js) `WS_MESSAGE`.

| Message | Direction | Purpose |
|---------|-----------|---------|
| `MATCH_BEACON_EMIT` | C→S | Register match intent |
| `MATCH_BEACON_CANCEL` | C→S | Withdraw beacon |
| `MATCH_BEACON_ACK` | S→C | Indexed + TTL |
| `MATCH_SESSION_CREATED` | S→C | Pairing result + sessionId |
| `MATCH_AI_FALLBACK` | S→C | AI opponent assigned |
| `MATCH_STATE` | S→C | Authoritative FEN + clocks |
| `MATCH_MOVE` | C→S | Proposed SAN move |
| `MATCH_MOVE_ACK` | S→C | Accepted/rejected + new state |
| `MATCH_FINISHED` | S→C | Result + PGN ref |
| `MATCH_ERROR` | S→C | Rate limit / validation |

Envelope: [`rhizoh-matchmaking-ws-envelope-v1.schema.json`](schemas/rhizoh-matchmaking-ws-envelope-v1.schema.json)

**HELLO** must complete before match messages (existing gateway auth).

---

## 7. Anti-spam / rate limits

| Rule | Limit |
|------|-------|
| Beacon emit | 6 / minute / userId |
| Beacon cancel | 12 / minute |
| Move propose | 30 / minute / session |
| Re-emit after cancel | 3s cooldown |
| Max concurrent beacons | 1 per userId per mode |

Violations → `MATCH_ERROR` code `rate_limited` — no silent drop.

---

## 8. CODEX integration (light v1)

**Not** full memory write. Event snapshot only:

```text
MATCH_FINISHED
  → matchmakingCodexBridgeV0
  → emitCodexBusV0("match_finished_event", snapshot)
```

Snapshot fields: `sessionId`, `mode`, `result`, `moveCount`, `durationMs`, `entropyTag` — no PII.

Full CODEX hydration deferred until session stream is stable.

---

## 9. Three.js — explicitly last

Do **not** implement visual layer until:

1. Match state is server-stable
2. Move stream is reliable
3. Sync + async paths work

Then Three.js is **state renderer only**:

| Game signal | Visual mapping |
|-------------|----------------|
| entropy | material shader |
| tempo | animation speed |
| win streak | light intensity |
| beacon density | fog density |

---

## 10. Phase gate constraints

| Allowed now (shadow) | Blocked until READY |
|---------------------|---------------------|
| Spec + JSON schemas | Production authoritative match state |
| Client rehearsal modules | `VITE_RHIZOH_PHASE1_SIGNAL=1` in prod |
| Gateway WS message constants | Cross-castle WAL truth merge |
| Local UGL stream binding | Server-side FEN authority in prod |

See [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md).

---

## 11. Relation to meaning / sediment stack

Matchmaking produces **repeatable behavioral sessions** — the missing input for Plane E significance:

```text
match_finished → behavior sediment (dwell in arena)
              → attention sediment
              → meaning significance
```

Without live matches, `significanceScore: 0` for arenas is **honest** — see [`RHIZOH_BEHAVIOR_SEDIMENT_V0.md`](RHIZOH_BEHAVIOR_SEDIMENT_V0.md).

Sediment weight kernel (cross-session reinforcement) is a **separate track**: [`RHIZOH_SEDIMENT_WEIGHT_KERNEL_V1.md`](RHIZOH_SEDIMENT_WEIGHT_KERNEL_V1.md).

---

## 12. Implementation order

| Step | Deliverable | Status |
|------|-------------|--------|
| 1 | This spec + schemas + shadow modules | v1 |
| 2 | Gateway matchmaking handler (staging) | next |
| 3 | Daily DB schema + async deadline | [`RHIZOH_DAILY_MATCH_SCHEMA_V1.md`](RHIZOH_DAILY_MATCH_SCHEMA_V1.md) |
| 4 | Three.js state renderer | last |

---

## 13. DevTools (shadow rehearsal)

After boot you should see: `boot.matchmaking_console · shadow rehearsal armed`

Verify mount:

```javascript
window.__rhizoh?.matchmakingConsole?.mounted === true
```

```javascript
window.__rhizoh.matchmaking.emitBeacon({
  userId: "user_a",
  mode: "KINETIC",
  timeControlMs: 180000,
  ratingRange: [1200, 1400]
});

window.__rhizoh.matchmaking.emitBeacon({
  userId: "user_b",
  mode: "KINETIC",
  timeControlMs: 180000,
  ratingRange: [1250, 1450]
});

window.__rhizoh.matchmaking.tryMatch({ mode: "KINETIC" });
window.__rhizoh.matchmaking.session?.();
```

---

## Related

- [`RHIZOH_MATCH_AUTHORITY_LAYER_V1.md`](RHIZOH_MATCH_AUTHORITY_LAYER_V1.md)
- [`RHIZOH_DAILY_MATCH_SCHEMA_V1.md`](RHIZOH_DAILY_MATCH_SCHEMA_V1.md)
- [`RHIZOH_SEDIMENT_WEIGHT_KERNEL_V1.md`](RHIZOH_SEDIMENT_WEIGHT_KERNEL_V1.md)
- [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md)
