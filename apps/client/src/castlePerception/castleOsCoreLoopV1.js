/**
 * Castle OS v1.1 — RTAOS with Hard Realtime + Preemption Kernel.
 * FusionBus → Field → Spike → Kernel → Arbitration → Execution
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_1.md
 */

import { ingestFusionBusV1, publishStreamEventV1 } from "./castleMultiStreamFusionBusV1.js";
import {
  computeCastleAttentionFieldV1,
  getAttentionFieldGraphV1,
  tickAttentionFieldV1
} from "./castleAttentionFieldV1.js";
import { evaluateSpikeCollapseV1 } from "./castleSpikeEngineV1.js";
import { decideCoPresenceV1 } from "../rhizoh/runtime/rhizohCoPresenceKernelV1.js";
import {
  executeArbitratedPlanV1,
  executeComposedPlanV1_3,
  releaseSpeakExecutionV1
} from "./castleExecutionLayerV1.js";
import { getExecutionStateV1 } from "./castleExecutionStateV1.js";
import { updateTemporalCoherenceV1 } from "./castleTemporalCoherenceV1.js";
import {
  arbitrateRealtimeV1,
  deriveActiveStreamsV1,
  flushDeferredQueueV1
} from "./castleRealtimeArbitrationV1.js";
import { arbitrateRoomRealityV1_2 } from "./castleRoomArbitrationV1_2.js";
import { composeRealityV1_3 } from "./castleRealityCompositionV1_3.js";
import { applyRealityDynamicsV1_4 } from "./castleRealityDynamicsV1_4.js";
import { applyRealityStabilityV1_5, resumeRealityContextV1_5 } from "./castleRealityStabilityGovernorV1_5.js";
import {
  applyStabilityHumanLoopV1_6,
  submitStabilityFeedbackV1_6
} from "./castleStabilityHumanLoopV1_6.js";
import { applyStabilityLifecycleLoopV1_9, publishCastleOsLoopEventV1_9 } from "./castleStabilityLifecycleLoopV1_9.js";
import { getUserPhysicsProfileV1_7 } from "./castleStabilityMemoryGraphV1_7.js";
import {
  exportPhysicsLifecycleV1_8,
  importPhysicsLifecycleV1_8
} from "./castleStabilityPhysicsLifecycleV1_8.js";
import { getLearningTraceV1_8 } from "./castleStabilityLearningTraceV1_8.js";
import {
  pushPhysicsLifecycleCloudSyncV1_9,
  pullPhysicsLifecycleCloudSyncV1_9,
  registerStabilityCloudSyncAdapterV1_9
} from "./castleStabilityCloudSyncV1_9.js";
import { bootstrapPhysicsCloudSyncV1_9 } from "./castlePhysicsCloudBootstrapV1_9.js";
import { resolvePhysicsSyncUserIdV1_9 } from "./castlePhysicsFirebaseAdapterV1_9.js";
import { resolveContextualIdentityV1_3 } from "./castleContextualIdentityV1_3.js";

export const CASTLE_OS_CORE_SCHEMA_V1_1 = "castle.os.core.v1.1";
export const CASTLE_OS_CORE_SCHEMA_V1_2 = "castle.os.core.v1.2";
export const CASTLE_OS_CORE_SCHEMA_V1_3 = "castle.os.core.v1.3";
export const CASTLE_OS_CORE_SCHEMA_V1_4 = "castle.os.core.v1.4";
export const CASTLE_OS_CORE_SCHEMA_V1_5 = "castle.os.core.v1.5";
export const CASTLE_OS_CORE_SCHEMA_V1_6 = "castle.os.core.v1.6";
export const CASTLE_OS_CORE_SCHEMA_V1_7 = "castle.os.core.v1.7";
export const CASTLE_OS_CORE_SCHEMA_V1_8 = "castle.os.core.v1.8";
export const CASTLE_OS_CORE_SCHEMA_V1_9 = "castle.os.core.v1.9";

