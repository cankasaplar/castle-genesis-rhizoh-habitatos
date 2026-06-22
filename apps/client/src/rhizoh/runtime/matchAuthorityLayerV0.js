/**
 * Match Authority Layer v0 — SERVER_PRIMARY contract with shadow/client split.
 * Client proposes · server commits · reconciliation diff-merge.
 * @see docs/RHIZOH_MATCH_AUTHORITY_LAYER_V1.md
 */

import { ensureMatchmakingEngineSurfaceV0 } from "./matchmakingRuntimeSurfaceV0.js";

export const MATCH_AUTHORITY_SCHEMA_V0 = "castle.rhizoh.match_authority.v1";

export const MATCH_AUTHORITY_MODE_V0 = Object.freeze({
  SERVER_PRIMARY: "SERVER_PRIMARY",
  SHADOW_ONLY: "SHADOW_ONLY"
});

export const MATCH_EFFECTIVE_AUTHORITY_V0 = Object.freeze({
  SERVER: "SERVER",
  SHADOW_CLIENT: "SHADOW_CLIENT",
  PENDING_SERVER_ACK: "PENDING_SERVER_ACK"
});

export const MATCH_RECONCILIATION_V0 = Object.freeze({
  DIFF_MERGE: "diff-merge",
  SERVER_WINS: "server-wins"
});

const STARTING_FEN_V0 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * @param {{ serverBound?: boolean, reconciliation?: string }} [opts]
 */
export function buildMatchAuthorityContractV0(opts = {}) {
  const serverBound = opts.serverBound === true;
  return Object.freeze({
    schema: MATCH_AUTHORITY_SCHEMA_V0,
    mode: MATCH_AUTHORITY_MODE_V0.SERVER_PRIMARY,
    commitRequired: true,
    reconciliation: opts.reconciliation || MATCH_RECONCILIATION_V0.DIFF_MERGE,
    effectiveAuthority: serverBound
      ? MATCH_EFFECTIVE_AUTHORITY_V0.SERVER
      : MATCH_EFFECTIVE_AUTHORITY_V0.SHADOW_CLIENT,
    serverAckRequired: true,
    serverAuthoritative: serverBound,
    shadowRehearsal: !serverBound,
    interpretationOnly: true
  });
}

/**
 * @param {object} session
 */
export function attachAuthorityToSessionV0(session) {
  const now = Date.now();
  const base = session || {};
  const committed = Object.freeze({
    fen: base.committed?.fen || base.fen || STARTING_FEN_V0,
    turn: base.committed?.turn || base.turn || "white",
    moveCount: base.committed?.moveCount ?? 0,
    lastSan: base.committed?.lastSan ?? null,
    serverSeq: base.committed?.serverSeq ?? 0
  });
  const shadow = Object.freeze({
    fen: base.shadow?.fen || base.fen || STARTING_FEN_V0,
    turn: base.shadow?.turn || base.turn || "white",
    moveCount: base.shadow?.moveCount ?? 0,
    lastSan: base.shadow?.lastSan ?? null,
    pendingSeq: base.shadow?.pendingSeq ?? 0
  });

  return Object.freeze({
    ...base,
    authority: buildMatchAuthorityContractV0({ serverBound: base.authority?.serverAuthoritative === true }),
    committed,
    shadow,
    pendingMoves: Object.freeze(base.pendingMoves || []),
    serverAuthoritative: base.authority?.serverAuthoritative === true,
    shadowRehearsal: base.authority?.serverAuthoritative !== true,
    interpretationOnly: true
  });
}

/**
 * @param {object} session
 */
export function getMatchAuthorityStatusV0(session) {
  const s = session?.authority ? session : attachAuthorityToSessionV0(session || {});
  const diverged =
    s.committed?.fen !== s.shadow?.fen ||
    (s.committed?.moveCount ?? 0) !== (s.shadow?.moveCount ?? 0);

  return Object.freeze({
    schema: MATCH_AUTHORITY_SCHEMA_V0,
    mode: s.authority.mode,
    commitRequired: s.authority.commitRequired,
    reconciliation: s.authority.reconciliation,
    effectiveAuthority: s.authority.effectiveAuthority,
    serverAuthoritative: s.authority.serverAuthoritative === true,
    shadowRehearsal: s.shadowRehearsal === true,
    diverged,
    pendingMoveCount: (s.pendingMoves || []).length,
    committedMoveCount: s.committed?.moveCount ?? 0,
    shadowMoveCount: s.shadow?.moveCount ?? 0,
    interpretationOnly: true
  });
}

/**
 * @param {object} session
 * @param {{ san: string, playerId: string }} move
 */
