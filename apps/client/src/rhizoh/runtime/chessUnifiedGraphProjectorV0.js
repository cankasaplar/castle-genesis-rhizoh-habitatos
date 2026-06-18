/**
 * Project corpus / live / learning signals into unified chess memory graph.
 * RESEARCH-ONLY
 */

import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { readChessMemoryStoreV0 } from "./chessMemoryStoreV0.js";
import { listRhizohOpeningBookV0 } from "./rhizohOpeningBookV0.js";
import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { backfillChessLifetimeStatsFromStoresV0 } from "./rhizohChessLifetimeStatsV0.js";
import {
  upsertChessEvalEdgeV0,
  upsertChessMoveEdgeV0,
  upsertChessPositionNodeV0,
  upsertChessWeightUpdateEdgeV0,
  readChessUnifiedMemoryGraphV0
} from "./chessUnifiedMemoryGraphV0.js";
import { classifyOpeningBucketV0 } from "./chessHistoryPatternV0.js";

/**
 * @param {ReadonlyArray<string|object>} moves
 * @param {{ source?: string, matchId?: string, gameId?: string, agentId?: string, qualityTier?: string }} meta
 */
export function projectChessMovesIntoUnifiedGraphV0(moves = [], meta = {}) {
  const fenRows = buildMatchMovesWithFenV0(moves);
  const openingBucket = classifyOpeningBucketV0(
    fenRows.map((r) => r.san)
  );
  let projected = 0;
  for (let i = 0; i < fenRows.length; i += 1) {
    const row = fenRows[i];
    upsertChessMoveEdgeV0({
      fromFen: row.before,
      toFen: row.after,
      san: row.san,
      ply: i + 1,
      color: row.color,
      source: meta.source || meta.qualityTier || "live_rhizoh",
      matchId: meta.matchId,
      gameId: meta.gameId,
      agentId: meta.agentId,
      atMs: meta.atMs
    });
    if (meta.evalCp != null && i === fenRows.length - 1) {
      upsertChessEvalEdgeV0({
        fen: row.after,
        cp: meta.evalCp,
        engine: meta.engine || "heuristic",
        source: meta.source || "live_rhizoh",
        atMs: meta.atMs
      });
    }
    projected += 1;
  }
  if (fenRows[0]) {
    upsertChessPositionNodeV0(fenRows[0].before, {
      source: meta.source,
      openingBucket,
      atMs: meta.atMs
    });
  }
  return Object.freeze({ projected, positions: fenRows.length + 1, openingBucket });
}

/**
 * @param {object} gameRow — chessMemoryStore game record
 */
export function projectChessHistoryGameIntoUnifiedGraphV0(gameRow = {}) {
  const source = gameRow.qualityTier || gameRow.source || "gm_classical";
  const out = projectChessMovesIntoUnifiedGraphV0(gameRow.moves || [], {
    source,
    gameId: gameRow.id,
    qualityTier: gameRow.qualityTier
  });
  const tactical = gameRow.patterns?.tactical;
  if (tactical?.tacticalDensity != null && gameRow.moves?.length) {
    const fenRows = buildMatchMovesWithFenV0(gameRow.moves);
    const last = fenRows[fenRows.length - 1];
    if (last) {
      upsertChessEvalEdgeV0({
        fen: last.after,
        cp: Math.round(tactical.tacticalDensity * 100),
        engine: "corpus_proxy",
        source,
        atMs: Date.parse(gameRow.importedAt) || Date.now()
      });
    }
  }
  return out;
}

/**
 * @param {ReturnType<import('./chessLearningLoopV0.js').runRhizohChessLearningLoopV0>} loopResult
 */
export function projectLearningLoopIntoUnifiedGraphV0(loopResult = {}) {
  projectChessMovesIntoUnifiedGraphV0(loopResult.pgnMoves || [], {
    source: "live_rhizoh",
    matchId: loopResult.matchId
  });
  upsertChessWeightUpdateEdgeV0({
    matchId: loopResult.matchId,
    weightsBefore: loopResult.weightsBefore,
    weightsAfter: loopResult.weightsAfter,
    regret: loopResult.regret,
    atMs: Date.parse(loopResult.learnedAt) || Date.now()
  });
}

/**
 * @param {object} observation — cluster observer output
 * @param {{ fenBefore?: string, fenAfter?: string, san?: string, ply?: number, agentId?: string }} moveRow
 */
export function projectClusterObservationIntoUnifiedGraphV0(observation = {}, moveRow = {}) {
  if (moveRow.fenBefore && moveRow.fenAfter && moveRow.san) {
    projectChessMovesIntoUnifiedGraphV0(
      [{ san: moveRow.san, before: moveRow.fenBefore }],
      {
        source: "live_rhizoh",
        matchId: observation.matchId || moveRow.matchId,
        agentId: moveRow.agentId || observation.agentId,
        atMs: observation.atMs
      }
    );
    if (observation.evalDelta != null) {
      upsertChessEvalEdgeV0({
        fen: moveRow.fenAfter,
        cp: Math.round(Number(observation.evalDelta) * 100),
        engine: "heuristic",
        source: "live_rhizoh",
        atMs: observation.atMs
      });
    }
  }
}

/**
 * Backfill unified graph from corpus games + opening book + lifetime FEN hints.
 */
export function rebuildChessUnifiedGraphFromStoresV0() {
  const store = readChessMemoryStoreV0();
  const openings = listRhizohOpeningBookV0();
  const lifetime = backfillChessLifetimeStatsFromStoresV0();
  let gamesProjected = 0;
  let openingsProjected = 0;
  let hintsProjected = 0;

  for (const game of store.games || []) {
    projectChessHistoryGameIntoUnifiedGraphV0(game);
    gamesProjected += 1;
  }
  for (const entry of openings) {
    if (!entry.moves?.length) continue;
    projectChessMovesIntoUnifiedGraphV0(entry.moves, {
      source: "opening_book",
      gameId: entry.id || entry.key
    });
    openingsProjected += 1;
  }
  for (const fen of lifetime.uniqueFenHints || []) {
    upsertChessPositionNodeV0(fen, { source: "lifetime_ledger" });
    hintsProjected += 1;
  }

  const graph = readChessUnifiedMemoryGraphV0();
  const weights = readChessLearningWeightsV0();
  return Object.freeze({
    ok: true,
    gamesProjected,
    openingsProjected,
    hintsProjected,
    graphStats: graph.stats,
    matchesLearned: weights.matchesLearned,
    atMs: Date.now()
  });
}
