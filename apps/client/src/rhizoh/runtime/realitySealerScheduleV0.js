/**
 * Live sealer scheduling — canonical cadence, priority, budget coupling, hysteresis.
 *
 * Answers: when to drain, at what priority, under which budget hold, with what coalesce hysteresis.
 */

import {
  assessEpochInflationV0,
  resolveCommitClassV0,
  createDefaultRealitySealLayerStateV0
} from "./realitySealingCoreV0.js";

export const REALITY_SEALER_SCHEDULE_SCHEMA_V0 = "castle.rhizoh.reality_sealer_schedule.v0";

/** Canonical cadence bands (ms). */
export const REALITY_SEALER_CADENCE_V0 = Object.freeze({
  minDrainIntervalMs: 100,
  maxDrainIntervalMs: 2000,
  coalesceWindowMs: 250,
  queueDepthForceDrain: 12,
  evalThrottleMs: 16
});

/** Lower number = higher priority. */
export const SEAL_CANDIDATE_PRIORITY_V0 = Object.freeze({
  sealing_topology_mandate: 0,
  sealing_world_geometry: 1,
  high_rate_substrate: 2,
  noise_or_duplicate: 9
});

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealSchedulerV0 | null | undefined} sched
 * @param {number} nowMs
 */
export function normalizeRealitySealSchedulerV0(sched, nowMs = 0) {
  const base = sched && typeof sched === "object" ? sched : {};
  return {
    lastDrainAtMs: Number(base.lastDrainAtMs) || 0,
    lastScheduleEvalAtMs: Number(base.lastScheduleEvalAtMs) || nowMs,
    coalesceHoldUntilMs: Number(base.coalesceHoldUntilMs) || 0,
    drainPassesThisSession: Number(base.drainPassesThisSession) || 0
  };
}

/**
 * @param {string} commitClassId
 */
export function sealCandidatePriorityRankV0(commitClassId) {
  const id = String(commitClassId || "");
  if (id in SEAL_CANDIDATE_PRIORITY_V0) {
    return /** @type {number} */ (SEAL_CANDIDATE_PRIORITY_V0[id]);
  }
  const klass = resolveCommitClassV0(id);
  if (klass?.mayAdvanceRealityEpoch) return 1;
  return 5;
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0[]} queue
 */
export function sortSealQueueByPriorityV0(queue) {
  return [...queue].sort((a, b) => {
    const pa = sealCandidatePriorityRankV0(a.commitClassId);
    const pb = sealCandidatePriorityRankV0(b.commitClassId);
    if (pa !== pb) return pa - pb;
    return (a.enqueuedAtMs || 0) - (b.enqueuedAtMs || 0);
  });
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0[]} queue
 */
export function countHighPrioritySealCandidatesV0(queue) {
  let n = 0;
  for (const c of queue) {
    if (sealCandidatePriorityRankV0(c.commitClassId) <= 1) n += 1;
  }
  return n;
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {number} nowMs
 * @param {{ forceDrain?: boolean, walIngressSealing?: boolean }} [opts]
 */
export function evaluateSealerScheduleV0(seal, nowMs, opts = {}) {
  const t = Number(nowMs) || Date.now();
  const s = createDefaultRealitySealLayerStateV0(seal, { nowMs: t });
  const sched = normalizeRealitySealSchedulerV0(s.scheduler, t);
  const queueLen = s.sealQueue.length;
  const elapsed = t - sched.lastDrainAtMs;
  const highPriority = countHighPrioritySealCandidatesV0(s.sealQueue);
  const winSec = Math.max(s.budget.windowMs / 1000, 0.001);
  const rate = s.budget.sealsInWindow / winSec;
  const inflationStatus = assessEpochInflationV0(t, { dEpochPerSec: rate, sealsPerSec: rate });

  let shouldDrain = false;
  let reason = "hold_hysteresis";

  if (queueLen === 0) {
    return {
      shouldDrain: false,
      reason: "queue_empty",
      inflationStatus,
      highPriority,
      elapsedMs: elapsed,
      scheduler: { ...sched, lastScheduleEvalAtMs: t }
    };
  }

  if (opts.forceDrain) {
    shouldDrain = true;
    reason = "force_drain";
  } else if (inflationStatus === "critical") {
    shouldDrain = false;
    reason = "inflation_critical_hold";
  } else if (
    opts.walIngressSealing === true &&
    highPriority > 0 &&
    inflationStatus !== "critical" &&
    t >= sched.coalesceHoldUntilMs
  ) {
    shouldDrain = true;
    reason = "wal_sealing_ingress";
  } else if (highPriority > 0 && elapsed >= REALITY_SEALER_CADENCE_V0.minDrainIntervalMs) {
    shouldDrain = true;
    reason = "high_priority_ready";
  } else if (elapsed >= REALITY_SEALER_CADENCE_V0.maxDrainIntervalMs) {
    shouldDrain = true;
    reason = "max_cadence_elapsed";
  } else if (queueLen >= REALITY_SEALER_CADENCE_V0.queueDepthForceDrain) {
    shouldDrain = true;
    reason = "queue_depth_force";
  } else if (t >= sched.coalesceHoldUntilMs && elapsed >= REALITY_SEALER_CADENCE_V0.coalesceWindowMs) {
    shouldDrain = true;
    reason = "coalesce_window_closed";
  }

  return {
    shouldDrain,
    reason,
    inflationStatus,
    highPriority,
    queueLen,
    elapsedMs: elapsed,
    scheduler: { ...sched, lastScheduleEvalAtMs: t }
  };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {number} nowMs
 * @param {boolean} drained
 */
export function stampSchedulerAfterDrainV0(seal, nowMs, drained) {
  const t = Number(nowMs) || Date.now();
  const sched = normalizeRealitySealSchedulerV0(seal.scheduler, t);
  return {
    ...normalizeRealitySealSchedulerV0(seal.scheduler, t),
    lastDrainAtMs: drained ? t : sched.lastDrainAtMs,
    coalesceHoldUntilMs: drained ? t + REALITY_SEALER_CADENCE_V0.coalesceWindowMs : sched.coalesceHoldUntilMs,
    drainPassesThisSession: sched.drainPassesThisSession + (drained ? 1 : 0),
    lastScheduleEvalAtMs: t
  };
}
