/**
 * Match truth authority boundary verification v0 — measures single-writer chain.
 * RESEARCH-ONLY — honest reporting; does not fake gateway authority.
 * @see docs/RHIZOH_MATCH_COMMIT_AUTHORITY_ROADMAP_V1.md
 */

import { MATCH_SESSION_STATE_V0 } from "./matchSessionStateMachineV0.js";
import {
  clearMatchmakingTruthForTestV0,
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthLogV0,
  MATCH_TRUTH_EVENT_V0,
  replayMatchmakingTruthV0,
  runMatchmakingTruthProductionVerifyV0
} from "./matchmakingTruthKernelV0.js";
import {
  getMatchTruthAuthoritySnapshotV0,
  MATCH_TRUTH_CHAIN_PHASE_V0,
  MATCH_TRUTH_ORIGIN_V0,
  MATCH_VALIDATION_SOURCE_V0
} from "./matchmakingTruthAuthorityObservabilityV0.js";
import { MATCH_COMMIT_AUTHORITY_POLICY_V0 } from "./matchmakingSingleWriterPolicyV0.js";

export const MATCH_AUTHORITY_BOUNDARY_SCHEMA_V0 =
  "castle.rhizoh.match_authority_boundary_verify.v0";

const AUTHORITATIVE_COMMIT_PHASES_V0 = Object.freeze([
  MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_APPEND,
  MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_APPENDED,
  MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_COMMITTED,
  MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_STATE_REDUCED
]);

const LIVE_GATEWAY_GAPS_V0 = Object.freeze([
  "live_gateway_ws_transport",
  "broadcast_to_all_clients"
]);

function chainPhases(step) {
  return (step?.truthChain?.chain || []).map((c) => c.phase);
}

function logBoundary(tag, payload) {
  if (typeof console !== "undefined" && console.info) {
    console.info(tag, payload);
  }
}

/**
 * Measures client proposal (preview) → gateway commit (authoritative) → replay.
 * @param {{ reset?: boolean, playerId?: string }} [opts]
 */
export function runMatchmakingAuthorityBoundaryVerifyV0(opts = {}) {
  if (opts.reset !== false) {
    clearMatchmakingTruthForTestV0();
  }

  const playerId = String(opts.playerId || "authority_boundary_user");
  const production = runMatchmakingTruthProductionVerifyV0({ reset: false, playerId });
  const proposePhases = chainPhases(production.proposeStep);
  const commitPhases = chainPhases(production.commitStep);

  const rejectStep = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
    sessionId: production.replayed?.activeSession?.sessionId,
    payload: { san: "Qxinvalid", playerId, autoCommitShadow: false }
  });
  const rejectPhases = chainPhases(rejectStep);

  const gatewayReady = production.commitStep?.authority?.serverAuthoritative === true;
  const auth = getMatchTruthAuthoritySnapshotV0({
    session: production.replayed?.activeSession,
    gatewayReady
  });
  const replayed = replayMatchmakingTruthLogCheckV0(production);

  const previewOk = proposePhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_PREVIEW);
  const authoritativeOk = AUTHORITATIVE_COMMIT_PHASES_V0.every((p) => commitPhases.includes(p));
  const rejectionOk = rejectPhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_REJECTED);
  const singleWriterOk =
    production.ok &&
    previewOk &&
    authoritativeOk &&
    rejectionOk &&
    auth.commitAuthority === MATCH_COMMIT_AUTHORITY_POLICY_V0.SERVER_PRIMARY &&
    auth.proposalAuthority === "client_shadow" &&
    gatewayReady === true;

  const result = Object.freeze({
    schema: MATCH_AUTHORITY_BOUNDARY_SCHEMA_V0,
    ok: singleWriterOk,
    stage: gatewayReady ? "SERVER_BOUND" : "PARTIAL",
    proposalAuthority: auth.proposalAuthority,
    commitAuthority: auth.commitAuthority,
    effectiveCommitWriter: auth.effectiveCommitWriter,
    validationSource: gatewayReady
      ? MATCH_VALIDATION_SOURCE_V0.AUTHORITY_GATEWAY
      : MATCH_VALIDATION_SOURCE_V0.CHESS_JS_LOCAL,
    serverAuthoritative: auth.serverAuthoritative,
    truthOrigin: gatewayReady ? MATCH_TRUTH_ORIGIN_V0.GATEWAY_ACK : auth.truthOrigin,
    singleWriterRule: true,
    gatewayWired: gatewayReady,
    productionVerifyOk: production.ok,
    previewChainOk: previewOk,
    authoritativeChainOk: authoritativeOk,
    rejectionObserved: rejectionOk,
    proposePhases,
    commitPhases,
    phasesMissingUntilLive: gatewayReady ? LIVE_GATEWAY_GAPS_V0 : [],
    replayConsistent: replayed.ok,
    moveCount: production.moveCount,
    replayMoveCount: replayed.moveCount,
    interpretationOnly: true,
    shadowRehearsal: !gatewayReady
  });

  logBoundary("[MATCH_AUTHORITY_BOUNDARY]", result);
  return result;
}

function replayMatchmakingTruthLogCheckV0(production) {
  const replayed = replayMatchmakingTruthV0();
  const moveCount = replayed.activeSession?.committed?.moveCount ?? 0;
  const logCount = getMatchmakingTruthLogV0().count;
  return Object.freeze({
    ok: moveCount === production.moveCount && logCount >= production.eventsProduced,
    moveCount,
    logCount
  });
}

/**
 * Forces shadow ≠ committed divergence, then reconciles.
 * @param {{ reset?: boolean, playerId?: string }} [opts]
 */
export function runMatchmakingDriftInjectionVerifyV0(opts = {}) {
  if (opts.reset !== false) {
    clearMatchmakingTruthForTestV0();
  }

  const playerId = String(opts.playerId || "drift_injection_user");

  const create = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
    payload: {
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
      players: [{ userId: playerId, color: "white" }]
    }
  });
  if (!create.ok) {
    return Object.freeze({ ok: false, reason: "session_create_failed", interpretationOnly: true });
  }

  const sessionId = create.session.sessionId;

  const propose = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
    sessionId,
    payload: { san: "e4", playerId, autoCommitShadow: false }
  });
  const proposePhases = chainPhases(propose);
  const driftDetected = proposePhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.DRIFT_DETECTED);

  const shadow = propose.session;
  const reconcile = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.RECONCILE_STATE,
    sessionId,
    payload: {
      serverState: {
        fen: shadow?.shadow?.fen ?? shadow?.committed?.fen,
        turn: shadow?.shadow?.turn,
        moveCount: shadow?.shadow?.moveCount,
        serverSeq: 1
      }
    }
  });
  const reconcilePhases = chainPhases(reconcile);
  const reconciliationApplied = reconcilePhases.includes(
    MATCH_TRUTH_CHAIN_PHASE_V0.RECONCILIATION_APPLIED
  );
  const driftResolved = reconcilePhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.DRIFT_RESOLVED);

  const ok =
    propose.ok === true &&
    driftDetected &&
    reconcile.ok === true &&
    reconciliationApplied;

  const result = Object.freeze({
    schema: MATCH_AUTHORITY_BOUNDARY_SCHEMA_V0,
    ok,
    driftDetected,
    reconciliationApplied,
    driftResolved,
    proposePhases,
    reconcilePhases,
    divergedBeforeReconcile: propose.session?.committed?.moveCount !== propose.session?.shadow?.moveCount,
    interpretationOnly: true,
    shadowRehearsal: true
  });

  logBoundary("[MATCH_DRIFT_INJECTION]", result);
  return result;
}
