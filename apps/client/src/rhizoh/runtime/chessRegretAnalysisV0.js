/**
 * Rhizoh chess regret analysis — flags win-to-draw / missed conversion lines.
 */

import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { analyzePlayedMoveV0 } from "./chessStockfishEngineV0.js";

export const CHESS_REGRET_ANALYSIS_SCHEMA_V0 = "rhizoh.chess_regret_analysis.v0";

export const CHESS_REGRET_FLAG_V0 = Object.freeze({
  FORCED_WIN_DETECTED: "FORCED_WIN_DETECTED",
  BUT_NOT_TAKEN: "BUT_NOT_TAKEN",
  LOSS_AVOIDANCE_BIAS: "LOSS_AVOIDANCE_BIAS"
});

const WINNING_CP_V0 = 120;
const FORCED_WIN_CP_V0 = 200;
const REGRET_SWING_CP_V0 = -45;
const FORCED_WIN_SWING_CP_V0 = -35;
const SAMPLE_DEPTH_V0 = 9;
const SAMPLE_MOVETIME_MS_V0 = 320;

/**
 * @param {number} cp
 * @param {'w'|'b'} color
 */
function sideCpV0(cp, color) {
  const v = Number(cp) || 0;
  return color === "w" ? v : -v;
}

/**
 * @param {{
 *   moves: ReadonlyArray<string|object>,
 *   localColor?: 'w' | 'b',
 *   maxSamples?: number
 * }} opts
 */
export async function analyzeRhizohRegretV0(opts = {}) {
  const localColor = opts.localColor === "b" ? "b" : "w";
  const rows = buildMatchMovesWithFenV0(opts.moves || []);
  const localRows = rows.filter((r) => r.color === localColor);
  const maxSamples = Math.max(4, Math.min(24, Number(opts.maxSamples) || 12));

  const sampleRows =
    localRows.length <= maxSamples
      ? localRows
      : [
          ...localRows.slice(0, 3),
          ...localRows.slice(-Math.max(3, maxSamples - 3))
        ].filter((row, idx, arr) => arr.indexOf(row) === idx);

  /** @type {object[]} */
  const evalTrace = [];
  /** @type {object[]} */
  const regrets = [];
  /** @type {object[]} */
  const mistakeMap = [];
  /** @type {object[]} */
  const forcedWinAnomalies = [];

  for (const row of sampleRows) {
    const analysis = await analyzePlayedMoveV0(row.before, row.san, {
      depth: SAMPLE_DEPTH_V0,
      movetimeMs: SAMPLE_MOVETIME_MS_V0
    });
    if (!analysis) continue;

    const beforeCp = sideCpV0(analysis.before?.cp ?? 0, localColor);
    const swingCp = analysis.swingCp;
    const bestSan = analysis.alternative || analysis.bestMove || "";
    const mateWin = analysis.before?.mate != null && analysis.before.mate > 0;
    const forcedWinLine = mateWin || beforeCp >= FORCED_WIN_CP_V0;
    const playedDiffersFromBest =
      bestSan &&
      row.san &&
      String(bestSan).toLowerCase() !== String(row.san).toLowerCase();
    const notTaken =
      forcedWinLine && playedDiffersFromBest && swingCp != null && swingCp <= FORCED_WIN_SWING_CP_V0;

    const flags = [];
    if (forcedWinLine) flags.push(CHESS_REGRET_FLAG_V0.FORCED_WIN_DETECTED);
    if (notTaken) flags.push(CHESS_REGRET_FLAG_V0.BUT_NOT_TAKEN);

    const traceRow = Object.freeze({
      moveNumber: rows.indexOf(row) + 1,
      san: row.san,
      beforeCp: Math.round(beforeCp),
      swingCp: swingCp != null ? Math.round(swingCp) : null,
      bestMove: bestSan,
      depth: analysis.before?.depth ?? null,
      flags: Object.freeze(flags),
      forcedWinLine,
      notTaken
    });
    evalTrace.push(traceRow);

    if (swingCp != null && swingCp <= REGRET_SWING_CP_V0) {
      mistakeMap.push(
        Object.freeze({
          moveNumber: traceRow.moveNumber,
          san: row.san,
          swingCp: traceRow.swingCp,
          bestMove: bestSan,
          kind: beforeCp >= FORCED_WIN_CP_V0 ? "blunder" : "inaccuracy"
        })
      );
    }

    if (notTaken) {
      const anomaly = Object.freeze({
        ...traceRow,
        kind: "forced_win_ignored",
        summary: "Forced win line exists but was not taken."
      });
      forcedWinAnomalies.push(anomaly);
      regrets.push(anomaly);
    } else if (beforeCp >= WINNING_CP_V0 && swingCp != null && swingCp <= REGRET_SWING_CP_V0) {
      regrets.push(
        Object.freeze({
          ...traceRow,
          kind: beforeCp >= 250 ? "missed_win" : "win_to_draw_risk",
          summary:
            beforeCp >= 250
              ? "Winning position — played move gave up conversion."
              : "Advantage — safer line may have cost the win."
        })
      );
    }
  }

  regrets.sort((a, b) => Math.abs(b.swingCp || 0) - Math.abs(a.swingCp || 0));

  const forcedWinIgnored = forcedWinAnomalies.length > 0;
  const lossAvoidanceBias = regrets.length >= 2 || forcedWinIgnored;
  const anomalyFlags = Object.freeze(
    [
      forcedWinIgnored ? CHESS_REGRET_FLAG_V0.BUT_NOT_TAKEN : null,
      forcedWinAnomalies.some((a) => a.forcedWinLine)
        ? CHESS_REGRET_FLAG_V0.FORCED_WIN_DETECTED
        : null,
      lossAvoidanceBias ? CHESS_REGRET_FLAG_V0.LOSS_AVOIDANCE_BIAS : null
    ].filter(Boolean)
  );

  return Object.freeze({
    schema: CHESS_REGRET_ANALYSIS_SCHEMA_V0,
    localColor,
    moveCount: rows.length,
    sampledMoves: evalTrace.length,
    regretCount: regrets.length,
    lossAvoidanceBias,
    forcedWinIgnored,
    forcedWinAnomalies: Object.freeze(forcedWinAnomalies),
    anomalyFlags,
    mistakeMap: Object.freeze(mistakeMap),
    evalTrace: Object.freeze(evalTrace),
    regrets: Object.freeze(regrets),
    topRegret: regrets[0] || null,
    analyzedAt: new Date().toISOString()
  });
}
