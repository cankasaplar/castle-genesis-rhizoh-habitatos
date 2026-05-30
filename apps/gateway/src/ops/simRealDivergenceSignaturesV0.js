/**
 * SIM vs REAL divergence signatures — what changes between coordination sim and Redis.
 * @see docs/ops/FAKE_VS_REAL_REDIS_BEHAVIOR_MAP_V1.0.md
 */

import { FAILURE_MODE_ID_V0 } from "./failureModeClassificationV0.js";

export const DIVERGENCE_MAP_SCHEMA_V0 = "rhizoh.sim_real_divergence_map.v0";

/** Patterns trustworthy in coordination-sim runs (~90% logic coverage). */
export const SIM_RELIABLE_V0 = Object.freeze([
  FAILURE_MODE_ID_V0.SOFT_SATURATION,
  FAILURE_MODE_ID_V0.ROLLOUT_HYSTERESIS,
  FAILURE_MODE_ID_V0.GCL_DRIFT,
  FAILURE_MODE_ID_V0.LIFECYCLE_RECOVERED,
  FAILURE_MODE_ID_V0.TTL_RECONCILE_COUPLING
]);

/** Requires real Redis / multi-instance to validate. */
export const REAL_VALIDATION_PATTERN_IDS_V0 = Object.freeze([
  FAILURE_MODE_ID_V0.REDIS_COORDINATION_LAG,
  FAILURE_MODE_ID_V0.ZSET_PRESSURE,
  FAILURE_MODE_ID_V0.LEASE_CONTENTION
]);

/**
 * @param {unknown} report
 * @param {{ slices?: { label: string, classification: { modes: { id: string, confidence: number }[], primary: string } }[], executionMode?: string, dominantFailureMode?: string }} analysis
 */
export function extractSimRealDivergenceV0(report, analysis = {}) {
  const r = /** @type {Record<string, unknown>} */ (report || {});
  const readiness = /** @type {Record<string, unknown>} */ (r.readiness || {});
  const rolloutHealth = /** @type {Record<string, unknown>} */ (readiness.rolloutHealth || {});

  const executionMode =
    analysis.executionMode ||
    resolveExecutionModeFromReportV0(r);

  const observedPrimaries = new Set(
    (analysis.slices || []).map((s) => s.classification?.primary).filter(Boolean)
  );
  const observedModeIds = new Set();
  for (const s of analysis.slices || []) {
    for (const m of s.classification?.modes || []) {
      observedModeIds.add(m.id);
    }
  }

  /** @type {{ id: string, sim: string, real: string, observed: boolean, note: string }[]} */
  const signatures = [];

  const add = (id, sim, real, note) => {
    signatures.push({
      id,
      sim,
      real,
      observed: observedModeIds.has(id) || observedPrimaries.has(id),
      note
    });
  };

  add(
    "queue_growth_vs_success",
    "high_fidelity",
    "high_fidelity",
    "successRate≥0.9 while avgQueueDepth rises — visible in both"
  );
  add(
    "rollout_inflight_leak",
    "pre_reconcile_visible",
    "pre_reconcile_visible",
    "activeTurns>limit×0.15 before TTL reconcile; sim uses ZSET+lease"
  );
  add(
    "redis_coordination_lag",
    "sim_injected_latency_only",
    "network_tcp_plus_zset_race",
    "SIM: chaos ms only (confidence capped); REAL: true coordination delay"
  );
  add(
    "redis_zset_lease_pressure",
    "skew_metric_approximate",
    "true_multi_instance_zset_card",
    "trackedLeases vs activeTurns skew — partial in sim"
  );
  add(
    "cross_instance_lease_contention",
    "not_observable",
    "rare_but_real",
    "Requires ≥2 gateway processes on same Redis"
  );
  add(
    "gcl_rollout_sync_drift",
    "high_fidelity",
    "high_fidelity",
    "Financial vs execution slot mismatch"
  );
  add(
    "lifecycle_reconcile_recovery",
    "high_fidelity",
    "high_fidelity",
    "purged>0 and activeTurns→0 after reconcile"
  );

  const simReliableObserved = SIM_RELIABLE_V0.filter((id) => observedModeIds.has(id));
  const realValidationRequired = REAL_VALIDATION_PATTERN_IDS_V0.filter((id) => observedModeIds.has(id));

  const postRollout = findLastRolloutSnapshotV0(r);

  return Object.freeze({
    schema: DIVERGENCE_MAP_SCHEMA_V0,
    executionMode,
    coordinationSim: executionMode === "coordination_sim",
    redisConnected: rolloutHealth.redisConnected === true,
    signatures,
    simReliablePatterns: SIM_RELIABLE_V0,
    simReliableObserved,
    realValidationPatterns: REAL_VALIDATION_PATTERN_IDS_V0,
    realValidationRequired,
    postRunRollout: postRollout
      ? {
          activeTurns: postRollout.activeTurns,
          trackedLeases: postRollout.trackedLeases,
          zsetPressure: postRollout.zsetPressure,
          leaseSkew: postRollout.leaseSkew
        }
      : null,
    validationLayer: Object.freeze({
      role: "redis_stress",
      status: executionMode === "redis_cluster" ? "exercised" : "deferred",
      note: "Real Redis is validation-only after SIM sign-off"
    })
  });
}

/**
 * @param {Record<string, unknown>} report
 */
export function resolveExecutionModeFromReportV0(report) {
  const readiness = /** @type {Record<string, unknown>} */ (report.readiness || {});

  let coordinationSim = false;
  let redisConnected = readiness.rolloutHealth?.redisConnected === true;

  const phases = report.phases;
  if (phases && typeof phases === "object") {
    for (const p of Object.values(/** @type {Record<string, unknown>} */ (phases))) {
      const rollout = /** @type {Record<string, unknown>} */ (p.postSnapshot?.rollout || {});
      if (rollout.coordinationSim === true) coordinationSim = true;
      if (rollout.ledgerMode === "coordination_sim") coordinationSim = true;
      if (rollout.health?.mode === "coordination_sim") coordinationSim = true;
      if (rollout.clusterWide && rollout.health?.redisConnected) redisConnected = true;
    }
  }

  const single = /** @type {Record<string, unknown>} */ (report.postSnapshot?.rollout || {});
  if (single.coordinationSim === true || single.ledgerMode === "coordination_sim") {
    coordinationSim = true;
  }

  if (process.env.CASTLE_COORDINATION_SIM === "1") coordinationSim = true;

  if (coordinationSim) return "coordination_sim";
  if (redisConnected) return "redis_cluster";
  return "dev_memory";
}

/**
 * @param {Record<string, unknown>} report
 */
function findLastRolloutSnapshotV0(report) {
  const phases = report.phases;
  if (!phases || typeof phases !== "object") {
    return report.postSnapshot?.rollout || null;
  }
  const keys = Object.keys(phases);
  const last = keys[keys.length - 1];
  return /** @type {Record<string, unknown>} */ (phases[last]?.postSnapshot?.rollout) || null;
}
