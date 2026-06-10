/**
 * Rhizoh Co-Presence Kernel v1 — Attention → Action compiler.
 * Kernel does NOT interpret; only produces deterministic ActionPlanV1.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1.md
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  clamp01V1,
  shouldCoPresenceRespondV1,
  CO_PRESENCE_SPIKE_KIND_V1
} from "./rhizohCoPresenceRuntimeV1.js";
import {
  computeCastleAttentionFieldV1,
  getAttentionFieldGraphV1,
  ATTENTION_EVENT_TYPE_V1
} from "../../castlePerception/castleAttentionFieldV1.js";
import { evaluateSpikeCollapseV1, SPIKE_TYPE_V1 } from "../../castlePerception/castleSpikeEngineV1.js";
import { runCastleOsLoopV1_5 } from "../../castlePerception/castleOsCoreLoopV1.js";
import { getExecutionStateV1 } from "../../castlePerception/castleExecutionStateV1.js";
import { resolveVoiceAttentionContextV0, VOICE_ATTENTION_MODE_V0 } from "./voiceAttentionContextV0.js";

export const RHIZOH_CO_PRESENCE_KERNEL_SCHEMA_V1 = "rhizoh.co_presence_kernel.v1";
export const ACTION_PLAN_SCHEMA_V1 = "rhizoh.action_plan.v1";

export const PRESENCE_KERNEL_MODE_V1 = Object.freeze({
  COMPANION: "companion",
  CO_PRESENCE: "co_presence",
  AMBIENT_OBSERVER: "ambient_observer",
  EMERGENCY: "emergency"
});

/** @deprecated use ActionPlan flags */
export const KERNEL_OUTPUT_CHANNEL_V1 = Object.freeze({
  SPEAK: "speak",
  MEMORY: "memory",
  SHADOW: "shadow",
  SILENT: "silent"
});

const MODE_PROFILES_V1 = Object.freeze({
  [PRESENCE_KERNEL_MODE_V1.COMPANION]: Object.freeze({
    mode: PRESENCE_KERNEL_MODE_V1.COMPANION,
    speakThreshold: 0.42,
    latencyBudgetMs: 2000,
    basePriority: 60
  }),
  [PRESENCE_KERNEL_MODE_V1.CO_PRESENCE]: Object.freeze({
    mode: PRESENCE_KERNEL_MODE_V1.CO_PRESENCE,
    speakThreshold: 0.52,
    latencyBudgetMs: 3000,
    basePriority: 45
  }),
  [PRESENCE_KERNEL_MODE_V1.AMBIENT_OBSERVER]: Object.freeze({
    mode: PRESENCE_KERNEL_MODE_V1.AMBIENT_OBSERVER,
    speakThreshold: 1.0,
    latencyBudgetMs: 10_000,
    basePriority: 20
  }),
  [PRESENCE_KERNEL_MODE_V1.EMERGENCY]: Object.freeze({
    mode: PRESENCE_KERNEL_MODE_V1.EMERGENCY,
    speakThreshold: 0,
    latencyBudgetMs: 500,
    basePriority: 100
  })
});

const PRIORITY_V1 = Object.freeze({
  EMERGENCY: 100,
  SPEAK: 70,
  MEMORY: 50,
  SHADOW: 20,
  IDLE: 0
});

let runtimeModeOverrideV1 = "";
let lastActionPlanV1 = null;

function readEnvKernelModeV1() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_PRESENCE_KERNEL_MODE ?? "").trim().toLowerCase();
    if (Object.values(PRESENCE_KERNEL_MODE_V1).includes(raw)) return raw;
  } catch {
    /* noop */
  }
  return "";
}

export function resolvePresenceKernelModeV1(input = {}) {
  const topSpike = input.spikes?.[0];
  if (
    topSpike?.type === SPIKE_TYPE_V1.EMERGENCY ||
    input.emergency === true
  ) {
    return MODE_PROFILES_V1[PRESENCE_KERNEL_MODE_V1.EMERGENCY];
  }

  const explicit =
    runtimeModeOverrideV1 ||
    readEnvKernelModeV1() ||
    (input.explicitMode ? String(input.explicitMode).toLowerCase() : "");

  if (Object.values(PRESENCE_KERNEL_MODE_V1).includes(explicit)) {
    return MODE_PROFILES_V1[explicit];
  }

  const attentionCtx = resolveVoiceAttentionContextV0(input);
  if (attentionCtx.mode === VOICE_ATTENTION_MODE_V0.OBSERVER) {
    return MODE_PROFILES_V1[PRESENCE_KERNEL_MODE_V1.AMBIENT_OBSERVER];
  }
  if (attentionCtx.mode === VOICE_ATTENTION_MODE_V0.DIRECT_LISTEN) {
    return MODE_PROFILES_V1[PRESENCE_KERNEL_MODE_V1.COMPANION];
  }
  return MODE_PROFILES_V1[PRESENCE_KERNEL_MODE_V1.CO_PRESENCE];
}

