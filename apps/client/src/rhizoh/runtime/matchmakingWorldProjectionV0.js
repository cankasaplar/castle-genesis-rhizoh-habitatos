/**
 * Match world projection v0 — apply remote MATCH_STATE / MATCH_MOVE_ACK to local truth.
 * Same match, multiple devices, same authoritative reality after server finalization.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_BROADCAST_LAYER_V0.md
 */

import { applyGatewayMatchMoveAckV0 } from "./matchmakingGatewayCommitBridgeV0.js";
import {
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthSnapshotV0,
  MATCH_TRUTH_EVENT_V0
} from "./matchmakingTruthKernelV0.js";

export const MATCH_WORLD_PROJECTION_SCHEMA_V0 = "castle.rhizoh.match_world_projection.v0";

/**
 * Apply broadcasted server state to local authoritative projection.
 * @param {object} remoteState
 * @param {{ origin?: string }} [opts]
 */
export function applyRemoteMatchWorldStateV0(remoteState = {}, opts = {}) {
  const sessionId = String(remoteState.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id", interpretationOnly: true });
  }

  const local = getMatchmakingTruthSnapshotV0();
  const localSessionId = local.activeSession?.sessionId ?? null;
  const localSeq = local.activeSession?.committed?.serverSeq ?? 0;
  const remoteSeq = Number(remoteState.serverSeq) || 0;

  if (localSessionId && localSessionId !== sessionId) {
    return Object.freeze({
      ok: false,
      reason: "session_mismatch",
      localSessionId,
      remoteSessionId: sessionId,
      interpretationOnly: true
    });
  }

  if (remoteSeq > 0 && remoteSeq <= localSeq) {
    return Object.freeze({
      ok: true,
      skipped: true,
      reason: "already_projected",
      localSeq,
      remoteSeq,
      interpretationOnly: true
    });
  }

  const san = String(remoteState.lastSan || remoteState.san || "").trim();
  if (remoteState.snapshot === true && remoteState.fen && !san) {
    const reconciled = dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.RECONCILE_STATE,
      sessionId,
      payload: {
        serverState: {
          fen: remoteState.fen,
          turn: remoteState.turn,
          moveCount: remoteState.moveCount,
          serverSeq: remoteSeq
        }
      }
    });
    return Object.freeze({
      schema: MATCH_WORLD_PROJECTION_SCHEMA_V0,
      ok: reconciled.ok === true,
      reconciled: true,
      origin: opts.origin || "broadcast_snapshot",
      remoteState,
      projection: getMatchmakingTruthSnapshotV0(),
      interpretationOnly: true
    });
  }

  const ack = applyGatewayMatchMoveAckV0({
    sessionId,
    san: san || remoteState.san,
    playerId: remoteState.playerId || "broadcast_observer",
    fen: remoteState.fen,
    turn: remoteState.turn,
    serverSeq: remoteState.serverSeq,
    moveCount: remoteState.moveCount,
    validationSource: remoteState.validationSource || "authority_gateway",
    commitAuthority: "server"
  });

  return Object.freeze({
    schema: MATCH_WORLD_PROJECTION_SCHEMA_V0,
    ok: ack.ok === true,
    origin: opts.origin || "broadcast",
    remoteState,
    projection: getMatchmakingTruthSnapshotV0(),
    ack,
    interpretationOnly: true
  });
}

export function getMatchWorldProjectionStatusV0() {
  const snap = getMatchmakingTruthSnapshotV0();
  return Object.freeze({
    schema: MATCH_WORLD_PROJECTION_SCHEMA_V0,
    hasActiveSession: Boolean(snap.activeSession),
    sessionId: snap.activeSession?.sessionId ?? null,
    committedMoveCount: snap.activeSession?.committed?.moveCount ?? 0,
    fen: snap.activeSession?.committed?.fen ?? null,
    shadowRehearsal: true,
    interpretationOnly: true
  });
}
