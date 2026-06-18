/**
 * Corpus regret proxy — offline batch training without blocking Stockfish per move.
 * RESEARCH-ONLY
 */

export const CHESS_BATCH_REGRET_PROXY_SCHEMA_V0 = "castle.rhizoh.chess_batch_regret_proxy.v0";

/**
 * Build regret-shaped signal from corpus patterns + result (no engine).
 * @param {object} game — chessMemoryStore game row
 */
export function buildCorpusRegretProxyV0(game = {}) {
  const moves = game.moves || [];
  const tactical = game.patterns?.tactical || {};
  const density = Number(tactical.tacticalDensity) || 0;
  const checks = Number(tactical.checks) || 0;
  const captures = Number(tactical.captures) || 0;
  const result = String(game.result || "*");
  const decisive = result === "1-0" || result === "0-1";

  const forcedWinIgnored = decisive && density >= 0.28 && checks + captures >= 2;
  const lossAvoidanceBias = result === "1/2-1/2" && density < 0.12 && moves.length >= 10;

  return Object.freeze({
    schema: CHESS_BATCH_REGRET_PROXY_SCHEMA_V0,
    gameId: game.id,
    qualityTier: game.qualityTier,
    moveCount: moves.length,
    tacticalDensity: density,
    forcedWinIgnored,
    lossAvoidanceBias,
    regretCount: forcedWinIgnored || lossAvoidanceBias ? 1 : 0,
    source: "corpus_proxy"
  });
}

/**
 * Aggregate proxy regrets across corpus batch.
 * @param {ReadonlyArray<object>} proxies
 */
export function aggregateBatchRegretV0(proxies = []) {
  let forcedWinSignals = 0;
  let lossAvoidanceSignals = 0;
  let totalMoves = 0;

  for (const row of proxies) {
    if (row.forcedWinIgnored) forcedWinSignals += 1;
    if (row.lossAvoidanceBias) lossAvoidanceSignals += 1;
    totalMoves += Number(row.moveCount) || 0;
  }

  const n = Math.max(1, proxies.length);
  return Object.freeze({
    schema: `${CHESS_BATCH_REGRET_PROXY_SCHEMA_V0}.aggregate`,
    gamesSampled: proxies.length,
    totalMoves,
    forcedWinSignals,
    lossAvoidanceSignals,
    forcedWinIgnored: forcedWinSignals / n >= 0.2,
    lossAvoidanceBias: lossAvoidanceSignals / n >= 0.15,
    forcedWinRatio: forcedWinSignals / n,
    lossAvoidanceRatio: lossAvoidanceSignals / n,
    regretCount: forcedWinSignals + lossAvoidanceSignals
  });
}

/**
 * Wrap live archive regret for batch merge.
 * @param {object} archiveRow
 */
export function archiveRegretToBatchSampleV0(archiveRow = {}) {
  const regret = archiveRow.regret;
  if (!regret) return null;
  return Object.freeze({
    schema: CHESS_BATCH_REGRET_PROXY_SCHEMA_V0,
    gameId: archiveRow.id,
    qualityTier: "live_rhizoh",
    moveCount: archiveRow.moves?.length || 0,
    forcedWinIgnored: Boolean(regret.forcedWinIgnored),
    lossAvoidanceBias: Boolean(regret.lossAvoidanceBias),
    regretCount: Number(regret.regretCount) || 0,
    source: "arena_archive"
  });
}
