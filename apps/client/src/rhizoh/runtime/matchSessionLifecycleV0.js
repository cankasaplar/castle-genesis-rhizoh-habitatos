/**
 * Match Session Lifecycle v0 — server-authoritative state machine (shadow rehearsal).
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { MATCH_MODE_V0 } from "./matchmakingBeaconRegistryV0.js";
import {
  applyServerMatchCommitV0,
  attachAuthorityToSessionV0,
  buildMatchAuthorityContractV0,
  getMatchAuthorityStatusV0,
  proposeShadowMatchMoveV0,
  reconcileMatchAuthorityV0
} from "./matchAuthorityLayerV0.js";
import {
  MATCH_KERNEL_SCHEMA_V0,
  MATCH_KERNEL_STATE_V0,
  processKernelProposeMoveV0
} from "./matchAuthorityKernelV0.js";
import { ensureMatchmakingEngineSurfaceV0 } from "./matchmakingRuntimeSurfaceV0.js";

export const MATCH_SESSION_SCHEMA_V0 = "castle.rhizoh.match_session.v1";

export const MATCH_SESSION_STATE_V0 = Object.freeze({
  BEACON_PENDING: "BEACON_PENDING",
  MATCHING: "MATCHING",
  MATCH_FOUND: "MATCH_FOUND",
  SESSION_ACTIVE: "SESSION_ACTIVE",
  SESSION_PAUSED: "SESSION_PAUSED",
  SESSION_FINISHED: "SESSION_FINISHED",
  SESSION_CANCELLED: "SESSION_CANCELLED"
});

const SESSION_STORAGE_KEY_V0 = "rhizoh.matchmaking.active_session.v0";
const STARTING_FEN_V0 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** @type {Readonly<Record<string, readonly string[]>>} */
const LEGAL_TRANSITIONS_V0 = Object.freeze({
  [MATCH_SESSION_STATE_V0.BEACON_PENDING]: Object.freeze([
    MATCH_SESSION_STATE_V0.MATCHING,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.MATCHING]: Object.freeze([
    MATCH_SESSION_STATE_V0.MATCH_FOUND,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.MATCH_FOUND]: Object.freeze([
    MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.SESSION_ACTIVE]: Object.freeze([
    MATCH_SESSION_STATE_V0.SESSION_PAUSED,
    MATCH_SESSION_STATE_V0.SESSION_FINISHED,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.SESSION_PAUSED]: Object.freeze([
    MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
    MATCH_SESSION_STATE_V0.SESSION_FINISHED,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.SESSION_FINISHED]: Object.freeze([]),
  [MATCH_SESSION_STATE_V0.SESSION_CANCELLED]: Object.freeze([])
});

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

function createSessionIdV0() {
  return `match_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string} from
 * @param {string} to
 */
export function isLegalSessionTransitionV0(from, to) {
  const allowed = LEGAL_TRANSITIONS_V0[from] || [];
  return allowed.includes(to);
}

/**
 * @param {{ mode?: string, players?: object[], timeControlMs?: number, initialState?: string, opponentKind?: string }} input
 */
export function createMatchSessionV0(input = {}) {
  const now = Date.now();
  const mode = input.mode === MATCH_MODE_V0.ASYNC ? MATCH_MODE_V0.ASYNC : MATCH_MODE_V0.KINETIC;
  const timeControlMs = Math.max(1000, Number(input.timeControlMs) || 180_000);
  const players = (input.players || []).map((p) =>
    Object.freeze({
      userId: String(p.userId || ""),
      color: p.color === "black" ? "black" : "white",
      rating: Number.isFinite(p.rating) ? p.rating : undefined,
      kind: p.kind === "ai_stockfish" ? "ai_stockfish" : "human"
    })
  );

  if (input.opponentKind === "ai_stockfish" && players.length === 1) {
    players.push(
      Object.freeze({
        userId: "ai_stockfish",
        color: "black",
        kind: "ai_stockfish"
      })
    );
  }

  const state = input.initialState || MATCH_SESSION_STATE_V0.MATCH_FOUND;
  const session = attachAuthorityToSessionV0(
    Object.freeze({
      schema: MATCH_SESSION_SCHEMA_V0,
      sessionId: createSessionIdV0(),
      mode,
      state,
      players: Object.freeze(players),
      turn: "white",
      fen: STARTING_FEN_V0,
      lastMoveAtMs: now,
      deadlineAtMs: mode === MATCH_MODE_V0.ASYNC ? now + timeControlMs : undefined,
      timeControlMs,
      opponentKind: input.opponentKind === "ai_stockfish" ? "ai_stockfish" : "human",
      moveCount: 0,
      createdAtMs: now,
      authority: buildMatchAuthorityContractV0({ serverBound: false }),
      kernel: Object.freeze({
        schema: MATCH_KERNEL_SCHEMA_V0,
        state: MATCH_KERNEL_STATE_V0.ACTIVE,
        shadowRehearsal: true,
        transport: "local_shadow",
        interpretationOnly: true
      }),
      serverAuthoritative: false,
      shadowRehearsal: true,
      interpretationOnly: true
    })
  );

  writeSessionRowV0(session);
  return session;
}

/**
 * @param {string} nextState
 * @param {{ result?: string }} [opts]
 */
export function transitionMatchSessionV0(nextState, opts = {}) {
  const current = readSessionRowV0();
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

  const now = Date.now();
  const next = attachAuthorityToSessionV0(
    Object.freeze({
      ...current,
      state: nextState,
      lastMoveAtMs: now,
      finishedAtMs: nextState === MATCH_SESSION_STATE_V0.SESSION_FINISHED ? now : current.finishedAtMs,
      result: opts.result ?? current.result,
      deadlineAtMs:
        nextState === MATCH_SESSION_STATE_V0.SESSION_ACTIVE && current.mode === MATCH_MODE_V0.ASYNC
          ? now + (current.timeControlMs || 86_400_000)
          : current.deadlineAtMs
    })
  );

  writeSessionRowV0(next);
  return Object.freeze({ ok: true, session: next });
}

/**
 * Routes through authority kernel — propose → validate → commit log → committed lane.
 * @param {{ san: string, playerId: string, autoCommitShadow?: boolean }} move
 */
export function applyMatchMoveV0(move) {
  const current = readSessionRowV0();
  if (!current || current.state !== MATCH_SESSION_STATE_V0.SESSION_ACTIVE) {
    return Object.freeze({ ok: false, reason: "session_not_active" });
  }

  const result = processKernelProposeMoveV0(current, {
    san: move.san,
    playerId: move.playerId,
    clientSeq: move.clientSeq,
    autoCommitShadow: move.autoCommitShadow !== false
  });

  if (result.session) {
    persistActiveMatchSessionV0(result.session);
  }

  return result;
}

/**
 * Server commit lane — authoritative state update (gateway MATCH_MOVE_ACK path).
 * @param {{ san: string, playerId: string, serverSeq?: number, fen?: string, turn?: string }} commit
 */
export function commitMatchMoveV0(commit) {
  const current = readSessionRowV0();
  if (!current) {
    return Object.freeze({ ok: false, reason: "no_active_session" });
  }
  const result = applyServerMatchCommitV0(current, commit);
  if (!result.ok) return result;
  persistActiveMatchSessionV0(result.session);
  return Object.freeze({ ...result, committed: true });
}

/**
 * @param {{ serverState: object }} opts
 */
export function reconcileMatchSessionV0(opts = {}) {
  const current = readSessionRowV0();
  if (!current) {
    return Object.freeze({ ok: false, reason: "no_active_session" });
  }
  const result = reconcileMatchAuthorityV0(current, opts);
  if (!result.ok) return result;
  persistActiveMatchSessionV0(result.session);
  return result;
}

export function getMatchSessionAuthorityStatusV0() {
  const row = readSessionRowV0();
  if (!row) {
    return getMatchAuthorityStatusV0({});
  }
  return getMatchAuthorityStatusV0(row);
}

export function getActiveMatchSessionV0() {
  const row = readSessionRowV0();
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
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
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
    persist: persistActiveMatchSessionV0,
    authorityStatus: getMatchSessionAuthorityStatusV0,
    clear: clearMatchSessionForTestV0,
    states: MATCH_SESSION_STATE_V0
  });
}

export function mountMatchSessionLifecycleConsoleV0() {
  if (typeof window === "undefined") return;
  mountSessionEngineV0();
}
