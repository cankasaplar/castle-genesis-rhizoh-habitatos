/**
 * Broadcast E2E verification v0 — two-client shared reality harness.
 * Gateway room tests live in apps/gateway; this verifies client projection chain.
 * RESEARCH-ONLY
 */

import { Chess } from "chess.js";
import { clearMatchmakingTruthForTestV0, dispatchMatchmakingTruthEventV0, getMatchmakingTruthSnapshotV0, MATCH_TRUTH_EVENT_V0, replayMatchmakingTruthV0 } from "./matchmakingTruthKernelV0.js";
import { applyRemoteMatchWorldStateV0 } from "./matchmakingWorldProjectionV0.js";
import { projectMatchTruthToUiV0 } from "./matchTruthUiProjectionV0.js";
import { MATCH_SESSION_STATE_V0 } from "./matchSessionStateMachineV0.js";
import { simulateGatewayMatchMoveAckV0 } from "./matchmakingGatewayCommitBridgeV0.js";

export const MATCH_BROADCAST_E2E_VERIFY_SCHEMA_V0 =
  "castle.rhizoh.match_broadcast_e2e_verify.v0";

const E4_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

/**
 * Simulates: client A proposes · server commits · client B receives MATCH_STATE projection.
 * @param {{ reset?: boolean, sessionId?: string, playerId?: string }} [opts]
 */
export function runMatchBroadcastE2eVerifyV0(opts = {}) {
  if (opts.reset !== false) {
    clearMatchmakingTruthForTestV0();
  }

  const sessionId = String(opts.sessionId || `e2e_${Date.now()}`);
  const playerId = String(opts.playerId || "e2e_player_a");

  const sessionStep = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
    payload: {
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
      players: [{ userId: playerId, color: "white" }]
    }
  });

  const sid = sessionStep.session?.sessionId || sessionId;

  const proposeA = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
    sessionId: sid,
    payload: { san: "e4", playerId, autoCommitShadow: false }
  });

  const remoteState = Object.freeze({
    sessionId: sid,
    san: "e4",
    lastSan: "e4",
    playerId,
    fen: E4_FEN,
    turn: "black",
    serverSeq: 1,
    moveCount: 1
  });

  const clientB = applyRemoteMatchWorldStateV0(remoteState, { origin: "e2e_verify" });
  const projectionB = projectMatchTruthToUiV0();
  const replayed = replayMatchmakingTruthV0();

  const fenOk = projectionB.fen === E4_FEN;
  const seqOk = projectionB.serverSeq === 1;
  const moveOk = (replayed.activeSession?.committed?.moveCount ?? 0) >= 1;
  const proposeOk = proposeA.ok === true;
  const projectOk = clientB.ok === true;

  const ok = fenOk && seqOk && moveOk && proposeOk && projectOk;

  if (typeof console !== "undefined" && console.info) {
    console.info("[MATCH_BROADCAST_E2E_VERIFY]", {
      ok,
      fenOk,
      seqOk,
      moveOk,
      projectionFen: projectionB.fen,
      interpretationOnly: true
    });
  }

  return Object.freeze({
    ok,
    schema: MATCH_BROADCAST_E2E_VERIFY_SCHEMA_V0,
    sessionId: sid,
    proposeA,
    clientB,
    projectionB,
    replayed,
    fenMatches: new Chess(projectionB.fen || "").fen() === new Chess(E4_FEN).fen(),
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

export function mountMatchBroadcastE2eVerifyConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  const api = Object.freeze({
    schema: MATCH_BROADCAST_E2E_VERIFY_SCHEMA_V0,
    verify: runMatchBroadcastE2eVerifyV0,
    interpretationOnly: true,
    shadowRehearsal: true
  });
  window.__rhizoh.matchBroadcastE2e = api;
  if (window.__rhizoh.matchmaking?.truthKernel) {
    window.__rhizoh.matchmaking.verifyBroadcastE2e = runMatchBroadcastE2eVerifyV0;
  }
}
