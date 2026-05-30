# Phased Rollout Cluster v1.0 (B2)

**Status:** IMPLEMENTED · **Code:** `phasedRolloutClusterV0.js`  
**Facade:** `phasedRolloutV0.js` (re-exports)

---

## Purpose

Close **rollout drift**: concurrent in-flight cap is **cluster-wide** (Redis), aligned with GCL financial truth.

**Mühür:** Control plane tek gerçek — `active_inflight` = tüm gateway instance'ları toplamı.

---

## Redis keys

```
{CASTLE_GCL_REDIS_PREFIX}:rollout:active_inflight
{CASTLE_GCL_REDIS_PREFIX}:rollout:leases          — ZSET (leaseId → expiresAtMs)
```

**RESERVE** (Lua: purge expired → INCR + ZADD lease) / **RELEASE** (ZREM lease + DECR).  
**Reconcile:** `reconcilePhasedRolloutInflightV0()` — TTL orphan recovery.  
See `ROLLOUT_LIFECYCLE_INVARIANT_V1.0.md`.

---

## Env (GCL ile hizalı)

| Variable | Default (prod) | Meaning |
|----------|----------------|---------|
| `CASTLE_PHASED_ROLLOUT_TIER` | `off` | `50` / `200` / `1000` / `5000` |
| `CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS` | prod on | Fail-closed if Redis down |
| `CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK` | `0` prod | Dev/test only |
| `CASTLE_GCL_REQUIRE_REDIS` | inherits | Rollout require if GCL require |

---

## Wire

- `rhizohGatewayTurn` → `await beginPhasedRolloutTurnV0()` / `await endPhasedRolloutTurnV0()` (finally)
- `GET /rhizoh/ops/hardening/status` → `phasedRollout.clusterWide`, `phasedRollout.health`

---

## Errors

| Code | When |
|------|------|
| `phased_rollout_capacity` | Cluster cap full |
| `phased_rollout_unavailable` | Redis required but not connected |

---

## Remaining gap

HTTP rate limit (`castleHttpRateLimit.js`) is still **per-process** — B3 optional.

---

## Load test

[LOAD_TEST_HARNESS_V1.0.md](LOAD_TEST_HARNESS_V1.0.md) — KPIs: rollout coherence, GCL drift, capacity violations/min.

---

*Phased rollout cluster v1.0 — B2 control plane truth.*
