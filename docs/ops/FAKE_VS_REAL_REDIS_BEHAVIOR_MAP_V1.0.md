# Fake vs Real Redis — Behavior Map v1.0

**Coordination sim:** `CASTLE_COORDINATION_SIM=1` · `inMemoryRedisCoordinationV0.js`  
**Analysis:** `loadTestAnalysisEngineV0.js` · **Divergence export:** `sim_real_divergence_LATEST.json`

---

## Commands (priority order)

```bash
cd apps/gateway

# 1. SIM load + analysis (no Docker)
npm run ops:load-test:sim

# 2. Re-analyze existing harness export
npm run ops:load-test:analyze
```

**Outputs**

| File | Content |
|------|---------|
| `load_test_analysis_LATEST.json` | Pattern classifier + health intelligence |
| `load_test_sim_analysis_LATEST.md` | Human-readable verdict |
| `sim_real_divergence_LATEST.json` | SIM vs REAL signature extraction |

---

## Divergence signatures (code-defined)

| Signature ID | SIM | REAL |
|--------------|-----|------|
| `queue_growth_vs_success` | high_fidelity | high_fidelity |
| `rollout_inflight_leak` | pre_reconcile_visible | pre_reconcile_visible |
| `redis_coordination_lag` | sim_injected_latency_only | network_tcp_plus_zset_race |
| `redis_zset_lease_pressure` | skew_metric_approximate | true_multi_instance_zset_card |
| `cross_instance_lease_contention` | not_observable | rare_but_real |
| `gcl_rollout_sync_drift` | high_fidelity | high_fidelity |
| `lifecycle_reconcile_recovery` | high_fidelity | high_fidelity |

---

## SIM-reliable patterns (sign-off without Redis)

- `soft_saturation_illusion`
- `rollout_hysteresis`
- `gcl_rollout_sync_drift`
- `lifecycle_reconcile_recovery`
- `ttl_reconcile_latency_coupling`

## REAL validation only (Phase 3)

- `redis_coordination_lag` (true network)
- `redis_zset_lease_pressure` (distributed ZSET)
- `cross_instance_lease_contention`

```bash
npm run ops:redis-stress   # validation layer — Redis must be up
```

---

## Strategic truth

> Redis yok = test yapılamaz **değil**  
> Redis yok = coordination **simüle edilir** (~90% logic)  
> Redis stress = **validation layer**, not blocking SIM logic sign-off

---

*Fake vs real Redis behavior map v1.0 — aligned with analysis engine v1.*
