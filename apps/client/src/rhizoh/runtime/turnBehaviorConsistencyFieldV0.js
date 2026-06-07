/**
 * Turn Behavior Consistency Field v0 — long-horizon drift observability (RESEARCH-ONLY).
 * Answers: "Rhizoh bugün neden daha sessiz?" / presence frequency / silent_observe rate.
 */

import { getTurnSovereigntyTraceV0 } from "./behavioralTurnSovereigntyV0.js";
import { getTurnSovereigntyConflictHeatmapV0 } from "./behavioralTurnSovereigntyV0.js";
import {
  getPromptBoundaryViolationRingV0,
  getSilentOverrideHeatmapV0
} from "./turnSovereigntyPromptFirewallV0.js";
import { readTurnSovereigntyEnforcementModeV0 } from "./turnSovereigntyEnforcementModeV0.js";
import { SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0 } from "./turnSovereigntyObservationExecutionInvariantV0.js";

export const TURN_BEHAVIOR_CONSISTENCY_FIELD_SCHEMA_V0 =
  "castle.rhizoh.turn_behavior_consistency_field.v0";

/**
 * @param {object[]} trace
 */
function countByRealityV0(trace) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const t of trace) {
    const r = String(t?.sovereignReality || "unknown");
    out[r] = (out[r] || 0) + 1;
  }
  return out;
}

/**
 * @param {object[]} trace
 */
function silentObserveRateV0(trace) {
  if (!trace.length) return 0;
  const n = trace.filter((t) => t?.sovereignReality === "silent_observe").length;
  return Math.round((n / trace.length) * 1000) / 1000;
}

/**
 * @param {object[]} trace
 */
function noLockEscapeRateV0(trace) {
  if (!trace.length) return 0;
  const n = trace.filter((t) => t?.noLockEscapeApplied === true).length;
  return Math.round((n / trace.length) * 1000) / 1000;
}

/**
 * @param {object[]} trace
 */
function presenceAckRateV0(trace) {
  if (!trace.length) return 0;
  const n = trace.filter((t) => t?.sovereignReality === "presence_ack").length;
  return Math.round((n / trace.length) * 1000) / 1000;
}

/**
 * @param {object[]} trace
 */
function buildDriftSignalsV0(trace) {
  const signals = [];
  const silentRate = silentObserveRateV0(trace);
  const escapeRate = noLockEscapeRateV0(trace);
  const presenceRate = presenceAckRateV0(trace);

  if (silentRate > 0.35) {
    signals.push({
      code: "elevated_silent_observe",
      severity: silentRate > 0.55 ? "high" : "medium",
      value: silentRate,
      hint: "Authority starvation risk — check voice gate / no-lock escape"
    });
  }
  if (escapeRate > 0.18) {
    signals.push({
      code: "no_lock_escape_pressure",
      severity: "medium",
      value: escapeRate,
      hint: "Many turns fell through to safe LLM fallback"
    });
  }
  if (presenceRate > 0.45) {
    signals.push({
      code: "high_presence_ack_share",
      severity: "low",
      value: presenceRate,
      hint: "Presence-dominant session — expected for wake/presence testing"
    });
  }

  const llmShare = trace.length
    ? trace.filter((t) => t?.sovereignReality === "llm_conversation").length / trace.length
    : 0;
  if (llmShare < 0.2 && trace.length >= 8) {
    signals.push({
      code: "low_llm_conversation_share",
      severity: "medium",
      value: Math.round(llmShare * 1000) / 1000,
      hint: "Rhizoh may feel quieter — LLM reality under-selected"
    });
  }

  return Object.freeze(signals);
}

export function buildTurnBehaviorConsistencyFieldV0() {
  const trace = getTurnSovereigntyTraceV0();
  const byReality = countByRealityV0(trace);
  const signals = buildDriftSignalsV0(trace);

  return Object.freeze({
    schema: TURN_BEHAVIOR_CONSISTENCY_FIELD_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesAuthority: false,
    layerWeightPolicy: SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0,
    enforcementMode: readTurnSovereigntyEnforcementModeV0(),
    sampleSize: trace.length,
    realityDistribution: Object.freeze({ ...byReality }),
    rates: Object.freeze({
      silentObserve: silentObserveRateV0(trace),
      presenceAck: presenceAckRateV0(trace),
      llmConversation: trace.length
        ? Math.round(
            (trace.filter((t) => t?.sovereignReality === "llm_conversation").length / trace.length) * 1000
          ) / 1000
        : 0,
      noLockEscape: noLockEscapeRateV0(trace)
    }),
    driftSignals: signals,
    conflictHeatmap: getTurnSovereigntyConflictHeatmapV0(),
    silentOverrideHeatmap: getSilentOverrideHeatmapV0(),
    boundaryViolationCount: getPromptBoundaryViolationRingV0().length
  });
}

export function publishTurnBehaviorConsistencyFieldV0() {
  const field = buildTurnBehaviorConsistencyFieldV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.turnBehaviorConsistency = field;
  }
  return field;
}
