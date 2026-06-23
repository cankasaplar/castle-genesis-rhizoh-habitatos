/**
 * Batch flush → opening book — truth-approved lines reinforce database prior.
 * RESEARCH-ONLY
 */

import { detectChessOpeningV0 } from "./chessOpeningDetectV0.js";
import { recordOpeningFromMatchV0 } from "./rhizohOpeningBookV0.js";

export const CHESS_LEARNING_BATCH_OPENING_FEED_SCHEMA_V0 =
  "castle.rhizoh.chess_learning_batch_opening_feed.v0";

let linesFedV0 = 0;
let lastFeedAtMsV0 = 0;

/**
 * @param {ReadonlyArray<{ sanMoves?: string[], playedMove?: string, drifted?: boolean, matchedRank?: number | null }>} batch
 */
export function feedOpeningBookFromLearningBatchV0(batch = []) {
  let fed = 0;
  for (const sample of batch) {
    const sanMoves = Array.isArray(sample.sanMoves)
      ? sample.sanMoves.map((m) => String(m || "").trim()).filter(Boolean)
      : [];
    if (sanMoves.length < 2) continue;

    const opening = detectChessOpeningV0(sanMoves);
    const name = opening?.name || classifyOpeningFromMovesV0(sanMoves);
    const aligned = sample.drifted !== true && Number(sample.matchedRank) === 1;
    const row = recordOpeningFromMatchV0({
      name,
      eco: opening?.eco || null,
      moves: sanMoves.slice(0, 12),
      won: aligned,
      lost: sample.drifted === true
    });
    if (row) {
      fed += 1;
      linesFedV0 += 1;
    }
  }
  if (fed > 0) lastFeedAtMsV0 = Date.now();
  return Object.freeze({
    schema: CHESS_LEARNING_BATCH_OPENING_FEED_SCHEMA_V0,
    fed,
    totalFed: linesFedV0,
    atMs: lastFeedAtMsV0 || Date.now()
  });
}

function classifyOpeningFromMovesV0(moves) {
  const joined = moves.join(" ").toLowerCase();
  if (joined.startsWith("e4 c5")) return "Sicilian Defense";
  if (joined.startsWith("e4 e5 nf3 nc6 bc4")) return "Italian Game";
  if (joined.startsWith("d4 d5 c4")) return "Queen's Gambit";
  if (joined.startsWith("c4")) return "English Opening";
  if (joined.startsWith("e4 e5 nf3 nc6 d4")) return "Scotch Game";
  if (joined.startsWith("e4 e6")) return "French Defense";
  if (joined.startsWith("e4 c6")) return "Caro-Kann Defense";
  return "Cluster line";
}

export function getChessLearningBatchOpeningFeedSnapshotV0() {
  return Object.freeze({
    schema: CHESS_LEARNING_BATCH_OPENING_FEED_SCHEMA_V0,
    linesFed: linesFedV0,
    lastFeedAtMs: lastFeedAtMsV0 || null,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessLearningBatchOpeningFeedForTestV0() {
  linesFedV0 = 0;
  lastFeedAtMsV0 = 0;
}
