/**
 * Failure mode classification v0 — post-lifecycle ownership model.
 * Maps load-test / ops metrics → system health intelligence patterns.
 */

export const FAILURE_MODE_SCHEMA_V0 = "rhizoh.failure_mode_classification.v0";

export const FAILURE_MODE_ID_V0 = Object.freeze({
  SOFT_SATURATION: "soft_saturation_illusion",
  ROLLOUT_HYSTERESIS: "rollout_hysteresis",
  REDIS_COORDINATION_LAG: "redis_coordination_lag",
  GCL_DRIFT: "gcl_rollout_sync_drift",
  ZSET_PRESSURE: "redis_zset_lease_pressure",
  TTL_RECONCILE_COUPLING: "ttl_reconcile_latency_coupling",
  LEASE_CONTENTION: "cross_instance_lease_contention",
  LIFECYCLE_RECOVERED: "lifecycle_reconcile_recovery",
  HEALTHY: "healthy"
});

/**
 * @param {Record<string, unknown>} ctx
 */
export function classifyFailureModesV0(ctx) {
  const m = ctx.metrics || {};
  const rollout = ctx.rollout || {};
  const reconcile = ctx.lifecycleReconcile || {};
  const chaos = ctx.chaos || {};
  const simMode =
    ctx.executionMode === "coordination_sim" ||
    ctx.coordinationSim === true ||
    process.env.CASTLE_COORDINATION_SIM === "1";

  const successRate = Number(m.successRate) || 0;
  const avgQueue = Number(m.avgQueueDepth) || 0;
  const queueMax = Number(m.queueDepthMax) || 0;
  const capPerMin = Number(m.capacityViolationsPerMin) || 0;
  const coherenceRate = Number(m.rolloutCoherenceErrorRate) || 0;
  const driftRate = Number(m.gclRolloutSyncDriftRate) || 0;
  const activeTurns = Number(rollout.activeTurns) || 0;
  const trackedLeases = Number(rollout.trackedLeases) || 0;
  const limit = Number(rollout.limit) || 0;
  const leaseTtlMs = Number(rollout.leaseTtlMs) || Number(ctx.leaseTtlMs) || 120_000;
  const purged = Number(reconcile.purged) || 0;
  const redisLatencyMs = Number(chaos.redisLatencyMs) || 0;
  const redisConnected = ctx.redisConnected === true;

  /** @type {{ id: string, severity: string, confidence: number, evidence: Record<string, unknown> }[]} */
  const modes = [];

  if (successRate >= 0.9 && (avgQueue >= 12 || queueMax >= 24)) {
    modes.push({
      id: FAILURE_MODE_ID_V0.SOFT_SATURATION,
      severity: avgQueue >= 30 ? "high" : "medium",
      confidence: 0.85,
      evidence: { successRate, avgQueueDepth: avgQueue, queueDepthMax: queueMax }
    });
  }

  if (capPerMin > 0 || (limit > 0 && activeTurns > limit * 0.15)) {
    modes.push({
      id: FAILURE_MODE_ID_V0.ROLLOUT_HYSTERESIS,
      severity: activeTurns > limit * 0.5 ? "high" : "medium",
      confidence: 0.8,
      evidence: { capacityViolationsPerMin: capPerMin, activeTurns, limit }
    });
  }

  if (
    trackedLeases > 0 &&
    activeTurns > 0 &&
    Math.abs(trackedLeases - activeTurns) > Math.max(2, limit * 0.05)
  ) {
    modes.push({
      id: FAILURE_MODE_ID_V0.ZSET_PRESSURE,
      severity: trackedLeases > limit * 2 ? "high" : "medium",
      confidence: simMode ? 0.45 : 0.75,
      evidence: { trackedLeases, activeTurns, limit, leaseSkew: rollout.leaseSkew, simApproximation: simMode }
    });
  }

  if (redisLatencyMs >= 50 || (redisConnected && coherenceRate > 0.2)) {
    const baseConf = redisConnected ? 0.7 : 0.4;
    modes.push({
      id: FAILURE_MODE_ID_V0.REDIS_COORDINATION_LAG,
      severity: redisLatencyMs >= 150 ? "high" : "medium",
      confidence: simMode ? Math.min(0.3, baseConf) : baseConf,
      evidence: {
        redisLatencyMs,
        redisConnected,
        rolloutCoherenceErrorRate: coherenceRate,
        simulatedOnly: simMode && !redisConnected
      }
    });
  }

  if (leaseTtlMs < 5_000 && Number(m.durationMin) > 0.5) {
    modes.push({
      id: FAILURE_MODE_ID_V0.TTL_RECONCILE_COUPLING,
      severity: "medium",
      confidence: 0.65,
      evidence: { leaseTtlMs, durationMin: m.durationMin, note: "short_ttl_vs_long_run" }
    });
  }

  if (driftRate > 0) {
    modes.push({
      id: FAILURE_MODE_ID_V0.GCL_DRIFT,
      severity: "high",
      confidence: 0.9,
      evidence: { gclRolloutSyncDriftRate: driftRate }
    });
  }

  if (purged > 0 && activeTurns <= 2) {
    modes.push({
      id: FAILURE_MODE_ID_V0.LIFECYCLE_RECOVERED,
      severity: "info",
      confidence: 0.9,
      evidence: { purged, activeTurnsAfter: activeTurns }
    });
  }

  if (coherenceRate > 0.5 && redisConnected && !simMode) {
    modes.push({
      id: FAILURE_MODE_ID_V0.LEASE_CONTENTION,
      severity: "low",
      confidence: 0.35,
      evidence: { rolloutCoherenceErrorRate: coherenceRate }
    });
  }

  if (modes.length === 0) {
    modes.push({
      id: FAILURE_MODE_ID_V0.HEALTHY,
      severity: "info",
      confidence: 0.6,
      evidence: { successRate }
    });
  }

  const ranked = [...modes].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return Object.freeze({
    schema: FAILURE_MODE_SCHEMA_V0,
    modes: ranked,
    primary: ranked[0]?.id || FAILURE_MODE_ID_V0.HEALTHY,
    architectureNote: "capacity_system_to_ownership_system"
  });
}

function severityRank(s) {
  const o = { high: 3, medium: 2, low: 1, info: 0 };
  return o[s] ?? 0;
}
