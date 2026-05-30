# Load Test — System Health Intelligence

**Analyzed:** 2026-05-25T18:33:16.327Z
**Execution mode:** `dev_memory`
**Dominant pattern:** `soft_saturation_illusion`

## Verdict

degraded_under_stress_sim

## Findings

- System reports OK (high successRate) while queue depth grows — soft saturation.

## Pattern counts

- `healthy`: 1 slice(s)
- `soft_saturation_illusion`: 6 slice(s)

## SIM vs REAL divergence

- [ ] **queue_growth_vs_success** — SIM: high_fidelity | REAL: high_fidelity
- [ ] **rollout_inflight_leak** — SIM: pre_reconcile_visible | REAL: pre_reconcile_visible
- [x] **redis_coordination_lag** — SIM: sim_injected_latency_only | REAL: network_tcp_plus_zset_race
- [ ] **redis_zset_lease_pressure** — SIM: skew_metric_approximate | REAL: true_multi_instance_zset_card
- [ ] **cross_instance_lease_contention** — SIM: not_observable | REAL: rare_but_real
- [ ] **gcl_rollout_sync_drift** — SIM: high_fidelity | REAL: high_fidelity
- [ ] **lifecycle_reconcile_recovery** — SIM: high_fidelity | REAL: high_fidelity

## Priority

1. **redis_stress_validation** — real coordination truth
2. **sim_analysis_review** — compare with coordination_sim baseline
3. **http_rl_cluster_b3** — optimization