/**
 * Match Authority Kernel v0 — sequenced event state machine (truth layer).
 * WebSocket = transport (external) · this module = authority · validator = referee.
 * @see docs/RHIZOH_MATCH_AUTHORITY_KERNEL_V1.md
 */

import {
  applyServerMatchCommitV0,
  attachAuthorityToSessionV0,
  getMatchAuthorityStatusV0,
  proposeShadowMatchMoveV0,
  reconcileMatchAuthorityV0
} from "./matchAuthorityLayerV0.js";
import { validateMatchMoveV0 } from "./matchStockfishValidatorBridgeV0.js";
import { ensureMatchmakingEngineSurfaceV0 } from "./matchmakingRuntimeSurfaceV0.js";

export const MATCH_KERNEL_SCHEMA_V0 = "castle.rhizoh.match_authority_kernel.v0";
export const MATCH_EVENT_SCHEMA_V0 = "castle.rhizoh.match_event.v1";
export const MATCH_COMMIT_LOG_SCHEMA_V0 = "castle.rhizoh.match_commit_log.v1";

export const MATCH_KERNEL_STATE_V0 = Object.freeze({
  ACTIVE: "ACTIVE",
  PENDING_MOVE: "PENDING_MOVE",
  COMMITTING: "COMMITTING",
  RECONCILING: "RECONCILING"
});

export const MATCH_EVENT_TYPE_V0 = Object.freeze({
  PROPOSE_MOVE: "ProposeMove",
  COMMIT_MOVE: "CommitMove",
  REJECT_MOVE: "RejectMove",
  RECONCILE_STATE: "ReconcileState",
  DRIFT_DETECTED: "DriftDetected"
});

export const MATCH_DRIFT_THRESHOLD_V0 = Object.freeze({
  NOISE: 0.1,
  PATTERN: 0.3,
  CONFLICT: 0.7,
  FORK: 1.0
});

const COMMIT_LOG_STORAGE_KEY_V0 = "rhizoh.matchmaking.commit_log.v0";
const MAX_LOG_ENTRIES_V0 = 256;

/** @type {Readonly<Record<string, readonly string[]>>} */
const KERNEL_TRANSITIONS_V0 = Object.freeze({
  [MATCH_KERNEL_STATE_V0.ACTIVE]: Object.freeze([
    MATCH_KERNEL_STATE_V0.PENDING_MOVE,
    MATCH_KERNEL_STATE_V0.RECONCILING
  ]),
  [MATCH_KERNEL_STATE_V0.PENDING_MOVE]: Object.freeze([
    MATCH_KERNEL_STATE_V0.COMMITTING,
    MATCH_KERNEL_STATE_V0.ACTIVE
  ]),
  [MATCH_KERNEL_STATE_V0.COMMITTING]: Object.freeze([MATCH_KERNEL_STATE_V0.ACTIVE]),
  [MATCH_KERNEL_STATE_V0.RECONCILING]: Object.freeze([MATCH_KERNEL_STATE_V0.ACTIVE])
});

function readCommitLogRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COMMIT_LOG_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCommitLogRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(COMMIT_LOG_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

/**
 * @param {string} sessionId
 */
export function getMatchCommitLogV0(sessionId) {
  const row = readCommitLogRowV0();
  const entries = (row?.entries || []).filter((e) => !sessionId || e.sessionId === sessionId);
  return Object.freeze({
    schema: MATCH_COMMIT_LOG_SCHEMA_V0,
    sessionId: sessionId || null,
    entries: Object.freeze(entries),
    count: entries.length,
    appendOnly: true,
    interpretationOnly: true
  });
}

/**
 * @param {object} event
 * @param {{ skipLog?: boolean }} [opts]
 */
function appendCommitLogEventV0(event, opts = {}) {
  if (opts.skipLog === true) {
    return Object.freeze({
      schema: MATCH_EVENT_SCHEMA_V0,
      ...event,
      seq: event.seq ?? null,
      atMs: event.atMs ?? Date.now(),
      synthetic: true
    });
  }
  const row = readCommitLogRowV0();
  const prev = row?.entries || [];
  const nextSeq = prev.length > 0 ? Math.max(...prev.map((e) => e.seq)) + 1 : 1;
  const entry = Object.freeze({
    schema: MATCH_EVENT_SCHEMA_V0,
    ...event,
    seq: event.seq ?? nextSeq,
    atMs: event.atMs ?? Date.now()
  });
  const entries = Object.freeze([...prev, entry].slice(-MAX_LOG_ENTRIES_V0));
  writeCommitLogRowV0(
    Object.freeze({
      schema: MATCH_COMMIT_LOG_SCHEMA_V0,
      entries,
      count: entries.length,
      appendOnly: true
    })
  );
  return entry;
}

/**
 * @param {string} from
 * @param {string} to
 */
export function isLegalKernelTransitionV0(from, to) {
  return (KERNEL_TRANSITIONS_V0[from] || []).includes(to);
}

/**
 * @param {object} session
 */
export function computeMatchDriftScoreV0(session) {
  const s = attachAuthorityToSessionV0(session);
  const fenMismatch = s.committed?.fen !== s.shadow?.fen ? 0.5 : 0;
  const countDelta = Math.abs((s.shadow?.moveCount ?? 0) - (s.committed?.moveCount ?? 0));
  const denom = Math.max(1, (s.committed?.moveCount ?? 0) + 1);
  const countDrift = countDelta / denom;
  const score = Math.round(Math.min(1, fenMismatch + countDrift) * 1000) / 1000;

  let classification = "noise";
  if (score >= MATCH_DRIFT_THRESHOLD_V0.FORK) classification = "fork";
  else if (score >= MATCH_DRIFT_THRESHOLD_V0.CONFLICT) classification = "conflict";
  else if (score >= MATCH_DRIFT_THRESHOLD_V0.PATTERN) classification = "pattern";

  return Object.freeze({
    schema: MATCH_KERNEL_SCHEMA_V0,
    driftScore: score,
    classification,
    fenMismatch: fenMismatch > 0,
    countDelta,
    forkRequired: score >= MATCH_DRIFT_THRESHOLD_V0.CONFLICT,
    interpretationOnly: true
  });
}

/**
 * @param {object} session
 * @param {object} event
 */
function withKernelStateV0(session, kernelState, extra = {}) {
  return Object.freeze({
    ...attachAuthorityToSessionV0(session),
    kernel: Object.freeze({
      schema: MATCH_KERNEL_SCHEMA_V0,
      state: kernelState,
      shadowRehearsal: session.shadowRehearsal !== false,
      transport: "local_shadow",
      interpretationOnly: true
    }),
    ...extra
  });
}

/**
 * @param {object} session
 * @param {{ san: string, playerId: string, clientSeq?: number, autoCommitShadow?: boolean }} move
 * @param {{ skipLog?: boolean }} [opts]
 */
export function processKernelProposeMoveV0(session, move, opts = {}) {
  const s = attachAuthorityToSessionV0(session);
  const kernelState = s.kernel?.state || MATCH_KERNEL_STATE_V0.ACTIVE;

  if (kernelState !== MATCH_KERNEL_STATE_V0.ACTIVE) {
    return Object.freeze({
      ok: false,
      reason: "kernel_not_active",
      kernelState,
      interpretationOnly: true
    });
  }

  const san = String(move?.san || "").trim();
  const playerId = String(move?.playerId || "");
  if (!san || !playerId) {
    return Object.freeze({ ok: false, reason: "invalid_move" });
  }

  const validation = validateMatchMoveV0({
    fen: s.committed.fen,
    san,
    expectedTurn: s.committed.turn
  });

  const proposeEvent = appendCommitLogEventV0({
    type: MATCH_EVENT_TYPE_V0.PROPOSE_MOVE,
    sessionId: s.sessionId,
    san,
    playerId,
    clientSeq: move.clientSeq ?? null,
    kernelState: MATCH_KERNEL_STATE_V0.PENDING_MOVE,
    shadowRehearsal: s.shadowRehearsal === true
  }, opts);

  if (!validation.ok) {
    appendCommitLogEventV0({
      type: MATCH_EVENT_TYPE_V0.REJECT_MOVE,
      sessionId: s.sessionId,
      san,
      playerId,
      reason: validation.reason,
      kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
      shadowRehearsal: s.shadowRehearsal === true
    }, opts);
    return Object.freeze({
      ok: false,
      rejected: true,
      reason: validation.reason,
      event: proposeEvent,
      kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
      interpretationOnly: true
    });
  }

  let nextSession = withKernelStateV0(s, MATCH_KERNEL_STATE_V0.PENDING_MOVE, {
    pendingProposal: Object.freeze({ san, playerId, fen: validation.fen, turn: validation.turn })
  });

  const shadowProposed = proposeShadowMatchMoveV0(nextSession, { san, playerId });
  nextSession = shadowProposed.session;

  if (move.autoCommitShadow === false) {
    return Object.freeze({
      ok: true,
      pending: true,
      shadowOnly: true,
      event: proposeEvent,
      session: nextSession,
      kernelState: MATCH_KERNEL_STATE_V0.PENDING_MOVE,
      authority: getMatchAuthorityStatusV0(nextSession),
      interpretationOnly: true
    });
  }

  return processKernelCommitMoveV0(nextSession, {
    san,
    playerId,
    fen: validation.fen,
    turn: validation.turn,
    fromProposal: true
  }, opts);
}

/**
 * @param {object} session
 * @param {{ san: string, playerId: string, fen?: string, turn?: string, fromProposal?: boolean }} commit
 * @param {{ skipLog?: boolean }} [opts]
 */
export function processKernelCommitMoveV0(session, commit, opts = {}) {
  const s = attachAuthorityToSessionV0(session);
  const kernelState = s.kernel?.state || MATCH_KERNEL_STATE_V0.PENDING_MOVE;

  if (!isLegalKernelTransitionV0(kernelState, MATCH_KERNEL_STATE_V0.COMMITTING) && kernelState !== MATCH_KERNEL_STATE_V0.ACTIVE) {
    return Object.freeze({ ok: false, reason: "illegal_kernel_transition", kernelState });
  }

  const committing = withKernelStateV0(s, MATCH_KERNEL_STATE_V0.COMMITTING);
  const serverSeq = (s.committed?.serverSeq ?? 0) + 1;
  const committed = applyServerMatchCommitV0(committing, {
    san: commit.san,
    playerId: commit.playerId,
    fen: commit.fen,
    turn: commit.turn,
    serverSeq
  });

  if (!committed.ok) return committed;

  const commitEvent = appendCommitLogEventV0({
    type: MATCH_EVENT_TYPE_V0.COMMIT_MOVE,
    sessionId: s.sessionId,
    san: commit.san,
    playerId: commit.playerId,
    fen: commit.fen || committed.session.committed.fen,
    turn: commit.turn || committed.session.committed.turn,
    seq: serverSeq,
    kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
    shadowRehearsal: s.shadowRehearsal === true
  }, opts);

  const finalSession = withKernelStateV0(committed.session, MATCH_KERNEL_STATE_V0.ACTIVE, {
    pendingProposal: null
  });

  const drift = computeMatchDriftScoreV0(finalSession);
  if (drift.driftScore >= MATCH_DRIFT_THRESHOLD_V0.CONFLICT) {
    appendCommitLogEventV0({
      type: MATCH_EVENT_TYPE_V0.DRIFT_DETECTED,
      sessionId: s.sessionId,
      driftScore: drift.driftScore,
      reason: drift.classification,
      kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
      shadowRehearsal: s.shadowRehearsal === true
    }, opts);
  }

  return Object.freeze({
    ok: true,
    committed: true,
    event: commitEvent,
    session: finalSession,
    kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
    drift,
    authority: committed.authority,
    broadcastDiff: Object.freeze({
      seq: serverSeq,
      fen: finalSession.committed.fen,
      turn: finalSession.committed.turn,
      moveCount: finalSession.committed.moveCount
    }),
    interpretationOnly: true
  });
}

/**
 * @param {object} session
 * @param {{ serverState: object }} opts
 * @param {{ skipLog?: boolean }} [kernelOpts]
 */
export function processKernelReconcileV0(session, opts = {}, kernelOpts = {}) {
  const s = attachAuthorityToSessionV0(session);
  const reconciling = withKernelStateV0(s, MATCH_KERNEL_STATE_V0.RECONCILING);
  const result = reconcileMatchAuthorityV0(reconciling, opts);

  if (!result.ok) {
    return Object.freeze({ ...result, kernelState: MATCH_KERNEL_STATE_V0.RECONCILING });
  }

  appendCommitLogEventV0({
    type: MATCH_EVENT_TYPE_V0.RECONCILE_STATE,
    sessionId: s.sessionId,
    fen: result.session.committed?.fen,
    turn: result.session.committed?.turn,
    kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
    shadowRehearsal: s.shadowRehearsal === true
  }, kernelOpts);

  const finalSession = withKernelStateV0(result.session, MATCH_KERNEL_STATE_V0.ACTIVE);
  return Object.freeze({
    ...result,
    session: finalSession,
    kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
    drift: computeMatchDriftScoreV0(finalSession)
  });
}

/**
 * @param {object} session
 */
export function getMatchKernelStatusV0(session) {
  const s = attachAuthorityToSessionV0(session || {});
  const drift = computeMatchDriftScoreV0(s);
  return Object.freeze({
    schema: MATCH_KERNEL_SCHEMA_V0,
    state: s.kernel?.state || MATCH_KERNEL_STATE_V0.ACTIVE,
    transport: "websocket_external",
    truthLayer: "kernel_state_machine",
    validator: "chess.js",
    shadowRehearsal: s.shadowRehearsal === true,
    drift,
    authority: getMatchAuthorityStatusV0(s),
    commitLogCount: getMatchCommitLogV0(s.sessionId).count,
    interpretationOnly: true
  });
}

export function clearMatchCommitLogForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(COMMIT_LOG_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

export function mountMatchAuthorityKernelConsoleV0() {
  const engine = ensureMatchmakingEngineSurfaceV0();
  if (!engine) return;
  engine.kernel = Object.freeze({
    states: MATCH_KERNEL_STATE_V0,
    events: MATCH_EVENT_TYPE_V0,
    proposeMove: (move) => engine.session?.move?.(move),
    commit: (commit) => engine.session?.commit?.(commit),
    reconcile: (opts) => engine.session?.reconcile?.(opts),
    status: () => {
      const raw = engine.session?.get?.();
      return getMatchKernelStatusV0(raw?.active ? raw : {});
    },
    drift: () => {
      const raw = engine.session?.get?.();
      return computeMatchDriftScoreV0(raw?.active ? raw : {});
    },
    commitLog: (sessionId) => getMatchCommitLogV0(sessionId),
    clearLog: clearMatchCommitLogForTestV0
  });
}
