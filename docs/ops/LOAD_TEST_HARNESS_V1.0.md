# Load Test Harness v1.0

**Status:** IMPLEMENTED (in-process coherence path)  
**Code:** `loadTestHarnessV0.js` · **CLI:** `runLoadTestHarnessV0.mjs`  
**Export:** `docs/exports/ops/load_test_harness_LATEST.json`

**System class (post B2):** *distributed bounded execution system with financial and capacity coherence constraints* — tests **consistency under distributed stress**, not raw scale claims.

---

## Pre-flight checklist

| Item | Required | Status |
|------|----------|--------|
| GCL fail-closed | Yes | `verifyLoadTestReadinessV0()` |
| Rollout cluster Redis | Yes (prod-like) | `CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS=1` |
| HTTP RL cluster-wide | No (optional gap) | Documented |
| Audit trail append-only | Yes | GCL audit stream |

```bash
CASTLE_LOAD_TEST_FORCE=1   # only if readiness fails in dev memory mode
```

---

## Scenarios

| ID | Description |
|----|-------------|
| `baseline` | 100 users (default), low simulated latency |
| `growth_ramp` | 1k → 3k → 10k step burst |
| `stress_spike` | 10k users, 3× burst multiplier |
| `chaos_injection` | Redis +200ms, 429 rate, rollout end skip |

---

## Phases (recommended order)

1. **Phase 1 — sanity:** 100 → 500 users (`--phase=all` or baseline twice)
2. **Phase 2 — structural:** growth ramp
3. **Phase 3 — failure:** chaos + stress spike

```bash
cd apps/gateway
# Prod-like (Redis required):
# REDIS_URL=... CASTLE_GCL_REQUIRE_REDIS=1 CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS=1
# CASTLE_PHASED_ROLLOUT_TIER=200 CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK=0

npm run ops:load-test
# or single scenario:
node src/ops/runLoadTestHarnessV0.mjs --scenario=baseline --users=100
node src/ops/runLoadTestHarnessV0.mjs --scenario=stress_spike --users=10000 --burst=3
```

---

## KPIs (real post-B2 metrics)

| KPI | Field | Meaning |
|-----|-------|---------|
| Rollout coherence error rate | `rolloutCoherenceErrorRate` | expected vs actual in-flight mismatch |
| GCL / rollout sync drift | `gclRolloutSyncDriftRate` | rollout slot without cost record (or reverse) |
| Capacity violation frequency | `capacityViolationsPerMin` | `phased_rollout_capacity` / min |
| Tail amplification factor | `tailAmplificationFactor` | p95/p50 latency ratio |

---

## Expected failure patterns (watch for)

1. **Soft saturation illusion** — `successRate` OK but `queueDepthMax` rising  
2. **Rollout hysteresis** — capacity free but denies continue (coherence errors)  
3. **Redis coordination lag** — cluster state correct, decisions delayed (`redisLatencyMs` chaos)

---

## Chaos env

| Variable | Default (chaos scenario) |
|----------|--------------------------|
| `CASTLE_LOAD_TEST_REDIS_LATENCY_MS` | 200 |
| `CASTLE_LOAD_TEST_PROVIDER_429_RATE` | 0.08 |
| `CASTLE_LOAD_TEST_ROLLOUT_END_SKIP_RATE` | 0.02 |
| `CASTLE_LOAD_TEST_ROLLOUT_RESERVE_FAIL_RATE` | 0 (optional) |

---

## Coordination sim (no Docker / no Redis binary)

```bash
CASTLE_COORDINATION_SIM=1 npm run ops:load-test:sim
```

See `FAKE_VS_REAL_REDIS_BEHAVIOR_MAP_V1.0.md`.

---

## HTTP load (optional extension)

This harness exercises **turn path coherence** (GCL + rollout) without live OpenAI.  
For full HTTP load against `POST /rhizoh/llm`, add k6/artillery separately using same KPI scrape from `/rhizoh/ops/hardening/status`.

---

*Load test harness v1.0 — consistency under distributed stress.*
