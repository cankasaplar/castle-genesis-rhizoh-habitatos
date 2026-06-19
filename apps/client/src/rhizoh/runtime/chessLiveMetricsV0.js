/**
 * Chess live metrics v0 — momentum + accuracy + risk (not classical Elo).
 */

export const CHESS_LIVE_METRICS_SCHEMA_V0 = "rhizoh.chess_live_metrics.v0";

/**
 * @param {{
 *   outcome?: string,
 *   regret?: { regretCount?: number, forcedWinIgnored?: boolean, evalTrace?: object[] },
 *   moveCount?: number,
 *   localColor?: 'w' | 'b'
 * }} opts
 */
export function computeChessLiveMetricsV0(opts = {}) {
  const trace = opts.regret?.evalTrace || [];
  const swings = trace.map((t) => t.swingCp).filter((v) => v != null);
  const avgSwing =
    swings.length > 0 ? swings.reduce((a, b) => a + b, 0) / swings.length : 0;
  const accuracy =
    swings.length > 0
      ? Math.max(0, Math.min(100, Math.round(72 + avgSwing * 0.35)))
      : 50;

  const draw =
    opts.outcome === "draw" || opts.outcome === "stalemate";
  const won =
    !draw &&
    (opts.outcome === "white_wins"
      ? opts.localColor !== "b"
      : opts.outcome === "black_wins"
        ? opts.localColor === "b"
        : false);

  let momentum = 0;
  if (won) momentum = 0.35;
  else if (draw) momentum = opts.regret?.forcedWinIgnored ? -0.25 : -0.05;
  else momentum = -0.3;

  const riskIndex = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        50 +
          (opts.regret?.regretCount || 0) * 8 +
          (opts.regret?.forcedWinIgnored ? 22 : 0) -
          accuracy * 0.2
      )
    )
  );

  return Object.freeze({
    schema: CHESS_LIVE_METRICS_SCHEMA_V0,
    accuracy,
    momentum: Number(momentum.toFixed(2)),
    riskIndex,
    moveCount: Number(opts.moveCount) || 0,
    regretCount: opts.regret?.regretCount || 0,
    forcedWinIgnored: opts.regret?.forcedWinIgnored === true
  });
}
