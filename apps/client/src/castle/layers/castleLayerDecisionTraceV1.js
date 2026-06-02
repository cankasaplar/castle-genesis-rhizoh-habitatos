/**
 * Castle Layer decision trace v1.1 — explainability graph (why drop / which layer / rule chain).
 * @see docs/RHIZOH_CASTLE_LAYERS_EVOLUTION_PIPELINE_V1.md
 */

import { CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1, CASTLE_LAYER_STACK_ID_V1 } from "./castleLayerBehaviorGraphV1.js";

export const CASTLE_LAYER_DECISION_TRACE_SCHEMA_V1 = "castle.layer_decision_trace.v1";

const TRACE_RING_MAX_V1 = 12;

/** @type {ReturnType<typeof buildCastleLayerDecisionTraceV1>[]} */
const traceRing = [];

let traceSeq = 0;

/**
 * @param {{
 *   layer: string,
 *   rule: string,
 *   passed: boolean,
 *   detail?: string
 * }} step
 */
function step(step) {
  return Object.freeze({
    layer: step.layer,
    rule: step.rule,
    passed: step.passed === true,
    detail: step.detail ? String(step.detail) : ""
  });
}

/**
 * @param {Record<string, boolean | undefined>} eligibility
 * @param {{ scopeMatch?: boolean, activeUiDomain?: string, uiDomain?: string }} ctx
 */
export function buildCastleLayerDecisionPathV1(eligibility = {}, ctx = {}) {
  const scopeMatch = eligibility.scopeMatch !== false && ctx.scopeMatch !== false;
  const path = [
    step({
      layer: CASTLE_LAYER_STACK_ID_V1.L0_PERCEPTION,
      rule: "has_text",
      passed: eligibility.hasText !== false,
      detail: eligibility.hasText === false ? "empty transcript" : "ok"
    }),
    step({
      layer: CASTLE_LAYER_STACK_ID_V1.L2_VOICE_DOMAIN,
      rule: "scope_match",
      passed: scopeMatch,
      detail: scopeMatch
        ? "ui domain aligned"
        : `expected ${ctx.activeUiDomain || "?"} got ${ctx.uiDomain || "?"}`
    }),
    step({
      layer: CASTLE_LAYER_STACK_ID_V1.L1_COGNITIVE,
      rule: "sanity_gate",
      passed: eligibility.sanityAccepted !== false,
      detail: eligibility.sanityReason || (eligibility.sanityAccepted === false ? "sanity_reject" : "ok")
    }),
    step({
      layer: CASTLE_LAYER_STACK_ID_V1.L1_COGNITIVE,
      rule: "confidence_router",
      passed: eligibility.routerAccepted !== false,
      detail: eligibility.routerReason || (eligibility.routerAccepted === false ? "router_reject" : "ok")
    }),
    step({
      layer: CASTLE_LAYER_STACK_ID_V1.L3_SOCIAL_KERNEL,
      rule: "behavior_commitment",
      passed: eligibility.commitmentAllowed !== false,
      detail: eligibility.commitmentReason || (eligibility.commitmentAllowed === false ? "llm_skip" : "ok")
    }),
    step({
      layer: CASTLE_LAYER_STACK_ID_V1.L4_EXECUTION,
      rule: "dispatch_dedup",
      passed: eligibility.dedupOk !== false,
      detail: eligibility.dedupReason || (eligibility.dedupOk === false ? "dedup_hit" : "ok")
    })
  ];
  return path;
}

/**
 * @param {ReturnType<typeof buildCastleLayerDecisionPathV1>} decisionPath
 * @param {{ scopeMatch?: boolean, shadowOnly?: boolean }} ctx
 */
export function deriveCastleLayerDecisionOutcomeV1(decisionPath, ctx = {}) {
  const failed = decisionPath.find((s) => !s.passed);
  if (!failed) return "execute";
  if (failed.layer === CASTLE_LAYER_STACK_ID_V1.L2_VOICE_DOMAIN && ctx.shadowOnly) return "shadow";
  return "reject";
}

/**
 * @param {{
 *   voiceContext: Record<string, unknown>,
 *   decisionPath: ReturnType<typeof buildCastleLayerDecisionPathV1>,
 *   outcome: string,
 *   eventTag?: string,
 *   preview?: string,
 *   source?: string,
 *   scopeMismatchChain?: { expected: string, got: string, policy: string }[]
 * }} input
 */