let osTickCounterV1_1 = 0;
/** @type {object | null} */
let lastOsLoopResultV1_1 = null;

export function runCastleOsFieldTickV1(nowMs = Date.now()) {
  osTickCounterV1_1 += 1;
  const graph = tickAttentionFieldV1(nowMs);
  return Object.freeze({
    schema: CASTLE_OS_CORE_SCHEMA_V1_1,
    osTickId: osTickCounterV1_1,
    fieldTickId: graph.tickId,
    globalMass: graph.globalMass,
    resonanceZoneCount: graph.resonanceZones.length,
    graph
  });
}

/**
 * Castle OS v1.1 full loop — includes preemption arbitration before execution.
 * @param {object} input
 */
export function runCastleOsLoopV1_1(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const source = input.source || "mic";

  const deferredFlush = flushDeferredQueueV1(atMs);
  if (deferredFlush && getExecutionStateV1().isIdle) {
    const exec = executeArbitratedPlanV1(deferredFlush, {
      ...input,
      atMs,
      preview: deferredFlush.plan?.preview
    });
    const result = Object.freeze({
      schema: CASTLE_OS_CORE_SCHEMA_V1_1,
      osTickId: osTickCounterV1_1,
      deferredFlush: true,
      arbitration: deferredFlush,
      execution: exec,
      voiceSpike: exec.voiceSpike,
      atMs
    });
    lastOsLoopResultV1_1 = result;
    publishOsSnapshotV1_1(result);
    return result;
  }

  const busRow =
    input.text || input.preview
      ? publishStreamEventV1({ ...input, source, atMs })
      : ingestFusionBusV1(source, { ...input, atMs });

  if (!busRow && !input.text && !input.preview) {
    runCastleOsFieldTickV1(atMs);
  }

  const graph = getAttentionFieldGraphV1();
  const field = computeCastleAttentionFieldV1(atMs);
  const spikes = evaluateSpikeCollapseV1({ graph, field, atMs });
  const actionPlan = decideCoPresenceV1({ spikes, field, graph, input, atMs });
  const coherence = updateTemporalCoherenceV1({
    field,
    spikes,
    spike: spikes[0],
    graph,
    mode: actionPlan.mode,
    atMs,
    mediaPositionMs: input.mediaPositionMs
  });

  const roomArbitration = arbitrateRoomRealityV1_2({
    actionPlan,
    identityEvent: busRow?.identityEvent || null,
    spike: spikes[0] || null,
    ownerId: input.ownerId || busRow?.identityEvent?.ownerId || "user_local",
    localUserId: input.localUserId || input.ownerId || "user_local",
    atMs
  });

  const realityComposition = composeRealityV1_3({
    actionPlan: roomArbitration.gatedActionPlan,
    roomArbitration,
    identityEvent: busRow?.identityEvent || null,
    ownerId: input.ownerId || busRow?.identityEvent?.ownerId || "user_local",
    source,
    preview: input.preview || input.text?.slice(0, 160),
    text: input.text,
    spike: spikes[0] || null,
    atMs
  });

  const realityDynamics = applyRealityDynamicsV1_4(realityComposition, {
    ownerId: input.ownerId || busRow?.identityEvent?.ownerId || "user_local",
    atMs
  });

  const realityStability = applyRealityStabilityV1_5(realityDynamics, {
    ownerId: input.ownerId || busRow?.identityEvent?.ownerId || "user_local",
    userInitiated: input.userInitiated || source === "mic",
    intentWeight: busRow?.identityEvent?.salience,
    atMs
  });

  const realityGovernance = applyStabilityLifecycleLoopV1_9(realityStability, {
    ownerId: input.ownerId || busRow?.identityEvent?.ownerId || "user_local",
    userInitiated: input.userInitiated || source === "mic",
    text: input.text,
    preview: input.preview || input.text?.slice(0, 160),
    stabilityFeedback: input.stabilityFeedback,
    sustainLens: input.sustainLens,
    spikeSalience: spikes[0]?.salience,
    intentWeight: busRow?.identityEvent?.salience,
    atMs
  });
  const composedPlan = realityGovernance.governedPlan;

  const arbitration = arbitrateRealtimeV1({
    actionPlan: composedPlan,
    spike: spikes[0] || null,
    field,
    coherence,
    activeStreams: deriveActiveStreamsV1(field),
    atMs
  });

  const execution = executeComposedPlanV1_3(
    {
      ...realityComposition,
      composedPlan,
      realityFrame: realityGovernance.governedFrame
    },
    arbitration,
    {
      ...input,
      preview: input.preview || input.text?.slice(0, 160),
      atMs,
      spike: spikes[0] || null,
      threadId:
        composedPlan.dominantThreadId ||
        busRow?.identityEvent?.threadId ||
        roomArbitration.winner?.threadId ||
        null,
      ownerId: busRow?.identityEvent?.ownerId || input.ownerId || "user_local"
    }
  );

  if (busRow?.identityEvent) {
    resolveContextualIdentityV1_3(busRow.identityEvent, {
      ...input,
      source,
      atMs
    });
  }

  const result = Object.freeze({
    schema: CASTLE_OS_CORE_SCHEMA_V1_9,
    osTickId: osTickCounterV1_1,
    bus: busRow,
    graph,
    field,
    spikes,
    actionPlan,
    roomArbitration,
    realityComposition,
    realityDynamics,
    realityStability,
    realityGovernance,
    humanLoop: realityGovernance.humanLoop,
    coGovernance: realityGovernance.coGovernance,
    coGovernorState: realityGovernance.coGovernorState,
    stabilityAgreement: realityGovernance.stabilityAgreement,
    stabilityMemory: Object.freeze({
      memoryPriors: realityGovernance.memoryPriors,
      userPhysicsProfile: realityGovernance.userPhysicsProfile,
      contextDrift: realityGovernance.contextDrift,
      modality: realityGovernance.modality,
      timeBucket: realityGovernance.timeBucket,
      learnedPhysicsApplied: realityGovernance.learnedPhysicsApplied
    }),
    stabilityLifecycle: Object.freeze({
      implicitBias: realityGovernance.implicitBias,
      lifecycle: realityGovernance.lifecycle,
      predictiveCoProcessor: realityGovernance.predictiveCoProcessor
    }),
    learningTrace: realityGovernance.learningTrace,
    traceStrip: realityGovernance.traceStrip,
    cloudSync: realityGovernance.cloudSync,
    coherence,
    arbitration,
    execution,
    voiceSpike: execution.voiceSpike,
    executionState: getExecutionStateV1(),
    atMs
  });

  lastOsLoopResultV1_1 = result;
  publishOsSnapshotV1_1(result);
  publishCastleOsLoopEventV1_9(result);
  return result;
}

