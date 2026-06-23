/**
 * Chess learning DevTools hooks — observation / recovery only (RESEARCH-ONLY).
 */

import {
  drainUglLearnBufferV0,
  recoverStuckUglLearnDrainV0
} from "./rhizohUglLearnBufferSinkV0.js";
import {
  flushChessLearningBatchV0,
  maybeFlushChessLearningMiniBatchV0
} from "./chessLearningBatchV0.js";

export function ensureChessLearningDebugV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.chessLearningDebug) return window.__rhizoh.chessLearningDebug;

  window.__rhizoh.chessLearningDebug = Object.freeze({
    schema: "castle.rhizoh.chess_learning_debug.v0",
    recoverDrain: () => recoverStuckUglLearnDrainV0(),
    nudgeDrain: () => drainUglLearnBufferV0(),
    tryMiniFlush: () => maybeFlushChessLearningMiniBatchV0(),
    flushBatch: (reason = "debug_manual") => flushChessLearningBatchV0(reason),
    note: "No governance override — drain recovery + optional manual batch flush"
  });
  return window.__rhizoh.chessLearningDebug;
}

/** @internal vitest */
export function __resetChessLearningDebugForTestV0() {
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessLearningDebug;
  }
}
