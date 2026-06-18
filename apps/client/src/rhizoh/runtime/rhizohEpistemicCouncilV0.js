/**
 * Epistemic Council v0 — gatekeeper only (observation augmentation, never execution).
 * Phase 5: gateway collect/rank/synthesize wire + inflation cooldown guards.
 * RESEARCH-ONLY
 */

import { TOPOLOGY_EVENT_TYPES_V0 } from "./rhizohTopologyEventEmitterV0.js";
import { parseChessClusterSlotIdFromMatchIdV0 } from "./chessTelemetryLogV0.js";
import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";
import { appendShadowTraceFromCouncilV0 } from "./rhizohShadowTraceLedgerV0.js";
import { fetchCouncilAnomalyReasoningV0 } from "./rhizohEpistemicCouncilClientV0.js";
import {
  assessEpistemicGraphInflationRiskV0,
  recordCouncilTriggerForInflationGuardV0
} from "./rhizohEpistemicGraphInflationGuardV0.js";
import { getEpistemicMemoryGraphComplianceSummaryV0 } from "./rhizohEpistemicMemoryGraphV0.js";

export const RHIZOH_EPISTEMIC_COUNCIL_SCHEMA_V0 = "castle.rhizoh.epistemic_council.v0";
export const RHIZOH_EPISTEMIC_COUNCIL_EVENT_V0 = "rhizoh:epistemic-council-v0";

export const COUNCIL_SESSION_PHASE_V0 = Object.freeze({
  INIT: "INIT",
  COLLECT: "COLLECT",
  RANK: "RANK",
  SYNTHESIZE: "SYNTHESIZE",
  EMIT_OBSERVATION: "EMIT_OBSERVATION",
  CLOSED: "CLOSED"
});

export const COUNCIL_MEMORY_KIND_V0 = Object.freeze({
  CONTEXTUAL_ANNOTATION: "contextual_annotation"
});

export const COUNCIL_TRIGGER_KIND_V0 = Object.freeze({
  POLICY_DIFF_DRIFT: "policy_diff_drift",
  TOPOLOGY_DRIFT: "topology_drift",
  STOCKFISH_TIMEOUT: "stockfish_timeout",
  EVAL_VARIANCE: "eval_variance"
});

/** Council output must never feed drift detection (feedback loop isolation). */
export const COUNCIL_OBSERVATION_GOVERNANCE_V0 = Object.freeze({
  feedsDriftDetection: false,
  feedsMoveSelection: false,
  feedsPolicyDiff: false,
  epistemicRole: "contextual_annotation"
});

const DRIFT_TRIGGER_THRESHOLD_V0 = 0.5;
const SESSION_TTL_MS_V0 = 120_000;
const COUNCIL_COOLDOWN_MS_V0 = 60_000;

/** @type {Map<string, object>} */
const sessionsV0 = new Map();
/** @type {Map<string, number>} matchKey → last council atMs */
const lastCouncilAtByMatchKeyV0 = new Map();

/** @type {object|null} */
let lastAnomalyReasoningV0 = null;

let sessionSeqV0 = 0;

/**
 * @param {object} ctx
 * @returns {object|null}
 */
export function evaluateCouncilTriggerV0(ctx = {}) {
  const triggers = [];

  if (ctx.policyDiff?.drifted === true) {
    triggers.push(COUNCIL_TRIGGER_KIND_V0.POLICY_DIFF_DRIFT);
  }

  const driftMag = Number(ctx.driftMagnitude ?? ctx.drift?.magnitude) || 0;
  if (
    ctx.topologyEventType === TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED ||
    driftMag >= DRIFT_TRIGGER_THRESHOLD_V0
  ) {
    triggers.push(COUNCIL_TRIGGER_KIND_V0.TOPOLOGY_DRIFT);
  }

  if (ctx.stockfishTimeout === true) {
    triggers.push(COUNCIL_TRIGGER_KIND_V0.STOCKFISH_TIMEOUT);
  }

  if (Number(ctx.evalVariance) >= 0.35) {
    triggers.push(COUNCIL_TRIGGER_KIND_V0.EVAL_VARIANCE);
  }

  if (!triggers.length) return null;

  return Object.freeze({
    schema: RHIZOH_EPISTEMIC_COUNCIL_SCHEMA_V0,
    shouldInvoke: true,
    triggers: Object.freeze([...new Set(triggers)]),
    matchId: ctx.matchId || null,
    slotId: ctx.slotId ?? parseChessClusterSlotIdFromMatchIdV0(ctx.matchId),
    fen: ctx.fen || ctx.fenBefore || null,
    stressRunId: ctx.stressRunId || null,
    conflictGraph: ctx.conflictGraph || null,
    atMs: Date.now()
  });
}

