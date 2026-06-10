/**
 * Castle Execution Layer v1 — sole side-effect zone.
 * Kernel ≠ execution. execute(actionPlan) → voice / memory / shadow / UI only here.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { noteCoPresenceSpikeResponseV1 } from "../rhizoh/runtime/rhizohCoPresenceRuntimeV1.js";
import {
  adaptFabricSpikeForVoicePipelineV1,
  anchorTemporalMemoryV1
} from "../rhizoh/runtime/rhizohExperienceFabricV1.js";
import { scaffoldShadowTurnV0 } from "../rhizoh/runtime/rhizohShadowTurnScaffoldV0.js";
import {
  beginExecutionV1,
  completeExecutionV1,
  getExecutionStateV1
} from "./castleExecutionStateV1.js";
import { writeThreadMemoryV1_2 } from "./castleConversationThreadV1_2.js";

export const CASTLE_EXECUTION_LAYER_SCHEMA_V1 = "castle.execution_layer.v1";
export const CASTLE_EXECUTION_LAYER_SCHEMA_V1_1 = "castle.execution_layer.v1.1";
export const CASTLE_EXECUTION_LAYER_SCHEMA_V1_3 = "castle.execution_layer.v1.3";

/** @type {object[]} */
const executionLogV1 = [];
const EXEC_LOG_MAX_V1 = 64;

/**
 * Execute ActionPlan — deterministic side effects only.
 * @param {object} actionPlan
 * @param {object} [ctx]
 */
export function executeActionPlanV1(actionPlan, ctx = {}) {
  const atMs = Number(ctx.atMs) || Date.now();
  /** @type {string[]} */
  const effects = [];

  if (actionPlan.speak) {
    noteCoPresenceSpikeResponseV1({
      respond: true,
      kind: actionPlan.spikeType || "intent",
      atMs
    });
    effects.push("tts_dispatch");
  } else if (actionPlan.backgroundNarrative) {
    noteCoPresenceSpikeResponseV1({
      respond: true,
      kind: "background_narrative",
      atMs
    });
    effects.push("tts_background_narrative");
  }

  if (actionPlan.memoryWrite) {
    anchorTemporalMemoryV1({
      intent: "memory_write",
      atMs,
      preview: ctx.preview || ctx.text,
      mediaPositionMs: ctx.mediaPositionMs,
      source: ctx.source || "mic",
      semanticCluster: ctx.preview?.slice(0, 48) || "moment"
    });
    if (ctx.threadId) {
      writeThreadMemoryV1_2({
        threadId: ctx.threadId,
        ownerId: ctx.ownerId,
        preview: ctx.preview || ctx.text,
        mediaPositionMs: ctx.mediaPositionMs,
        atMs
      });
      effects.push("thread_memory_write");
    }
    effects.push("memory_graph_write");
  }

  if (actionPlan.shadowWrite) {
    scaffoldShadowTurnV0({
      text: ctx.text || ctx.preview || "",
      confidence: ctx.confidence,
      band: ctx.band,
      accepted: false,
      source: ctx.source || "mic",
      stage: "castle_os_shadow",
      operatingMode: actionPlan.mode
    });
    effects.push("shadow_log");
  }

  if (actionPlan.uiHighlight) {
    if (typeof window !== "undefined") {
      window.__castle = window.__castle || {};
      window.__castle.lastUiHighlight = Object.freeze({
        atMs,
        mediaPositionMs: ctx.mediaPositionMs ?? null,
        preview: ctx.preview?.slice(0, 120) || null,
        tickId: actionPlan.tickId
      });
    }
    effects.push("ui_highlight");
  }

  const voiceSpike = ctx.fabricSpike
    ? adaptFabricSpikeForVoicePipelineV1({
        ...ctx.fabricSpike,
        respond: actionPlan.speak === true || actionPlan.backgroundNarrative === true
      })
    : Object.freeze({
        respond: actionPlan.speak === true || actionPlan.backgroundNarrative === true,
        kind: actionPlan.backgroundNarrative ? "background_narrative" : actionPlan.spikeType || "none",
        score: actionPlan.speakShare ?? actionPlan.priority / 100,
        utility: actionPlan.speakShare ?? actionPlan.priority / 100,
        preview: ctx.preview || null,
        fabric: false
      });

  const receipt = Object.freeze({
    schema: CASTLE_EXECUTION_LAYER_SCHEMA_V1,
    executed: effects.length > 0,
    effects: Object.freeze(effects),
    actionPlan,
    voiceSpike,
    atMs
  });

  executionLogV1.push(receipt);
  if (executionLogV1.length > EXEC_LOG_MAX_V1) executionLogV1.shift();

  logVoiceInfoV0("CASTLE_EXECUTION_LAYER", {
    effects,
    speak: actionPlan.speak,
    memoryWrite: actionPlan.memoryWrite,
    shadowWrite: actionPlan.shadowWrite,
    uiHighlight: actionPlan.uiHighlight,
    priority: actionPlan.priority,
    latencyBudgetMs: actionPlan.latencyBudgetMs
  });

  if (typeof window !== "undefined") {
    window.__castle = window.__castle || {};
    window.__castle.lastExecution = receipt;
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastExecution = receipt;
  }

  return receipt;
}

