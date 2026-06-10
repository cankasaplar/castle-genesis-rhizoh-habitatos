/**
 * Castle Real-Time Arbitration Layer v1.1 — preemption, scheduling, stream conflict.
 * "decision exists → is it safe to run NOW?"
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_1.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { SPIKE_TYPE_V1 } from "./castleSpikeEngineV1.js";
import {
  EXECUTION_STATE_V1,
  getExecutionStateV1,
  suspendCurrentExecutionV1
} from "./castleExecutionStateV1.js";

export const CASTLE_REALTIME_ARBITRATION_SCHEMA_V1 = "castle.realtime_arbitration.v1";

export const ARBITRATION_DISPOSITION_V1 = Object.freeze({
  EXECUTE: "execute",
  GATE: "gate",
  DEFER: "defer",
  PREEMPT: "preempt"
});

/** Priority matrix — base priorities by signal class. */
export const SOURCE_PRIORITY_V1 = Object.freeze({
  EMERGENCY: 100,
  DIRECT_ADDRESS: 90,
  LIVE_INTERACTION: 70,
  MEDIA_CONTENT: 45,
  BACKGROUND: 15
});

const PREEMPT_FLOOR_V1 = 90;
const DEFER_STARvation_MS_V1 = 2000;
const DEFER_STARvation_BOOST_V1 = 5;
const DEFER_STARvation_BOOST_MAX_V1 = 25;
const PREEMPTION_QUEUE_MAX_V1 = 32;

/** @type {object[]} */
const preemptionQueueV1 = [];

/**
 * Resolve effective runtime priority from ActionPlan + spike.
 * @param {object} actionPlan
 * @param {object} [spike]
 */
export function resolveEffectivePriorityV1(actionPlan, spike) {
  let priority = Number(actionPlan?.priority) || 0;

  if (spike?.type === SPIKE_TYPE_V1.EMERGENCY || actionPlan?.mode === "emergency") {
    return SOURCE_PRIORITY_V1.EMERGENCY;
  }
  if (spike?.type === SPIKE_TYPE_V1.SOCIAL_CALL || /\b(rhizoh|rizo|rizoh)\b/i.test(spike?.preview || "")) {
    return Math.max(priority, SOURCE_PRIORITY_V1.DIRECT_ADDRESS);
  }
  if (
    spike?.type === SPIKE_TYPE_V1.INTENT ||
    spike?.type === SPIKE_TYPE_V1.ANALYTICAL
  ) {
    return Math.max(priority, SOURCE_PRIORITY_V1.LIVE_INTERACTION);
  }
  if (spike?.type === SPIKE_TYPE_V1.REFERENCE) {
    return Math.max(priority, SOURCE_PRIORITY_V1.MEDIA_CONTENT);
  }
  return Math.max(priority, SOURCE_PRIORITY_V1.BACKGROUND);
}

/**
 * Derive active stream snapshot from attention field mass.
 * @param {object} field
 */
export function deriveActiveStreamsV1(field = {}) {
  const mass = field.sourceMass || {};
  return Object.freeze({
    mic: (mass.mic || 0) > 0.05,
    youtube: (mass.youtube || 0) > 0.05,
    tv: (mass.tv || 0) > 0.05,
    media: (mass.media || 0) > 0.05,
    camera: (mass.camera || 0) > 0.05,
    file: (mass.file || 0) > 0.05,
    coWatchActive: (mass.youtube || 0) + (mass.tv || 0) + (mass.media || 0) > 0.15,
    mediaMass: (mass.youtube || 0) + (mass.tv || 0) + (mass.media || 0)
  });
}

/**
 * Stream conflict resolver — media time-lock vs low-priority speak.
 * @param {object} streams
 * @param {object} actionPlan
 * @param {number} priority
 */
export function resolveStreamConflictV1(streams, actionPlan, priority) {
  if (!actionPlan?.speak) {
    return Object.freeze({ conflict: false, defer: false, reason: "no_speak" });
  }
  if (priority >= PREEMPT_FLOOR_V1) {
    return Object.freeze({ conflict: false, defer: false, reason: "high_priority_override" });
  }
  if (streams.coWatchActive && priority < SOURCE_PRIORITY_V1.LIVE_INTERACTION) {
    return Object.freeze({
      conflict: true,
      defer: true,
      reason: "media_timelock_co_watch"
    });
  }
  return Object.freeze({ conflict: false, defer: false, reason: "no_conflict" });
}

function enqueueDeferredV1(plan, spike, atMs, reason) {
  preemptionQueueV1.push(
    Object.freeze({
      plan,
      spike,
      priority: resolveEffectivePriorityV1(plan, spike),
      enqueuedAtMs: atMs,
      reason
    })
  );
  if (preemptionQueueV1.length > PREEMPTION_QUEUE_MAX_V1) preemptionQueueV1.shift();
}

function applyStarvationBoostV1(entry, atMs) {
  const waitedMs = atMs - entry.enqueuedAtMs;
  const boosts = Math.floor(waitedMs / DEFER_STARvation_MS_V1);
  const boost = Math.min(boosts * DEFER_STARvation_BOOST_V1, DEFER_STARvation_BOOST_MAX_V1);
  return entry.priority + boost;
}

/**
 * Flush deferred queue when idle — starvation prevention.
 * @param {number} atMs
 */
