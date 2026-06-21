/**
 * Match Session Lifecycle v0 — server-authoritative state machine (shadow rehearsal).
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { MATCH_MODE_V0 } from "./matchmakingBeaconRegistryV0.js";

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
  const session = Object.freeze({
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
    serverAuthoritative: false,
    shadowRehearsal: true,
    interpretationOnly: true
  });

  writeSessionRowV0(session);
  syncSessionWindowV0(session);
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
  const next = Object.freeze({
    ...current,
    state: nextState,
    lastMoveAtMs: now,
    finishedAtMs: nextState === MATCH_SESSION_STATE_V0.SESSION_FINISHED ? now : current.finishedAtMs,
    result: opts.result ?? current.result,
    deadlineAtMs:
      nextState === MATCH_SESSION_STATE_V0.SESSION_ACTIVE && current.mode === MATCH_MODE_V0.ASYNC
        ? now + (current.timeControlMs || 86_400_000)
        : current.deadlineAtMs
  });

  writeSessionRowV0(next);
  syncSessionWindowV0(next);
  return Object.freeze({ ok: true, session: next });
}

/**
 * @param {{ san: string, playerId: string }} move
 */
export function applyMatchMoveV0(move) {
  const current = readSessionRowV0();
  if (!current || current.state !== MATCH_SESSION_STATE_V0.SESSION_ACTIVE) {
    return Object.freeze({ ok: false, reason: "session_not_active" });
  }

  const san = String(move?.san || "").trim();
  const playerId = String(move?.playerId || "");
  if (!san || !playerId) {
    return Object.freeze({ ok: false, reason: "invalid_move" });
  }

  const now = Date.now();
  const nextTurn = current.turn === "white" ? "black" : "white";
  const next = Object.freeze({
    ...current,
    turn: nextTurn,
    moveCount: (current.moveCount || 0) + 1,
    lastMoveAtMs: now,
    deadlineAtMs: current.mode === MATCH_MODE_V0.ASYNC ? now + (current.timeControlMs || 86_400_000) : current.deadlineAtMs,
    lastSan: san,
    lastPlayerId: playerId
  });

  writeSessionRowV0(next);
  syncSessionWindowV0(next);
  return Object.freeze({ ok: true, session: next, accepted: true });
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
  return Object.freeze({ ...row, active: true, interpretationOnly: true });
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

function syncSessionWindowV0(row) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchmaking = window.__rhizoh.matchmaking || {};
  window.__rhizoh.matchmaking.session = Object.freeze({
    get: getActiveMatchSessionV0,
    create: createMatchSessionV0,
    transition: transitionMatchSessionV0,
    move: applyMatchMoveV0,
    clear: clearMatchSessionForTestV0,
    states: MATCH_SESSION_STATE_V0
  });
}

export function mountMatchSessionLifecycleConsoleV0() {
  if (typeof window === "undefined") return;
  syncSessionWindowV0(getActiveMatchSessionV0());
}