/** v1.9 — cloud-sync lifecycle + learning trace strip */
export function runCastleOsLoopV1_9(input = {}) {
  return runCastleOsLoopV1_1(input);
}

/** v1.8 — lifecycle physics, traceable learning, persistence */
export function runCastleOsLoopV1_8(input = {}) {
  return runCastleOsLoopV1_9(input);
}

/** v1.7 — stability memory learning loop + personal physics profile */
export function runCastleOsLoopV1_7(input = {}) {
  return runCastleOsLoopV1_8(input);
}

/** v1.6 — human co-governor on stability control plane */
export function runCastleOsLoopV1_6(input = {}) {
  return runCastleOsLoopV1_7(input);
}

/** v1.5 — stability governor + learned dynamics + phase locking */
export function runCastleOsLoopV1_5(input = {}) {
  return runCastleOsLoopV1_6(input);
}

/** v1.4 alias */
export function runCastleOsLoopV1_4(input = {}) {
  return runCastleOsLoopV1_5(input);
}

/** v1.3 alias */
export function runCastleOsLoopV1_3(input = {}) {
  return runCastleOsLoopV1_5(input);
}

/** v1.2 alias */
export function runCastleOsLoopV1_2(input = {}) {
  return runCastleOsLoopV1_5(input);
}