/**
 * v1.1 — execute after real-time arbitration gate.
 * @param {object} arbitration
 * @param {object} [ctx]
 */
export function executeArbitratedPlanV1(arbitration, ctx = {}) {
  const atMs = Number(ctx.atMs) || Date.now();

  if (!arbitration?.safeToExecute || !arbitration?.plan) {
    return Object.freeze({
      schema: CASTLE_EXECUTION_LAYER_SCHEMA_V1_1,
      executed: false,
      arbitration,
      voiceSpike: Object.freeze({ respond: false, kind: "none", score: 0 }),
      atMs
    });
  }

  const plan = arbitration.plan;
  const receipt = executeActionPlanV1(plan, ctx);

  if (plan.speak) {
    beginExecutionV1(plan, atMs);
  } else if (!getExecutionStateV1().isRunning) {
    completeExecutionV1(atMs);
  }

  return Object.freeze({
    ...receipt,
    schema: CASTLE_EXECUTION_LAYER_SCHEMA_V1_1,
    arbitration,
    disposition: arbitration.disposition
  });
}

export function releaseSpeakExecutionV1(atMs = Date.now()) {
  return completeExecutionV1(atMs);
}

/**
 * v1.3 — partial / interleaved execution from reality composition.
 * @param {object} composition
 * @param {object} arbitration
 * @param {object} [ctx]
 */
