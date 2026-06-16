/**
 * Chess regret → Geometry Layer passive observer.
 * RESEARCH-ONLY — observation export; no execution authority.
 */

import { encodeChessTopologyEventV0 } from "./rhizohGeometryChessEncoderV0.js";
import { calculateTopologyDriftV0 } from "./rhizohGeometryTopologyV0.js";
import {
  commitDriftCubeObservationV0,
  summarizeDriftCubeV0
} from "./rhizohGeometryDriftCubeV0.js";
import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";

export const RHIZOH_GEOMETRY_CHESS_OBSERVER_SCHEMA_V0 = "rhizoh.geometry_chess_observer.v0";

/**
 * @param {{
 *   regret: { evalTrace?: ReadonlyArray<{ moveNumber?: number, san?: string, bestMove?: string }> },
 *   moves?: ReadonlyArray<string|object>,
 *   matchId?: string|null
 * }} opts
 */
export function observeChessRegretGeometryV0(opts = {}) {
  const regret = opts.regret || {};
  const fenRows = buildMatchMovesWithFenV0(opts.moves || []);
  /** @type {object[]} */
  const observations = [];

  for (const trace of regret.evalTrace || []) {
    const row = fenRows[(trace.moveNumber || 1) - 1];
    if (!row?.before || !row.san || !trace.bestMove) continue;

    const played = encodeChessTopologyEventV0(row.before, row.san);
    const expected = encodeChessTopologyEventV0(row.before, trace.bestMove);
    const drift = calculateTopologyDriftV0(played, expected);

    const point = commitDriftCubeObservationV0({
      sourceSpace: "chess",
      matchId: opts.matchId || null,
      x: played?.to || [],
      y: trace.moveNumber || 0,
      z: drift.magnitude,
      played,
      expected,
      drift
    });

    observations.push(
      Object.freeze({
        moveNumber: trace.moveNumber,
        san: row.san,
        bestMove: trace.bestMove,
        played,
        expected,
        drift,
        cubePoint: point
      })
    );
  }

  return Object.freeze({
    schema: RHIZOH_GEOMETRY_CHESS_OBSERVER_SCHEMA_V0,
    matchId: opts.matchId || null,
    observationCount: observations.length,
    observations: Object.freeze(observations),
    summary: summarizeDriftCubeV0(observations.map((o) => o.cubePoint))
  });
}
