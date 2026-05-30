# Rollout Lifecycle Invariant v1.0

**Status:** IMPLEMENTED  
**Code:** `phasedRolloutClusterV0.js` (leases) · `rolloutLifecycleInvariantV0.js` (guarantee wrapper)

---

## Problem (load test diagnosis)

> Capacity control exists, but lifecycle completion is not guaranteed under stress.

- **Financial layer (GCL):** deterministic ✓  
- **Execution layer (rollout):** acquire correct, release missing under edge paths ✗  

Symptoms: `activeTurns` stays high while capacity “looks” free — distributed semaphore without guaranteed release.

---

## Invariant

1. Every successful `beginPhasedRolloutTurnV0` returns a **`leaseId`** (Redis ZSET + counter, or memory map).
2. `endPhasedRolloutTurnV0(leaseId)` is **idempotent** — ZREM lease then DECR counter.
3. **TTL reconciliation** purges expired leases and decrements counter (`reconcilePhasedRolloutInflightV0`).
4. Gateway `rhizohGatewayTurn` passes `traceId` → `leaseId` → `finally` release.

---

## Env

| Variable | Default | Meaning |
|----------|---------|---------|
| `CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS` | `120000` | Orphan slot auto-reclaim (ms) |

Load test chaos uses short TTL (`100ms`) + post-scenario reconcile.

---

## Redis keys

```
{prefix}:rollout:active_inflight   — counter
{prefix}:rollout:leases            — ZSET score=expiresAtMs, member=leaseId
```

---

## API

| Function | Role |
|----------|------|
| `beginPhasedRolloutTurnV0({ traceId })` | Reserve + lease |
| `endPhasedRolloutTurnV0(leaseId)` | Guaranteed release |
| `reconcilePhasedRolloutInflightV0()` | Timeout / crash recovery |
| `withRolloutTurnLifecycleV0(ctx, fn)` | Acquire + finally release |

---

## Priority (revized)

1. **Lifecycle integrity** (this doc) ✓  
2. Redis stress re-run  
3. Load test analysis / classification (B+C)  
4. HTTP RL cluster (B3) — secondary  

---

*Rollout lifecycle invariant v1.0 — execution correctness = state correctness.*