/** v1.0 alias — full stack through v1.9 cloud lifecycle */
export function runCastleOsLoopV1(input = {}) {
  return runCastleOsLoopV1_9(input);
}

export function runCastleOsIngressV1(source, payload = {}, nowMs = Date.now()) {
  return runCastleOsLoopV1_1({ ...payload, source, atMs: nowMs });
}

export function getCastleOsSnapshotV1_9() {
  return Object.freeze({
    schema: CASTLE_OS_CORE_SCHEMA_V1_9,
    identity: "personal_reality_co_processor_cloud",
    osTickId: osTickCounterV1_1,
    lastLoop: lastOsLoopResultV1_1,
    executionState: getExecutionStateV1(),
    fieldGraph: getAttentionFieldGraphV1()
  });
}

export function getCastleOsSnapshotV1_8() {
  return getCastleOsSnapshotV1_9();
}

export function getCastleOsSnapshotV1_7() {
  return getCastleOsSnapshotV1_8();
}

export function getCastleOsSnapshotV1_6() {
  return getCastleOsSnapshotV1_7();
}

export function getCastleOsSnapshotV1_5() {
  return getCastleOsSnapshotV1_6();
}

export function getCastleOsSnapshotV1_4() {
  return getCastleOsSnapshotV1_5();
}

export function getCastleOsSnapshotV1_3() {
  return getCastleOsSnapshotV1_4();
}

export function getCastleOsSnapshotV1_2() {
  return getCastleOsSnapshotV1_3();
}

export function getCastleOsSnapshotV1_1() {
  return getCastleOsSnapshotV1_2();
}

export function getCastleOsSnapshotV1() {
  return getCastleOsSnapshotV1_1();
}

function publishOsSnapshotV1_1(result) {
  if (typeof window === "undefined") return;
  bootstrapPhysicsCloudSyncV1_9();
  window.__castle = window.__castle || {};
  window.__castle.os = getCastleOsSnapshotV1_1();
  window.__castle.lastOsLoop = result;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.castleOs = getCastleOsSnapshotV1_1();
  window.__rhizoh.lastOsLoop = result;
  window.__rhizoh.releaseSpeakExecution = releaseSpeakExecutionV1;
  window.__rhizoh.resumeRealityContext = resumeRealityContextV1_5;
  window.__rhizoh.submitStabilityFeedback = submitStabilityFeedbackV1_6;
  window.__rhizoh.getUserPhysicsProfile = getUserPhysicsProfileV1_7;
  window.__rhizoh.getStabilityLearningTrace = getLearningTraceV1_8;
  window.__rhizoh.exportPhysicsLifecycle = exportPhysicsLifecycleV1_8;
  window.__rhizoh.importPhysicsLifecycle = importPhysicsLifecycleV1_8;
  window.__rhizoh.pushPhysicsCloudSync = pushPhysicsLifecycleCloudSyncV1_9;
  window.__rhizoh.pullPhysicsCloudSync = pullPhysicsLifecycleCloudSyncV1_9;
  window.__rhizoh.registerStabilityCloudSyncAdapter = registerStabilityCloudSyncAdapterV1_9;
  window.__rhizoh.resolvePhysicsSyncUserId = resolvePhysicsSyncUserIdV1_9;
  window.__rhizoh.bootstrapPhysicsCloudSync = bootstrapPhysicsCloudSyncV1_9;
}

/** @internal vitest */
export function __resetCastleOsCoreForTestV1() {
  osTickCounterV1_1 = 0;
  lastOsLoopResultV1_1 = null;
}