export function setPresenceKernelModeOverrideV1(mode) {
  const m = String(mode || "").toLowerCase();
  runtimeModeOverrideV1 = Object.values(PRESENCE_KERNEL_MODE_V1).includes(m) ? m : "";
  publishKernelSnapshotV1();
}

export function clearPresenceKernelModeOverrideV1() {
  runtimeModeOverrideV1 = "";
}

function isMemorySpikeV1(spike) {
  if (!spike?.preview) return false;
  return /(not\s+al|hatırla|kaydet|bookmark|save\s+this)/i.test(spike.preview);
}

/**
 * decide(spike, field) → ActionPlanV1 — deterministic, no side effects.
 * @param {object} p
 */
export function decideCoPresenceV1(p = {}) {
  const modeProfile = p.modeProfile || resolvePresenceKernelModeV1(p);
  const field = p.field || computeCastleAttentionFieldV1(p.atMs);
  const graph = p.graph || getAttentionFieldGraphV1();
  const spike = p.spikes?.[0] || p.spike || null;
  const salience = clamp01V1(spike?.salienceScore ?? field.intentMass ?? 0);

  const planBase = {
    schema: ACTION_PLAN_SCHEMA_V1,
    deterministic: true,
    tickId: graph.tickId,
    mode: modeProfile.mode,
    speak: false,
    memoryWrite: false,
    shadowWrite: false,
    uiHighlight: false,
    priority: PRIORITY_V1.IDLE,
    latencyBudgetMs: modeProfile.latencyBudgetMs,
    spikeType: spike?.type || null,
    reason: "idle"
  };

  if (spike?.type === SPIKE_TYPE_V1.EMERGENCY || modeProfile.mode === PRESENCE_KERNEL_MODE_V1.EMERGENCY) {
    return Object.freeze({
      ...planBase,
      mode: PRESENCE_KERNEL_MODE_V1.EMERGENCY,
      speak: true,
      priority: PRIORITY_V1.EMERGENCY,
      latencyBudgetMs: 500,
      reason: "emergency_override"
    });
  }

  if (modeProfile.mode === PRESENCE_KERNEL_MODE_V1.AMBIENT_OBSERVER) {
    const memoryWrite = isMemorySpikeV1(spike) || spike?.type === SPIKE_TYPE_V1.REFERENCE;
    return Object.freeze({
      ...planBase,
      memoryWrite,
      shadowWrite: !memoryWrite,
      uiHighlight: spike?.type === SPIKE_TYPE_V1.REFERENCE,
      priority: memoryWrite ? PRIORITY_V1.MEMORY : PRIORITY_V1.SHADOW,
      reason: memoryWrite ? "ambient_memory" : "ambient_shadow"
    });
  }

  const coGate = shouldCoPresenceRespondV1({
    kind: mapSpikeToCoKindV1(spike),
    relevance: salience,
    contextAwareness: field.userStreamPriority,
    hasName: spike?.type === SPIKE_TYPE_V1.SOCIAL_CALL,
    atMs: p.atMs
  });

  let speak = false;
  if (modeProfile.mode === PRESENCE_KERNEL_MODE_V1.COMPANION) {
    speak = !!spike && salience >= modeProfile.speakThreshold;
  } else if (modeProfile.mode === PRESENCE_KERNEL_MODE_V1.CO_PRESENCE) {
    speak = !!spike && salience >= modeProfile.speakThreshold;
  } else {
    speak = coGate.respond && !!spike && salience >= modeProfile.speakThreshold;
  }

  const memoryWrite = isMemorySpikeV1(spike);
  const uiHighlight =
    spike?.type === SPIKE_TYPE_V1.REFERENCE || spike?.type === SPIKE_TYPE_V1.ANALYTICAL;

  if (speak) {
    return Object.freeze({
      ...planBase,
      speak: true,
      memoryWrite,
      uiHighlight,
      priority: PRIORITY_V1.SPEAK,
      reason: coGate.reason || "spike_speak"
    });
  }

  if (memoryWrite) {
    return Object.freeze({
      ...planBase,
      memoryWrite: true,
      uiHighlight,
      priority: PRIORITY_V1.MEMORY,
      reason: "memory_write"
    });
  }

  if (salience > 0.1 || field.narrativeMass > 0.12) {
    return Object.freeze({
      ...planBase,
      shadowWrite: true,
      uiHighlight,
      priority: PRIORITY_V1.SHADOW,
      reason: "shadow_accumulate"
    });
  }

  return Object.freeze(planBase);
}

