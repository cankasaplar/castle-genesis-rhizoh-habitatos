# Rhizoh Daily / Async Match Schema v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Priority:** P1 — immediately after WebSocket matchmaking layer  
**Parent:** [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md)

---

## 0. SSOT sentence

> Daily matches are **ASYNC mode sessions** with deadline-driven turn authority — not a separate product.

Build **after** WebSocket matchmaking spine is stable.

---

## 1. Time model

```text
playerTurnDeadline = lastMoveAt + turnBudgetMs

if now > playerTurnDeadline:
  → auto-move (if enabled) OR loss on time
```

| Mode | `turnBudgetMs` | Notes |
|------|----------------|-------|
| KINETIC | clock from session | WS stream |
| ASYNC (daily) | 86400000 (24h) | DB-persisted |

---

## 2. Minimal DB model

### MATCHES

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | session id |
| `players` | json[] | `[{userId, color, rating}]` |
| `mode` | enum | `KINETIC` \| `ASYNC` |
| `state` | enum | `ACTIVE` \| `PAUSED` \| `FINISHED` |
| `turn` | string | `white` \| `black` |
| `fen` | string | authoritative position |
| `lastMoveAt` | timestamp | server clock |
| `deadlineAt` | timestamp | async turn deadline |
| `timeControlMs` | int | base budget |
| `createdAt` | timestamp | |
| `finishedAt` | timestamp? | |

### MOVES

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `matchId` | uuid | FK → MATCHES |
| `san` | string | e.g. `Nf3` |
| `playerId` | string | |
| `timestamp` | timestamp | server authoritative |
| `seq` | int | monotonic per match |

---

## 3. Async lifecycle

```text
MATCH_SESSION_CREATED (mode=ASYNC)
  → SESSION_ACTIVE
  → [move] → deadline reset
  → SESSION_PAUSED (waiting opponent)
  → SESSION_FINISHED | timeout forfeit
```

**PAUSED** = waiting for opponent turn within deadline window (not game frozen globally).

---

## 4. Gateway integration

| Operation | Transport |
|-----------|-----------|
| Create daily match | `MATCH_SESSION_CREATED` via matchmaking |
| Submit move | `MATCH_MOVE` / HTTP fallback for offline |
| Poll state | `MATCH_STATE` push or SSE |
| Timeout job | server cron — not client |

---

## 5. CODEX hook

On `SESSION_FINISHED` with `mode=ASYNC`:

```javascript
emitCodexBusV0("match_finished_event", {
  sessionId,
  mode: "ASYNC",
  moveCount,
  durationMs,
  result
});
```

---

## Related

- [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md)
- [`schemas/rhizoh-match-session-v1.schema.json`](schemas/rhizoh-match-session-v1.schema.json)