export function flushDeferredQueueV1(atMs = Date.now()) {
  const state = getExecutionStateV1();
  if (!state.isIdle || preemptionQueueV1.length === 0) return null;

  preemptionQueueV1.sort(
    (a, b) => applyStarvationBoostV1(b, atMs) - applyStarvationBoostV1(a, atMs)
  );
  const next = preemptionQueueV1.shift();
  if (!next) return null;

  const boostedPriority = applyStarvationBoostV1(next, atMs);
  const plan = Object.freeze({
    ...next.plan,
    priority: boostedPriority,
    reason: `${next.plan.reason || "deferred"}_starvation_flush`
  });

  return Object.freeze({
    disposition: ARBITRATION_DISPOSITION_V1.EXECUTE,
    plan,
    spike: next.spike,
    safeToExecute: true,
    reason: "starvation_flush",
    deferred: null,
    preempted: null
  });
}

/**
 * Core arbitration — ActionPlan + execution state → gated | deferred | preempt.
 * @param {object} input
 */
export function arbitrateRealtimeV1(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const actionPlan = input.actionPlan;
  const spike = input.spike || null;
  const coherence = input.coherence || null;
  const executionState = input.executionState || getExecutionStateV1();
  const activeStreams = input.activeStreams || deriveActiveStreamsV1(input.field);

  if (!actionPlan) {
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.GATE,
      plan: null,
      safeToExecute: false,
      reason: "no_plan"
    });
  }

  const incomingPriority = resolveEffectivePriorityV1(actionPlan, spike);
  const gatedPlan = Object.freeze({
    ...actionPlan,
    priority: incomingPriority
  });

  const hasSideEffect =
    actionPlan.speak || actionPlan.memoryWrite || actionPlan.shadowWrite || actionPlan.uiHighlight;

  if (!hasSideEffect) {
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.GATE,
      plan: gatedPlan,
      safeToExecute: false,
      reason: "no_side_effects",
      incomingPriority
    });
  }

  if (executionState.isIdle) {
    const conflict = resolveStreamConflictV1(activeStreams, actionPlan, incomingPriority);
    if (conflict.defer && actionPlan.speak) {
      enqueueDeferredV1(gatedPlan, spike, atMs, conflict.reason);
      return Object.freeze({
        schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
        disposition: ARBITRATION_DISPOSITION_V1.DEFER,
        plan: Object.freeze({ ...gatedPlan, speak: false }),
        deferred: gatedPlan,
        safeToExecute: actionPlan.memoryWrite || actionPlan.shadowWrite,
        reason: conflict.reason,
        incomingPriority
      });
    }
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.EXECUTE,
      plan: gatedPlan,
      safeToExecute: true,
      reason: "idle_execute",
      incomingPriority
    });
  }

  const currentPriority = executionState.currentPriority || 0;

  if (incomingPriority >= SOURCE_PRIORITY_V1.EMERGENCY) {
    const preempted = suspendCurrentExecutionV1(coherence, atMs, "emergency_preempt");
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.PREEMPT,
      plan: gatedPlan,
      preempted,
      safeToExecute: true,
      reason: "emergency_preempt",
      incomingPriority
    });
  }

  if (incomingPriority >= PREEMPT_FLOOR_V1 && executionState.state === EXECUTION_STATE_V1.RUNNING) {
    const preempted = suspendCurrentExecutionV1(coherence, atMs, "direct_address_preempt");
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.PREEMPT,
      plan: gatedPlan,
      preempted,
      safeToExecute: true,
      reason: "direct_address_preempt",
      incomingPriority
    });
  }

  if (incomingPriority > currentPriority + 5) {
    const preempted = suspendCurrentExecutionV1(coherence, atMs, "priority_preempt");
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.PREEMPT,
      plan: gatedPlan,
      preempted,
      safeToExecute: true,
      reason: "priority_preempt",
      incomingPriority
    });
  }

  if (incomingPriority <= currentPriority) {
    enqueueDeferredV1(gatedPlan, spike, atMs, "lower_priority_than_running");
    const deferPlan = Object.freeze({
      ...gatedPlan,
      speak: false,
      reason: "deferred_lower_priority"
    });
    return Object.freeze({
      schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
      disposition: ARBITRATION_DISPOSITION_V1.DEFER,
      plan: deferPlan,
      deferred: gatedPlan,
      safeToExecute: deferPlan.memoryWrite || deferPlan.shadowWrite,
      reason: "deferred_lower_priority",
      incomingPriority
    });
  }

  return Object.freeze({
    schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
    disposition: ARBITRATION_DISPOSITION_V1.EXECUTE,
    plan: gatedPlan,
    safeToExecute: true,
    reason: "priority_execute",
    incomingPriority
  });
}

export function getPreemptionQueueV1() {
  return Object.freeze(preemptionQueueV1.map((e) => Object.freeze({ ...e })));
}

export function getArbitrationSnapshotV1() {
  return Object.freeze({
    schema: CASTLE_REALTIME_ARBITRATION_SCHEMA_V1,
    queueLength: preemptionQueueV1.length,
    queue: getPreemptionQueueV1(),
    priorities: SOURCE_PRIORITY_V1
  });
}

/** @internal vitest */
export function __resetRealtimeArbitrationForTestV1() {
  preemptionQueueV1.length = 0;
}
