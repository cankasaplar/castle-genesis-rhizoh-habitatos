/**
 * Temporal policy engine (v0) — selective activation + phase coherence.
 * Bridges single clock → multi-lane execution with explicit lane levels and suppressed alternatives.
 */

import { TCEE_PHASE } from "./tceeDualPhaseBoot.js";

export const TICK_LANE_LEVEL = Object.freeze({
  OFF: "off",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  DEFERRED: "deferred",
  GATED: "gated",
  CONDITIONAL: "conditional"
});

/**
 * Phase coherence: pre-breath keeps slow lanes off the spine (WAKE unlocks temporal constraints).
 * @param {{ physics: boolean, memoryIdentity: boolean, consolidation: boolean }} basePlan
 * @param {string} tceePhase
 */
export function resolveCoherentTickPlan(basePlan, tceePhase) {
  const phase = String(tceePhase || "");
  if (phase === TCEE_PHASE.PRE_BREATH) {
    return {
      physics: !!basePlan.physics,
      memoryIdentity: false,
      consolidation: false
    };
  }
  return {
    physics: !!basePlan.physics,
    memoryIdentity: !!basePlan.memoryIdentity,
    consolidation: !!basePlan.consolidation
  };
}

/**
 * @param {{
 *   tceePhase: string,
 *   tickIndex: number,
 *   plan: { memoryIdentity: boolean, consolidation: boolean },
 *   wakeSealedAt?: number | null,
 *   memoryClockEpoch?: number | null
 * }} p
 */
export function buildCastleTickProfile(p) {
  const phase = String(p.tceePhase || "");
  const awake = phase === TCEE_PHASE.AWAKE;
  const wakeSealedAt = Number(p.wakeSealedAt);
  const memoryClockEpoch = p.memoryClockEpoch != null ? Number(p.memoryClockEpoch) : null;
  const temporalConstraintActive =
    awake && Number.isFinite(wakeSealedAt) && wakeSealedAt > 0 && Number.isFinite(memoryClockEpoch) && memoryClockEpoch > 0;

  return {
    physics: TICK_LANE_LEVEL.HIGH,
    memory: p.plan.memoryIdentity ? (awake ? TICK_LANE_LEVEL.MEDIUM : TICK_LANE_LEVEL.LOW) : TICK_LANE_LEVEL.OFF,
    identity: p.plan.memoryIdentity ? (awake ? TICK_LANE_LEVEL.MEDIUM : TICK_LANE_LEVEL.LOW) : TICK_LANE_LEVEL.OFF,
    spawn: awake ? TICK_LANE_LEVEL.CONDITIONAL : TICK_LANE_LEVEL.GATED,
    consolidation: p.plan.consolidation ? TICK_LANE_LEVEL.DEFERRED : TICK_LANE_LEVEL.OFF,
    wakeTemporalConstraint: temporalConstraintActive,
    temporalWindowId: Math.floor(Math.max(0, p.tickIndex) / 4) % 256
  };
}

/**
 * What did not run / why (for execution coherence boundary).
 * @param {{
 *   basePlan: { memoryIdentity: boolean, consolidation: boolean },
 *   coherentPlan: { memoryIdentity: boolean, consolidation: boolean },
 *   profile: ReturnType<typeof buildCastleTickProfile>,
 *   tceePhase: string
 * }} p
 */
export function listSuppressedLaneAlternatives(p) {
  const sup = [];
  const phase = String(p.tceePhase || "");

  if (!p.coherentPlan.memoryIdentity && p.basePlan.memoryIdentity) {
    sup.push({
      lane: "memory_identity",
      reason: "phase_coherence",
      wouldRun: "idle_decay_or_recall_queue",
      blockedBy: "tcee_pre_breath"
    });
  } else if (!p.coherentPlan.memoryIdentity && !p.basePlan.memoryIdentity) {
    sup.push({
      lane: "memory_identity",
      reason: "hierarchical_stride",
      wouldRun: "idle_decay_or_recall_queue",
      blockedBy: "tick_stride"
    });
  }

  if (!p.coherentPlan.consolidation && p.basePlan.consolidation) {
    sup.push({
      lane: "consolidation",
      reason: "phase_coherence",
      wouldRun: "prune_compress_digest",
      blockedBy: "tcee_pre_breath"
    });
  } else if (!p.coherentPlan.consolidation && !p.basePlan.consolidation) {
    sup.push({
      lane: "consolidation",
      reason: "hierarchical_stride",
      wouldRun: "prune_compress_digest",
      blockedBy: "tick_stride"
    });
  }

  if (p.profile.spawn === TICK_LANE_LEVEL.GATED && phase === TCEE_PHASE.PRE_BREATH) {
    sup.push({
      lane: "spawn",
      reason: "wake_not_sealed",
      wouldRun: "pgl_gestation_advance",
      blockedBy: "tcee_phase"
    });
  }

  return sup;
}

/**
 * @param {Record<string, unknown>} bp
 */
export function executionMetricsFromBackpressure(bp) {
  if (!bp || typeof bp !== "object") return { skipped: 0, lastPhysicsMs: 0 };
  return {
    skipped: Math.max(0, Number(bp.skipped) || 0),
    lastPhysicsMs: Math.max(0, Number(bp.lastPhysicsMs) || 0)
  };
}
