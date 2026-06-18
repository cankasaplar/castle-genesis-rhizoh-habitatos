/**
 * Epistemic Council v0 — gatekeeper only (observation augmentation, never execution).
 * Triggered on uncertainty spikes; output is contextual_annotation isolated from drift loop.
 * RESEARCH-ONLY
 */

import { TOPOLOGY_EVENT_TYPES_V0 } from "./rhizohTopologyEventEmitterV0.js";
import { parseChessClusterSlotIdFromMatchIdV0 } from "./chessTelemetryLogV0.js";
import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";

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

/** @type {Map<string, object>} */
const sessionsV0 = new Map();

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
    atMs: Date.now()
  });
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
 * Dry-run council pipeline — no external LLM until gateway wired.
 * @param {object} triggerEval
 */
export async function runEpistemicCouncilDryRunV0(triggerEval) {
  const session = createCouncilSessionV0(triggerEval);
  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.COLLECT);
  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.RANK);
  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.SYNTHESIZE);

  const observation = Object.freeze({
    schema: RHIZOH_EPISTEMIC_COUNCIL_SCHEMA_V0,
    sessionId: session.sessionId,
    kind: COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION,
    triggers: triggerEval.triggers,
    matchId: triggerEval.matchId,
    slotId: triggerEval.slotId,
    fen: triggerEval.fen,
    synthesis:
      "Council dry-run: uncertainty spike recorded; multi-model collect/rank deferred to gateway.",
    lenses: Object.freeze([]),
    governance: COUNCIL_OBSERVATION_GOVERNANCE_V0,
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

  advanceCouncilPhaseV0(session.sessionId, COUNCIL_SESSION_PHASE_V0.CLOSED);

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.epistemicCouncil = Object.freeze({
      lastSession: session,
      lastObservation: observation,
      sessionCount: sessionSeqV0
    });
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

/**
 * Non-blocking council enqueue — never touches move pipeline.
 * @param {object} ctx
 */
export function maybeEnqueueEpistemicCouncilV0(ctx = {}) {
  if (ctx.sourceKind === COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION) return null;
  const triggerEval = evaluateCouncilTriggerV0(ctx);
  if (!triggerEval?.shouldInvoke) return null;
  void runEpistemicCouncilDryRunV0(triggerEval).catch(() => null);
  return triggerEval;
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
  sessionSeqV0 = 0;
}
