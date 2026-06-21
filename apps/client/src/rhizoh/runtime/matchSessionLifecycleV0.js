/**
 * Match Session Lifecycle v0 — server-authoritative state machine (shadow rehearsal).
 * All mutations route through truth kernel dispatch (append log → reducer).
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { attachAuthorityToSessionV0, getMatchAuthorityStatusV0 } from "./matchAuthorityLayerV0.js";
import {
  isLegalSessionTransitionV0,
  MATCH_SESSION_SCHEMA_V0,
  MATCH_SESSION_STATE_V0
} from "./matchSessionStateMachineV0.js";
import { ensureMatchmakingEngineSurfaceV0 } from "./matchmakingRuntimeSurfaceV0.js";
import {
  buildSessionFromCreatePayloadV0,
  clearMatchmakingTruthForTestV0,
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthSnapshotV0,
  MATCH_TRUTH_EVENT_V0
} from "./matchmakingTruthKernelV0.js";

const SESSION_STORAGE_KEY_V0 = "rhizoh.matchmaking.active_session.v0";

export { MATCH_SESSION_SCHEMA_V0, MATCH_SESSION_STATE_V0, isLegalSessionTransitionV0 } from "./matchSessionStateMachineV0.js";

function readSessionRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSessionRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

export function persistActiveMatchSessionV0(session) {
  writeSessionRowV0(session);
  return session;
}

function readActiveSessionFromTruthV0() {
  const snap = getMatchmakingTruthSnapshotV0();
  return snap?.activeSession ?? readSessionRowV0();
}

/**
 * @param {{ mode?: string, players?: object[], timeControlMs?: number, initialState?: string, opponentKind?: string }} input
 */
export function createMatchSessionV0(input = {}) {
  const out = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
    payload: input
  });
  if (!out.ok) {
    return buildSessionFromCreatePayloadV0(input);
  }
  return out.session;
}

/**
 * @param {string} nextState
 * @param {{ result?: string }} [opts]
 */
export function transitionMatchSessionV0(nextState, opts = {}) {
  const current = readActiveSessionFromTruthV0();
  if (!current) {
    return Object.freeze({ ok: false, reason: "no_active_session" });
  }

  if (!isLegalSessionTransitionV0(current.state, nextState)) {
    return Object.freeze({
      ok: false,
      reason: "illegal_transition",
      from: current.state,
      to: nextState
    });
  }

  const out = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.SESSION_TRANSITION,
    sessionId: current.sessionId,
    payload: { nextState, result: opts.result }
  });

  if (!out.ok) return Object.freeze({ ok: false, reason: "truth_dispatch_failed" });
  return Object.freeze({ ok: true, session: out.session });
}

/**
 * @param {{ san: string, playerId: string, autoCommitShadow?: boolean }} move
 */
export function applyMatchMoveV0(move) {
  const current = readActiveSessionFromTruthV0();
  if (!current || current.state !== MATCH_SESSION_STATE_V0.SESSION_ACTIVE) {
    return Object.freeze({ ok: false, reason: "session_not_active" });
  }

  return dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
    sessionId: current.sessionId,
    payload: {
      san: move.san,
      playerId: move.playerId,
      clientSeq: move.clientSeq,
      autoCommitShadow: move.autoCommitShadow !== false
    }
  });
}

/**
 * @param {{ san: string, playerId: string, serverSeq?: number, fen?: string, turn?: string }} commit
 */
export function commitMatchMoveV0(commit) {
  const current = readActiveSessionFromTruthV0();
  if (!current) {
    return Object.freeze({ ok: false, reason: "no_active_session" });
  }
  return dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.COMMIT_MOVE,
    sessionId: current.sessionId,
    payload: commit
  });
}

/**
 * @param {{ serverState: object }} opts
 */
export function reconcileMatchSessionV0(opts = {}) {
  const current = readActiveSessionFromTruthV0();
  if (!current) {
    return Object.freeze({ ok: false, reason: "no_active_session" });
  }
  return dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.RECONCILE_STATE,
    sessionId: current.sessionId,
    payload: opts
  });
}

export function getMatchSessionAuthorityStatusV0() {
  const row = readActiveSessionFromTruthV0();
  if (!row) {
    return getMatchAuthorityStatusV0({});
  }
  return getMatchAuthorityStatusV0(row);
}

export function getActiveMatchSessionV0() {
  const row = readActiveSessionFromTruthV0();
  if (!row) {
    return Object.freeze({
      schema: MATCH_SESSION_SCHEMA_V0,
      active: false,
      shadowRehearsal: true,
      interpretationOnly: true
    });
  }
  return Object.freeze({ ...attachAuthorityToSessionV0(row), active: true, interpretationOnly: true });
}

export function clearMatchSessionForTestV0() {
  clearMatchmakingTruthForTestV0();
}

function mountSessionEngineV0() {
  const engine = ensureMatchmakingEngineSurfaceV0();
  if (!engine) return;
  engine.session = Object.freeze({
    get: getActiveMatchSessionV0,
    create: createMatchSessionV0,
    transition: transitionMatchSessionV0,
    move: applyMatchMoveV0,
    commit: commitMatchMoveV0,
    reconcile: reconcileMatchSessionV0,
    authorityStatus: getMatchSessionAuthorityStatusV0,
    clear: clearMatchSessionForTestV0,
    states: MATCH_SESSION_STATE_V0
  });
}

export function mountMatchSessionLifecycleConsoleV0() {
  if (typeof window === "undefined") return;
  mountSessionEngineV0();
}
