# Load Test Analysis Engine v1.0 (SIM-first)

**Status:** IMPLEMENTED  
**Code:** `failureModeClassificationV0.js` · `loadTestAnalysisEngineV0.js` · `simRealDivergenceSignaturesV0.js`  
**CLI:** `runLoadTestAnalysisV0.mjs` · **SIM runner:** `runCoordinationSimLoadTestV0.mjs`  
**Redis validation (later):** `runRedisStressLoadTestV0.mjs`

---

## Architecture shift (post-lifecycle)

| Before | After |
|--------|-------|
| Count slots | **Own** slots (leaseId) |
| Capacity system | **Ownership** system |

**Layers today**

| Layer | Status |
|-------|--------|
| GCL (financial) | Stable |
| Rollout (execution) | Lease-consistent |
| Lifecycle | TTL reconcile + guaranteed release |
| Failure modes | Cleanup / TTL / ZSET / contention |

---

## Classification IDs

| ID | Meaning |
|----|---------|
| `soft_saturation_illusion` | High success + queue growth |
| `rollout_hysteresis` | Capacity deny / stuck in-flight |
| `redis_coordination_lag` | Redis latency + coherence stress |
| `gcl_rollout_sync_drift` | GCL vs rollout mismatch |
| `redis_zset_lease_pressure` | trackedLeases >> activeTurns |
| `ttl_reconcile_latency_coupling` | Short TTL vs long run |
| `lifecycle_reconcile_recovery` | Reconcile purged orphans |
| `cross_instance_lease_contention` | Low-confidence race signal |

---

## Commands

```bash
cd apps/gateway

# Analyze last harness export
npm run ops:load-test:analyze
# → docs/exports/ops/load_test_analysis_LATEST.json

# Prod-like Redis stress (Redis must be up)
npm run ops:redis-stress
```

---

## Outputs

| Artifact | Description |
|----------|-------------|
| `load_test_analysis_LATEST.json` | Classifier + `systemHealthIntelligence` + `divergence` |
| `load_test_sim_analysis_LATEST.md` | Markdown verdict |
| `sim_real_divergence_LATEST.json` | SIM vs REAL signature extraction |

## Revised priority

1. **SIM analysis** — `ops:load-test:analyze` or bundled in `ops:load-test:sim`
2. **Fix dominant SIM pattern** — from `dominantFailureMode`
3. **Redis stress** — validation layer only (`ops:redis-stress`)
4. **HTTP RL (B3)** — optimization

---

*Analysis engine v1.0 — system health intelligence from ownership-era metrics.*