export function buildCastleLayerDecisionTraceV1(input) {
  const decisionPath = input.decisionPath || [];
  const failed = decisionPath.find((s) => !s.passed);
  const scopeStep = decisionPath.find((s) => s.rule === "scope_match");
  const scopeMismatchChain =
    input.scopeMismatchChain ||
    (scopeStep && !scopeStep.passed
      ? [
          Object.freeze({
            expected: String(input.voiceContext?.activeUiDomain || "?"),
            got: String(input.voiceContext?.uiDomain || "?"),
            policy: "shadow_only_on_mismatch"
          })
        ]
      : []);

  traceSeq += 1;
  return Object.freeze({
    schema: CASTLE_LAYER_DECISION_TRACE_SCHEMA_V1,
    graphVersion: CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1,
    traceId: `cldt_${traceSeq}_${Date.now().toString(36)}`,
    eventTag: String(input.eventTag || "STT_DISPATCH").trim(),
    outcome: String(input.outcome || "reject"),
    primaryRejectLayer: failed?.layer || null,
    primaryRejectReason: failed ? `${failed.rule}:${failed.detail || "fail"}` : null,
    primaryRejectRule: failed?.rule || null,
    decisionPath,
    scopeMismatchChain,
    eligibilityBreakdown: Object.freeze({
      hasText: decisionPath.find((s) => s.rule === "has_text")?.passed !== false,
      scopeMatch: decisionPath.find((s) => s.rule === "scope_match")?.passed !== false,
      sanityAccepted: decisionPath.find((s) => s.rule === "sanity_gate")?.passed !== false,
      routerAccepted: decisionPath.find((s) => s.rule === "confidence_router")?.passed !== false,
      commitmentAllowed: decisionPath.find((s) => s.rule === "behavior_commitment")?.passed !== false,
      dedupOk: decisionPath.find((s) => s.rule === "dispatch_dedup")?.passed !== false
    }),
    voiceContext: input.voiceContext,
    preview: String(input.preview || "").slice(0, 96),
    source: String(input.source || ""),
    atMs: Date.now()
  });
}

/** @param {ReturnType<typeof buildCastleLayerDecisionTraceV1>} trace */
export function recordCastleLayerDecisionTraceV1(trace) {
  traceRing.unshift(trace);
  if (traceRing.length > TRACE_RING_MAX_V1) traceRing.length = TRACE_RING_MAX_V1;
  if (typeof window !== "undefined") {
    window.__CASTLE_LAYERS_DECISION_TRACE__ = Object.freeze({
      graphVersion: CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1,
      last: trace,
      recent: traceRing.slice(0, 5)
    });
    const runtime = window.__CASTLE_LAYERS_RUNTIME__ || {};
    window.__CASTLE_LAYERS_RUNTIME__ = Object.freeze({
      ...runtime,
      graphVersion: CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1,
      lastDecisionTrace: trace
    });
  }
  return trace;
}

export function getCastleLayerDecisionTraceSnapshotV1() {
  if (typeof window !== "undefined" && window.__CASTLE_LAYERS_DECISION_TRACE__) {
    return window.__CASTLE_LAYERS_DECISION_TRACE__;
  }
  return Object.freeze({ last: traceRing[0] || null, recent: traceRing.slice(0, 5) });
}

/** Compact fields for voice production logs / HUD. */
export function castleLayerDecisionTraceLogDetailV1(trace) {
  if (!trace) return {};
  return {
    decisionTraceId: trace.traceId,
    decisionOutcome: trace.outcome,
    primaryRejectLayer: trace.primaryRejectLayer,
    primaryRejectReason: trace.primaryRejectReason,
    primaryRejectRule: trace.primaryRejectRule,
    decisionPath: trace.decisionPath
      .map((s) => `${s.layer}:${s.rule}=${s.passed ? 1 : 0}`)
      .join(" → "),
    scopeMismatchChain: trace.scopeMismatchChain
  };
}

export function resetCastleLayerDecisionTraceForTestV1() {
  traceRing.length = 0;
  traceSeq = 0;
  if (typeof window !== "undefined") {
    delete window.__CASTLE_LAYERS_DECISION_TRACE__;
  }
}