export function executeComposedPlanV1_3(composition, arbitration, ctx = {}) {
  const atMs = Number(ctx.atMs) || Date.now();

  if (!arbitration?.safeToExecute || !composition?.composedPlan) {
    return Object.freeze({
      schema: CASTLE_EXECUTION_LAYER_SCHEMA_V1_3,
      executed: false,
      composition,
      arbitration,
      voiceSpike: Object.freeze({ respond: false, kind: "none", score: 0 }),
      atMs
    });
  }

  const plan = composition.composedPlan;
  const slices = composition.realityFrame?.threadExecutionSlices || [];
  /** @type {string[]} */
  const effects = [];

  const speakActive =
    plan.speak || plan.backgroundNarrative || (plan.speakShare ?? 0) >= 0.1;

  if (speakActive) {
    noteCoPresenceSpikeResponseV1({
      respond: plan.speak === true,
      kind: plan.backgroundNarrative ? "background_narrative" : plan.spikeType || "intent",
      atMs
    });
    effects.push(plan.backgroundNarrative ? "tts_background_narrative" : "tts_dispatch");
  }

  if (plan.memoryWrite || (plan.memoryShare ?? 0) >= 0.15) {
    anchorTemporalMemoryV1({
      intent: "memory_write",
      atMs,
      preview: ctx.preview || ctx.text,
      mediaPositionMs: ctx.mediaPositionMs,
      source: ctx.source || "mic",
      semanticCluster: ctx.preview?.slice(0, 48) || "moment"
    });
    effects.push("memory_graph_write");
  }

  for (const slice of slices) {
    if (slice.memoryShare < 0.1) continue;
    writeThreadMemoryV1_2({
      threadId: slice.threadId,
      ownerId: slice.ownerId,
      preview: ctx.preview || ctx.text,
      mediaPositionMs: ctx.mediaPositionMs,
      atMs
    });
    effects.push(`thread_memory_write:${slice.threadId}`);
  }

  if (ctx.threadId && plan.memoryWrite && !slices.some((s) => s.threadId === ctx.threadId)) {
    writeThreadMemoryV1_2({
      threadId: ctx.threadId,
      ownerId: ctx.ownerId,
      preview: ctx.preview || ctx.text,
      mediaPositionMs: ctx.mediaPositionMs,
      atMs
    });
    effects.push("thread_memory_write");
  }

  if (plan.shadowWrite) {
    scaffoldShadowTurnV0({
      text: ctx.text || ctx.preview || "",
      confidence: ctx.confidence,
      band: ctx.band,
      accepted: false,
      source: ctx.source || "mic",
      stage: "castle_os_shadow",
      operatingMode: plan.mode
    });
    effects.push("shadow_log");
  }

  if (plan.uiHighlight || (plan.highlightShare ?? 0) >= 0.2) {
    if (typeof window !== "undefined") {
      window.__castle = window.__castle || {};
      window.__castle.lastUiHighlight = Object.freeze({
        atMs,
        mediaPositionMs: ctx.mediaPositionMs ?? null,
        preview: ctx.preview?.slice(0, 120) || null,
        tickId: plan.tickId,
        highlightShare: plan.highlightShare ?? 1
      });
    }
    effects.push("ui_highlight");
  }

  const voiceSpike = Object.freeze({
    respond: plan.speak === true || plan.backgroundNarrative === true,
    backgroundNarrative: plan.backgroundNarrative === true,
    kind: plan.backgroundNarrative ? "background_narrative" : plan.spikeType || "intent",
    score: plan.speakShare ?? plan.priority / 100,
    utility: plan.speakShare ?? plan.priority / 100,
    preview: ctx.preview || null,
    fabric: false
  });

  if (speakActive && (plan.speak || plan.backgroundNarrative)) {
    beginExecutionV1(plan, atMs);
  } else if (!getExecutionStateV1().isRunning) {
    completeExecutionV1(atMs);
  }

  const receipt = Object.freeze({
    schema: CASTLE_EXECUTION_LAYER_SCHEMA_V1_3,
    executed: effects.length > 0,
    effects: Object.freeze(effects),
    partialExecution: true,
    composition,
    composedPlan: plan,
    threadSlices: Object.freeze(slices.map((s) => Object.freeze({ ...s }))),
    voiceSpike,
    arbitration,
    disposition: arbitration.disposition,
    atMs
  });

  executionLogV1.push(receipt);
  if (executionLogV1.length > EXEC_LOG_MAX_V1) executionLogV1.shift();

  logVoiceInfoV0("CASTLE_EXECUTION_LAYER", {
    effects,
    partial: true,
    speakShare: plan.speakShare,
    memoryShare: plan.memoryShare,
    highlightShare: plan.highlightShare,
    backgroundNarrative: plan.backgroundNarrative
  });

  if (typeof window !== "undefined") {
    window.__castle = window.__castle || {};
    window.__castle.lastExecution = receipt;
    window.__castle.lastRealityComposition = composition.realityFrame;
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastExecution = receipt;
  }

  return receipt;
}

export function getExecutionLogV1() {
  return Object.freeze(executionLogV1.slice(-16));
}

/** @internal vitest */
export function __resetExecutionLayerForTestV1() {
  executionLogV1.length = 0;
}