/**
 * @param {object} triggerEval
 * @returns {object|null}
 */
export function evaluateCouncilCooldownV0(triggerEval) {
  if (!triggerEval) return null;
  if (triggerEval.bypassCooldown === true) return null;
  const matchKey = triggerEval.matchId || `slot_${triggerEval.slotId ?? "na"}`;
  const lastAt = lastCouncilAtByMatchKeyV0.get(matchKey) || 0;
  const elapsed = Date.now() - lastAt;
  if (elapsed < COUNCIL_COOLDOWN_MS_V0) {
    return Object.freeze({
      throttled: true,
      matchKey,
      cooldownMs: COUNCIL_COOLDOWN_MS_V0 - elapsed,
      reason: "council_match_cooldown"
    });
  }
  return null;
}

/**
 * @param {object} triggerEval
 */
export function createCouncilSessionV0(triggerEval) {
  sessionSeqV0 += 1;
  const sessionId = `council_${sessionSeqV0}_${Date.now().toString(36)}`;
  const session = Object.freeze({
    schema: RHIZOH_EPISTEMIC_COUNCIL_SCHEMA_V0,
    sessionId,
    phase: COUNCIL_SESSION_PHASE_V0.INIT,
    trigger: triggerEval,
    createdAtMs: Date.now(),
    governance: COUNCIL_OBSERVATION_GOVERNANCE_V0
  });
  sessionsV0.set(sessionId, { ...session, phase: COUNCIL_SESSION_PHASE_V0.INIT });
  return session;
}

/**
 * @param {string} sessionId
 * @param {string} nextPhase
 */
function advanceCouncilPhaseV0(sessionId, nextPhase) {
  const row = sessionsV0.get(sessionId);
  if (!row) return null;
  const updated = Object.freeze({ ...row, phase: nextPhase, atMs: Date.now() });
  sessionsV0.set(sessionId, updated);
  return updated;
}

/**
 * Gateway-first council pipeline with dry-run fallback.
 * @param {object} triggerEval
 */
