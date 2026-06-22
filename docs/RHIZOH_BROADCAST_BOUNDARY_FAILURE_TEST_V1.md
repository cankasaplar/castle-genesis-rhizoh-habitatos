# Rhizoh Broadcast — Boundary Failure Test V1

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** Spec / runbook — **not yet executed**  
**Prerequisite:** Nominal 2-client proof archived — [`archive/broadcast-proof-2026-06-22/`](archive/broadcast-proof-2026-06-22/)

---

## Context

### Previous hypothesis

`DRIFT_DETECTED` = reconciliation failure (primary suspect).

### New evidence (2026-06-22 visual proof)

| Signal | Value |
|--------|-------|
| `in sync` | yes |
| `drift` | none |
| `commitSeq` | aligned |
| `projectionSeq` | aligned |

**Conclusion:** Under nominal load, deterministic reconciliation **succeeds**. Drift lane is **no longer the primary suspect**.

`gateway.uncertain` correlates with elevated `driftScore` but **causality is unproven** — gateway tuning before boundary mapping risks blind optimization.

---

## Engineering priority

| Phase | Goal |
|-------|------|
| **1 — Load injection** | Force boundary failures (latency, disconnect, burst) |
| **2 — Failure classification** | Label each break: drift / projection / broadcast / duplicate / snapshot |
| **3 — Gateway tuning** | heartbeat, ack timeout, reconnect threshold — **only after** phase 1–2 |

---

## Test matrix

| Test | Status (2026-06-22) | Purpose |
|------|---------------------|---------|
| 2 client nominal | ✔ passed | Same reality under normal load |
| High move frequency | ⏳ pending | Commit queue / ordering under burst |
| Reconnect | ⏳ pending | WS drop → rejoin → catch-up |
| Tab refresh | ⏳ pending | Snapshot + projection recovery |
| 300–500 ms artificial latency | ⏳ pending | Delayed commit delivery |
| WebSocket drop | ⏳ pending | Pause mid-session → reconciliation |

### Priority scenario (must observe)

```
A move
A move
A move
network pause
B receives delayed commit
reconciliation
projection alignment
```

**Pass:** `projectionConsistency = true` after pause and catch-up.

---

## Setup

1. Deploy latest client (Firebase) + gateway (Render).
2. **Hard refresh both tabs** (`Ctrl+Shift+R`) — same JS bundle hash on host and guest.
3. `?proof=1` on both URLs.
4. `challengePeer` → shared `commitSeq: 0`, same FEN hash.
5. Record screen + export `observationState.snapshot()` before/after each stress step.

### Guest URL

```
https://rhizoh.com/match/SESSION_ID?role=player&playerId=2&proof=1
```

---

## Failure classification (phase 2)

When a test fails, record:

| Class | Indicators |
|-------|------------|
| `drift` | `drift !== none`, FEN hash mismatch |
| `projection_mismatch` | `projectionConsistency = false` |
| `missed_broadcast` | peer `commitSeq` stall while gateway advances |
| `duplicate_commit` | same `serverSeq` applied twice; inflated seq |
| `snapshot_recovery` | late-join or refresh wrong baseline |

---

## Gateway tuning (phase 3 — deferred)

Do **not** tune until boundary map exists.

Candidate parameters (after evidence):

- heartbeat interval
- ack timeout
- reconnect threshold
- retry interval

---

## Related

- Archive: [`docs/archive/broadcast-proof-2026-06-22/`](archive/broadcast-proof-2026-06-22/)
- Observation layer: [`RHIZOH_OBSERVATION_LAYER_V1.md`](RHIZOH_OBSERVATION_LAYER_V1.md)
- External boundary: [`RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md`](RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md)