export function proposeShadowMatchMoveV0(session, move) {
  const s = attachAuthorityToSessionV0(session);
  const san = String(move?.san || "").trim();
  const playerId = String(move?.playerId || "");
  if (!san || !playerId) {
    return Object.freeze({ ok: false, reason: "invalid_move", authority: getMatchAuthorityStatusV0(s) });
  }

  const nextTurn = s.shadow.turn === "white" ? "black" : "white";
  const pending = Object.freeze({
    san,
    playerId,
    proposedAtMs: Date.now(),
    seq: (s.shadow.pendingSeq ?? 0) + 1,
    status: "pending_server_ack"
  });

  const shadow = Object.freeze({
    ...s.shadow,
    turn: nextTurn,
    moveCount: (s.shadow.moveCount ?? 0) + 1,
    lastSan: san,
    pendingSeq: pending.seq
  });

  const next = Object.freeze({
    ...s,
    shadow,
    pendingMoves: Object.freeze([...(s.pendingMoves || []), pending]),
    authority: Object.freeze({
      ...s.authority,
      effectiveAuthority: MATCH_EFFECTIVE_AUTHORITY_V0.PENDING_SERVER_ACK
    }),
    lastSan: san,
    lastPlayerId: playerId,
    turn: shadow.turn,
    moveCount: shadow.moveCount,
    interpretationOnly: true
  });

  return Object.freeze({
    ok: true,
    shadowOnly: true,
    pendingCommit: true,
    committed: false,
    session: next,
    authority: getMatchAuthorityStatusV0(next)
  });
}

/**
 * @param {object} session
 * @param {{ san: string, playerId: string, serverSeq?: number, fen?: string, turn?: string }} commit
 */
export function applyServerMatchCommitV0(session, commit) {
  const s = attachAuthorityToSessionV0(session);
  const san = String(commit?.san || "").trim();
  const incomingSeq = Number(commit.serverSeq) || 0;
  const localSeq = s.committed?.serverSeq ?? 0;
  if (incomingSeq > 0 && incomingSeq <= localSeq) {
    return Object.freeze({
      ok: true,
      skipped: true,
      reason: "already_committed",
      session: s
    });
  }

  if (!san) {
    return Object.freeze({ ok: false, reason: "invalid_commit" });
  }

  const serverSeq = incomingSeq > 0 ? incomingSeq : localSeq + 1;
  const turn = commit.turn === "black" ? "black" : commit.turn === "white" ? "white" : s.committed.turn === "white" ? "black" : "white";
  const moveCount =
    typeof commit.moveCount === "number" && commit.moveCount >= 0
      ? commit.moveCount
      : (s.committed.moveCount ?? 0) + 1;

  const committed = Object.freeze({
    fen: commit.fen || s.committed.fen,
    turn,
    moveCount,
    lastSan: san,
    serverSeq
  });

  const authority = buildMatchAuthorityContractV0({ serverBound: true });
  const next = Object.freeze({
    ...s,
    committed,
    shadow: Object.freeze({ ...committed, pendingSeq: committed.moveCount }),
    fen: committed.fen,
    turn: committed.turn,
    moveCount: committed.moveCount,
    pendingMoves: Object.freeze([]),
    authority,
    serverAuthoritative: true,
    shadowRehearsal: false,
    interpretationOnly: true
  });

  return Object.freeze({
    ok: true,
    committed: true,
    session: next,
    authority: getMatchAuthorityStatusV0(next)
  });
}

/**
 * @param {object} session
 * @param {{ serverState: { fen?: string, turn?: string, moveCount?: number, serverSeq?: number } }} opts
 */
export function reconcileMatchAuthorityV0(session, opts = {}) {
  const s = attachAuthorityToSessionV0(session);
  const server = opts.serverState || {};
  const reconciliation = s.authority.reconciliation || MATCH_RECONCILIATION_V0.DIFF_MERGE;

  if (reconciliation === MATCH_RECONCILIATION_V0.SERVER_WINS || s.authority.mode === MATCH_AUTHORITY_MODE_V0.SERVER_PRIMARY) {
    const committed = Object.freeze({
      fen: server.fen ?? s.committed.fen,
      turn: server.turn ?? s.committed.turn,
      moveCount: server.moveCount ?? s.committed.moveCount,
      lastSan: s.committed.lastSan,
      serverSeq: server.serverSeq ?? s.committed.serverSeq
    });
    const next = Object.freeze({
      ...s,
      committed,
      shadow: Object.freeze({ ...committed, pendingSeq: committed.moveCount }),
      fen: committed.fen,
      turn: committed.turn,
      moveCount: committed.moveCount,
      pendingMoves: Object.freeze([]),
      authority: buildMatchAuthorityContractV0({ serverBound: Boolean(server.fen) }),
      interpretationOnly: true
    });
    return Object.freeze({
      ok: true,
      reconciled: true,
      strategy: MATCH_RECONCILIATION_V0.DIFF_MERGE,
      session: next,
      authority: getMatchAuthorityStatusV0(next)
    });
  }

  return Object.freeze({ ok: false, reason: "reconciliation_not_applicable", session: s });
}

export function mountMatchAuthorityConsoleV0() {
  const engine = ensureMatchmakingEngineSurfaceV0();
  if (!engine) return;
  engine.authority = Object.freeze({
    contract: buildMatchAuthorityContractV0,
    status: () => engine.session?.authorityStatus?.() ?? getMatchAuthorityStatusV0({}),
    proposeMove: (move) => engine.session?.move?.(move),
    commit: (commit) => engine.session?.commit?.(commit),
    reconcile: (opts) => engine.session?.reconcile?.(opts)
  });
}