export async function runEpistemicCouncilPipelineV0(triggerEval) {
  const session = createCouncilSessionV0(triggerEval);
  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.COLLECT);

  const gatewayResult = await fetchCouncilAnomalyReasoningV0({
    matchId: triggerEval.matchId,
    slotId: triggerEval.slotId,
    fen: triggerEval.fen,
    triggers: triggerEval.triggers,
    sessionId: session.sessionId,
    stressRunId: triggerEval.stressRunId || null,
    conflictGraph: triggerEval.conflictGraph || null,
    memoryGraph: getEpistemicMemoryGraphComplianceSummaryV0()
  });

  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.RANK);
  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.SYNTHESIZE);

  const gatewayOk = Boolean(gatewayResult?.ok);
  const anomalyScore = gatewayOk
    ? Number(gatewayResult.anomalyScore) || 0
    : Number(Math.min(1, (triggerEval.triggers?.length || 1) * 0.2).toFixed(4));
  const reasoningChain = gatewayOk
    ? gatewayResult.reasoningChain
    : Object.freeze([
        Object.freeze({ step: "FALLBACK", atMs: Date.now(), reason: gatewayResult?.reason })
      ]);
  const synthesis = gatewayOk
    ? gatewayResult.synthesis
    : "Council dry-run fallback: gateway unreachable; local annotation only.";
  const lenses = gatewayOk ? gatewayResult.lenses || Object.freeze([]) : Object.freeze([]);

  const observation = Object.freeze({
    schema: RHIZOH_EPISTEMIC_COUNCIL_SCHEMA_V0,
    sessionId: session.sessionId,
    kind: COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION,
    triggers: triggerEval.triggers,
    matchId: triggerEval.matchId,
    slotId: triggerEval.slotId,
    fen: triggerEval.fen,
    synthesis,
    lenses: Object.freeze(lenses || []),
    anomalyScore,
    reasoningChain,
    gatewayOk,
    gatewayReason: gatewayOk ? null : gatewayResult?.reason || "fallback",
    graphInflationRisk: assessEpistemicGraphInflationRiskV0(),
    governance: COUNCIL_OBSERVATION_GOVERNANCE_V0,
    atMs: Date.now()
  });

  lastAnomalyReasoningV0 = Object.freeze({
    sessionId: session.sessionId,
    anomalyScore,
    reasoningChain,
    gatewayOk,
    severity: gatewayResult?.gateway?.severity || null,
    atMs: Date.now()
  });

  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.EMIT_OBSERVATION);

  writeChessClusterMemoryNodeV0({
    kind: COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION,
    slotId: triggerEval.slotId,
    matchId: triggerEval.matchId,
    summary: observation.synthesis,
    reinforcement: 0,
    observation: Object.freeze({
      ...observation,
      governance: COUNCIL_OBSERVATION_GOVERNANCE_V0
    })
  });

  appendShadowTraceFromCouncilV0(observation);

  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.CLOSED);

  const matchKey = triggerEval.matchId || `slot_${triggerEval.slotId ?? "na"}`;
  lastCouncilAtByMatchKeyV0.set(matchKey, Date.now());
  recordCouncilTriggerForInflationGuardV0();

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.epistemicCouncil = Object.freeze({
      lastSession: session,
      lastObservation: observation,
      lastAnomalyReasoning: lastAnomalyReasoningV0,
      sessionCount: sessionSeqV0,
      cooldownMs: COUNCIL_COOLDOWN_MS_V0,
      triggerPipeline: (ctx = {}) => {
        const ev = evaluateCouncilTriggerV0(ctx);
        if (!ev) return null;
        const throttle = evaluateCouncilCooldownV0(ev);
        if (throttle) return throttle;
        void runEpistemicCouncilPipelineV0(ev).catch(() => null);
        return ev;
      }
    });
    window.__rhizoh.councilAnomalyReasoning = lastAnomalyReasoningV0;
    void import("./rhizohShadowDevToolsRefreshV0.js")
      .then((mod) => mod.refreshRhizohShadowDevToolsV0())
      .catch(() => null);
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_EPISTEMIC_COUNCIL_EVENT_V0, { detail: observation })
      );
    } catch {
      /* noop */
    }
  }

  return observation;
}

/** @deprecated alias — use runEpistemicCouncilPipelineV0 */
export async function runEpistemicCouncilDryRunV0(triggerEval) {
  return runEpistemicCouncilPipelineV0(triggerEval);
}

/**
 * Non-blocking council enqueue — never touches move pipeline.
 * @param {object} ctx
 */
export function maybeEnqueueEpistemicCouncilV0(ctx = {}) {
  if (ctx.sourceKind === COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION) return null;
  const triggerEval = evaluateCouncilTriggerV0(ctx);
  if (!triggerEval?.shouldInvoke) return null;
  const throttle = evaluateCouncilCooldownV0(triggerEval);
  if (throttle) return throttle;
  void runEpistemicCouncilPipelineV0(triggerEval).catch(() => null);
  return triggerEval;
}

export function getLastCouncilAnomalyReasoningV0() {
  return lastAnomalyReasoningV0;
}

export function listCouncilSessionsV0() {
  const now = Date.now();
  for (const [id, row] of sessionsV0.entries()) {
    if (now - (row.createdAtMs || 0) > SESSION_TTL_MS_V0) sessionsV0.delete(id);
  }
  return Object.freeze([...sessionsV0.values()]);
}

/** @internal vitest */
export function __resetEpistemicCouncilForTestV0() {
  sessionsV0.clear();
  lastCouncilAtByMatchKeyV0.clear();
  lastAnomalyReasoningV0 = null;
  sessionSeqV0 = 0;
}
