/**
 * Match gateway commit bridge v0 — client proposal transport · server ack → authoritative commit.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_COMMIT_AUTHORITY_ROADMAP_V1.md
 */

import { WS_MESSAGE } from "@castle/protocol";
import { ingestMatchCastleInviteFromGatewayV0 } from "./matchCastleInboxBridgeV0.js";
import {
  dispatchMatchmakingTruthEventV0,
  MATCH_TRUTH_EVENT_V0
} from "./matchmakingTruthKernelV0.js";
import { MATCH_TRUTH_PROVENANCE_V0 } from "./matchmakingSingleWriterPolicyV0.js";

export const MATCH_GATEWAY_COMMIT_BRIDGE_SCHEMA_V0 =
  "castle.rhizoh.match_gateway_commit_bridge.v0";

/**
 * Apply gateway MATCH_MOVE_ACK as the only authoritative commit path.
 * @param {object} ack
 */
export function applyGatewayMatchMoveAckV0(ack = {}) {
  const sessionId = String(ack.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id", interpretationOnly: true });
  }

  return dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.COMMIT_MOVE,
    sessionId,
    provenance: MATCH_TRUTH_PROVENANCE_V0.GATEWAY_ACK,
    gatewayReady: true,
    payload: {
      san: ack.san,
      playerId: ack.playerId,
      fen: ack.fen,
      turn: ack.turn,
      serverSeq: ack.serverSeq,
      provenance: MATCH_TRUTH_PROVENANCE_V0.GATEWAY_ACK,
      validationSource: ack.validationSource || "authority_gateway",
      commitAuthority: "server"
    }
  });
}

/**
 * Test / local harness — simulates server arbitration without WebSocket.
 * @param {{ sessionId: string, san: string, playerId: string, fen: string, turn: string, serverSeq?: number }} input
 */
export function simulateGatewayMatchMoveAckV0(input = {}) {
  return applyGatewayMatchMoveAckV0({
    sessionId: input.sessionId,
    san: input.san,
    playerId: input.playerId,
    fen: input.fen,
    turn: input.turn,
    serverSeq: input.serverSeq ?? 1,
    validationSource: "authority_gateway",
    commitAuthority: "server"
  });
}

/**
 * Register inbound gateway ack listener on an open WebSocket (if present).
 * @param {WebSocket | null | undefined} ws
 */
export function bindMatchGatewayCommitListenerV0(ws) {
  if (!ws || typeof ws.addEventListener !== "function") return () => {};
  const handler = (evt) => {
    try {
      const msg = JSON.parse(String(evt.data || ""));
      if (msg?.type === WS_MESSAGE.MATCH_MOVE_ACK) {
        applyGatewayMatchMoveAckV0({ sessionId: msg.sessionId, ...(msg.payload || {}) });
      }
      if (msg?.type === WS_MESSAGE.MATCH_CASTLE_INVITE) {
        ingestMatchCastleInviteFromGatewayV0({
          ...(msg.payload || {}),
          fromGatewayClientId: msg.payload?.fromGatewayClientId || null
        });
      }
    } catch {
      /* noop */
    }
  };
  ws.addEventListener("message", handler);
  return () => ws.removeEventListener("message", handler);
}

export function mountMatchGatewayCommitBridgeConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchGatewayCommit = Object.freeze({
    schema: MATCH_GATEWAY_COMMIT_BRIDGE_SCHEMA_V0,
    applyAck: applyGatewayMatchMoveAckV0,
    simulateAck: simulateGatewayMatchMoveAckV0,
    bindListener: bindMatchGatewayCommitListenerV0,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}
