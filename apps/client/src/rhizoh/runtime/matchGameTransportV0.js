/**
 * Match game transport v0 — Go-ready move proposal over shared broadcast layer.
 * gameType routes notation; authority stays gateway single-writer.
 * RESEARCH-ONLY
 */

import { proposeMatchBroadcastMoveV0 } from "./matchmakingBroadcastTransportV0.js";
import { getMatchGatewayWsStatusV0 } from "./matchmakingGatewayWsV0.js";
import { MATCH_GAME_TYPE_V0 } from "./matchTruthUiProjectionV0.js";

export const MATCH_GAME_TRANSPORT_SCHEMA_V0 = "castle.rhizoh.match_game_transport.v0";

/**
 * @param {{
 *   gameType?: string,
 *   sessionId?: string,
 *   move: string,
 *   playerId?: string,
 *   coord?: string,
 *   gtp?: string
 * }} input
 */
export async function proposeMatchGameMoveV0(input = {}) {
  const gameType = String(input.gameType || MATCH_GAME_TYPE_V0.CHESS);
  const move = String(input.move || input.gtp || input.coord || "").trim();
  if (!move) {
    return Object.freeze({ ok: false, reason: "missing_move", interpretationOnly: true });
  }

  if (gameType === MATCH_GAME_TYPE_V0.GO) {
    return Object.freeze({
      ok: false,
      reason: "go_gateway_validator_not_wired",
      gameType,
      move,
      interpretationOnly: true,
      shadowRehearsal: true,
      transportReady: true
    });
  }

  const ws = getMatchGatewayWsStatusV0();
  if (!ws.open) {
    return Object.freeze({
      ok: false,
      reason: "ws_not_open",
      interpretationOnly: true,
      shadowRehearsal: true
    });
  }

  return proposeMatchBroadcastMoveV0({
    sessionId: input.sessionId,
    san: move,
    playerId: input.playerId
  });
}

export function mountMatchGameTransportConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchGameTransport = Object.freeze({
    schema: MATCH_GAME_TRANSPORT_SCHEMA_V0,
    gameTypes: MATCH_GAME_TYPE_V0,
    proposeMove: proposeMatchGameMoveV0,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}