function mapSpikeToCoKindV1(spike) {
  if (!spike) return CO_PRESENCE_SPIKE_KIND_V1.NONE;
  if (spike.type === SPIKE_TYPE_V1.EMERGENCY) return CO_PRESENCE_SPIKE_KIND_V1.EMERGENCY;
  if (spike.type === SPIKE_TYPE_V1.SOCIAL_CALL) return CO_PRESENCE_SPIKE_KIND_V1.NAME_CALL;
  if (spike.type === SPIKE_TYPE_V1.ANALYTICAL) return CO_PRESENCE_SPIKE_KIND_V1.ANALYTICAL;
  if (spike.type === SPIKE_TYPE_V1.INTENT) return CO_PRESENCE_SPIKE_KIND_V1.QUESTION;
  return CO_PRESENCE_SPIKE_KIND_V1.NONE;
}

/** @deprecated alias */
export function compileActionPlanV1(p = {}) {
  return decideCoPresenceV1(p);
}

export function evaluateActionPlanV1(input = {}) {
  const plan = decideCoPresenceV1(input);
  lastActionPlanV1 = plan;
  return plan;
}

export function routeAttentionDecisionV1(p = {}) {
  const plan = decideCoPresenceV1(p);
  let channel = KERNEL_OUTPUT_CHANNEL_V1.SILENT;
  if (plan.speak) channel = KERNEL_OUTPUT_CHANNEL_V1.SPEAK;
  else if (plan.memoryWrite) channel = KERNEL_OUTPUT_CHANNEL_V1.MEMORY;
  else if (plan.shadowWrite) channel = KERNEL_OUTPUT_CHANNEL_V1.SHADOW;

  return Object.freeze({
    channel,
    speak: plan.speak,
    respond: plan.speak,
    reason: plan.reason,
    mode: plan.mode,
    relevance: plan.priority / 100,
    actionPlan: plan
  });
}

/**
 * Full Castle OS ingress — delegates to core loop (kernel has no execution).
 * @param {object} input
 */
export function processPresenceKernelIngressV1(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const osResult = runCastleOsLoopV1_5({ ...input, source: input.source || "mic", atMs });
  const actionPlan = osResult.actionPlan;

  logVoiceInfoV0("CO_PRESENCE_KERNEL", {
    mode: actionPlan.mode,
    speak: actionPlan.speak,
    memoryWrite: actionPlan.memoryWrite,
    shadowWrite: actionPlan.shadowWrite,
    uiHighlight: actionPlan.uiHighlight,
    priority: actionPlan.priority,
    fieldTickId: osResult.graph?.tickId,
    spikeType: osResult.spikes?.[0]?.type || null,
    roomDisposition: osResult.roomArbitration?.disposition || null
  });

  lastActionPlanV1 = actionPlan;

  const kernelResult = Object.freeze({
    schema: RHIZOH_CO_PRESENCE_KERNEL_SCHEMA_V1,
    mode: actionPlan.mode,
    actionPlan,
    roomArbitration: osResult.roomArbitration,
    realityComposition: osResult.realityComposition,
    realityDynamics: osResult.realityDynamics,
    realityStability: osResult.realityStability,
    arbitration: osResult.arbitration,
    coherence: osResult.coherence,
    decision: routeAttentionDecisionV1({
      spikes: osResult.spikes,
      field: osResult.field,
      graph: osResult.graph,
      atMs
    }),
    spikes: osResult.spikes,
    voiceSpike: osResult.voiceSpike,
    execution: osResult.execution,
    executionState: getExecutionStateV1(),
    field: osResult.field,
    graph: osResult.graph,
    atMs
  });

  publishKernelSnapshotV1(kernelResult);
  return kernelResult;
}

export function getCoPresenceKernelSnapshotV1() {
  return Object.freeze({
    schema: RHIZOH_CO_PRESENCE_KERNEL_SCHEMA_V1,
    identity: "attention_action_compiler",
    role: "rtaos_decision_kernel_no_execution",
    modes: PRESENCE_KERNEL_MODE_V1,
    activeMode: resolvePresenceKernelModeV1().mode,
    actionPlanSchema: ACTION_PLAN_SCHEMA_V1,
    lastActionPlan: lastActionPlanV1,
    field: computeCastleAttentionFieldV1()
  });
}

/** @param {object} [lastResult] */
function publishKernelSnapshotV1(lastResult) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.coPresenceKernel = getCoPresenceKernelSnapshotV1();
  if (lastResult) {
    window.__rhizoh.lastKernelDecision = lastResult;
    window.__rhizoh.lastActionPlan = lastResult.actionPlan;
  }
  window.__rhizoh.setPresenceKernelMode = setPresenceKernelModeOverrideV1;
  window.__rhizoh.clearPresenceKernelMode = clearPresenceKernelModeOverrideV1;
}

/** @internal vitest */
export function __resetCoPresenceKernelForTestV1() {
  runtimeModeOverrideV1 = "";
  lastActionPlanV1 = null;
}
