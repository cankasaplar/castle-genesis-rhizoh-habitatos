/**
 * Pulse Governance v0 — wraps priority + semantic filter + output contract.
 * Fault-isolated stages so god-loop failure does not collapse runtime.
 */

import { governPulseEventV0, getPulsePrioritySnapshotV0 } from "./rhizohPulsePriorityEngineV0.js";
import { filterIdentityNoiseV0 } from "./rhizohSemanticCompressionFilterV0.js";
import { routeGovernedOutputV0, getOutputContractSnapshotV0 } from "./rhizohOutputContractRouterV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  evaluateGroundingV1,
  applyGroundingOverrideV1,
  isGovernanceFastPathV1,
  getGroundingLayerSnapshotV1
} from "./rhizohGroundingLayerV1.js";

export const RHIZOH_PULSE_GOVERNANCE_SCHEMA_V0 = "rhizoh.pulse_governance.v0";

/** @type {object[]} */
const stageFailuresV0 = [];

/**
 * Fault-isolated pulse stage — one subsystem fail ≠ whole loop fail.
 * @param {string} stage
 * @param {() => unknown} fn
 * @param {unknown} fallback
 */
export function safePulseStageV0(stage, fn, fallback) {
  try {
    const result = fn();
    return Object.freeze({ ok: true, stage, result, degraded: false, usedFallback: false });
  } catch (err) {
    const failure = Object.freeze({
      stage,
      atMs: Date.now(),
      error: String(err?.message || err)
    });
    stageFailuresV0.push(failure);
    if (stageFailuresV0.length > 16) stageFailuresV0.shift();
    logVoiceInfoV0("PULSE_STAGE_FAULT", failure);
    return Object.freeze({
      ok: false,
      stage,
      result: fallback,
      degraded: true,
      usedFallback: true,
      error: failure.error
    });
  }
}

/**
 * Govern a candidate emission before it reaches voice/UI/log.
 * @param {object} candidate
 * @param {object} ctx
 */
export function governPulseEmissionV0(candidate = {}, ctx = {}) {
  const eventKey = {
    presenceKind: candidate.presenceKind || candidate.kind,
    schedulerKind: candidate.schedulerKind || candidate.intent,
    type: candidate.type || "presence_emit",
    intent: candidate.intent,
    userInitiated: candidate.userInitiated
  };

  const fastPath = isGovernanceFastPathV1(eventKey);
  let governance = governPulseEventV0(eventKey, ctx);
  const semantic = fastPath
    ? Object.freeze({ fastPath: true, semanticMass: semanticMassFromCtxV0(ctx) })
    : filterIdentityNoiseV0(ctx.eventLog || { recent: [] });

  const grounding = evaluateGroundingV1({
    governance,
    semanticMass: semantic.semanticMass ?? 0,
    eventLog: ctx.eventLog,
    transport: ctx.transport
  });

  if (!fastPath && grounding.unexpectedImportant) {
    governance = applyGroundingOverrideV1(governance, grounding);
  }

  return Object.freeze({
    schema: RHIZOH_PULSE_GOVERNANCE_SCHEMA_V0,
    governance,
    semantic,
    grounding,
    fastPath,
    candidate: Object.freeze({
      phrase: candidate.phrase,
      kind: candidate.kind,
      intent: candidate.intent
    }),
    shouldRoute: Boolean(candidate.phrase),
    wouldBlock: !governance.emit,
    observationOnly: true
  });
}

function semanticMassFromCtxV0(ctx) {
  if (ctx.eventLog?.recent?.length) {
    return ctx.eventLog.recent
      .filter((r) => r.identityMeaningful)
      .reduce((s, r) => s + (r.semanticWeight || 0), 0);
  }
  return 0;
}

/**
 * Route governed emission through output contract.
 * @param {object} governed — from governPulseEmissionV0
 * @param {object} payload
 */
export function executeGovernedEmissionV0(governed, payload = {}) {
  if (!governed?.shouldRoute) {
    return Object.freeze({ ok: false, reason: "governance_blocked" });
  }
  return routeGovernedOutputV0(governed.governance, {
    phrase: payload.phrase || governed.candidate.phrase,
    signature: payload.signature,
    traceId: payload.traceId
  });
}

export function getPulseGovernanceSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_PULSE_GOVERNANCE_SCHEMA_V0,
    priority: getPulsePrioritySnapshotV0(),
    outputContract: getOutputContractSnapshotV0(),
    grounding: getGroundingLayerSnapshotV1(),
    recentStageFailures: Object.freeze(stageFailuresV0.slice(-4)),
    role: "governor_with_grounding"
  });
}

/** @internal vitest */
export function __resetPulseGovernanceForTestV0() {
  stageFailuresV0.length = 0;
}
