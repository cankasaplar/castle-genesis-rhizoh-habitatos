import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  fuseChessEvalSourcesV0,
  normalizeChessEvalCpV0,
  stockfishCpFromMatchedRankV0
} from "../chessEvalFusionV0.js";
import {
  __resetChessLearningAgreementGateForTestV0,
  evaluateChessLearningAgreementGateV0,
  CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0
} from "../chessLearningAgreementGateV0.js";
import {
  __resetChessLearningBatchForTestV0,
  CHESS_LEARNING_BATCH_SIZE_V0,
  enqueueChessLearningBatchSampleV0,
  flushChessLearningBatchV0,
  getChessLearningBatchSnapshotV0
} from "../chessLearningBatchV0.js";
import {
  __resetChessFenClusterMemoryForTestV0,
  fenToClusterIdV0,
  rememberFenClusterObservationV0
} from "../chessFenClusterMemoryV0.js";
import {
  clearChessClusterDriftDatasetForTestV0,
  recordChessClusterMoveDriftV0,
  submitChessClusterTruthLearningSampleV0
} from "../chessClusterDriftDatasetV0.js";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import { resetChessLearningWeightsForTestV0, readChessLearningWeightsV0 } from "../chessLearningWeightsV0.js";

describe("chessLearningV2Truth", () => {
  beforeEach(() => {
    __resetChessLearningAgreementGateForTestV0();
    __resetChessLearningBatchForTestV0();
    __resetChessFenClusterMemoryForTestV0();
    clearChessClusterDriftDatasetForTestV0();
    resetChessLearningWeightsForTestV0();
    window.__rhizoh = {};
  });

  afterEach(() => {
    resetChessLearningWeightsForTestV0();
  });

  it("fuses stockfish + leela stub + database with weighted final eval", () => {
    const fusion = fuseChessEvalSourcesV0({
      stockfishCp: 40,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      sanMoves: ["e4"]
    });
    expect(fusion.sourceCount).toBeGreaterThanOrEqual(2);
    expect(fusion.finalEval).toBeGreaterThanOrEqual(-1);
    expect(fusion.finalEval).toBeLessThanOrEqual(1);
    expect(fusion.sources).toContain("stockfish");
  });

  it("rejects learning when engine variance exceeds threshold", () => {
    const fusion = Object.freeze({
      variance: CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0 + 0.1,
      sourceCount: 3,
      finalEval: 0
    });
    const gate = evaluateChessLearningAgreementGateV0(fusion);
    expect(gate.learningEligible).toBe(false);
    expect(gate.ambiguous).toBe(true);
  });

  it("accepts truth path using stockfish + DB when leela_stub inflates full variance", () => {
    const fusion = Object.freeze({
      schema: "castle.rhizoh.chess_eval_fusion.v0",
      stockfishCp: 40,
      databaseWinrate: 0.52,
      leelaCp: -200,
      variance: 0.62,
      sourceCount: 3,
      finalEval: 0.1,
      sources: Object.freeze(["stockfish", "leela_stub", "database"])
    });
    const gatePreview = evaluateChessLearningAgreementGateV0(fusion, { drifted: true, matchedRank: 2 });
    expect(gatePreview.learningEligible).toBe(false);
    expect(gatePreview.reason).toBe("high_variance");

    const gateTruth = evaluateChessLearningAgreementGateV0(fusion, {
      truthAuthoritative: true,
      drifted: true,
      matchedRank: 2
    });
    expect(gateTruth.learningEligible).toBe(true);
    expect(gateTruth.accepted).toBe(true);
  });

  it("accepts low-variance fusion for batch enqueue", () => {
    const fusion = fuseChessEvalSourcesV0({ stockfishCp: 10, databaseWinrate: 0.52 });
    const gate = evaluateChessLearningAgreementGateV0(fusion, { drifted: true, matchedRank: 3 });
    expect(gate.learningEligible).toBe(true);

    const out = enqueueChessLearningBatchSampleV0({
      position: "fen",
      playedMove: "e2e4",
      bestMove: "d2d4",
      drifted: true,
      gate,
      fusion
    });
    expect(out.enqueued).toBe(true);
    expect(out.pending).toBe(1);
  });

  it("flushes batch of 32 into weight update", () => {
    const fusion = fuseChessEvalSourcesV0({ stockfishCp: 0, databaseWinrate: 0.5 });
    const gate = evaluateChessLearningAgreementGateV0(fusion, { drifted: false, matchedRank: 1 });

    for (let i = 0; i < CHESS_LEARNING_BATCH_SIZE_V0; i++) {
      enqueueChessLearningBatchSampleV0({
        position: `fen_${i}`,
        playedMove: "e2e4",
        bestMove: "e2e4",
        drifted: false,
        gate,
        fusion
      });
    }

    const snap = getChessLearningBatchSnapshotV0();
    expect(snap.batchesFlushed).toBe(1);
    expect(snap.pending).toBe(0);
    expect(readChessLearningWeightsV0().matchesLearned).toBeGreaterThan(0);
  });

  it("maps matched rank to stockfish cp proxy", () => {
    expect(stockfishCpFromMatchedRankV0(1)).toBe(0);
    expect(normalizeChessEvalCpV0(200)).toBe(0.5);
  });

  it("clusters FEN observations by structural key", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const a = rememberFenClusterObservationV0(fen, { ply: 1 });
    const b = rememberFenClusterObservationV0(fen, { ply: 2 });
    expect(a.clusterId).toBe(b.clusterId);
    expect(b.count).toBe(2);
    expect(fenToClusterIdV0(fen)).toBe(a.clusterId);
  });

  it("heuristic preview does not enqueue batch learning", () => {
    const game = createChessArenaGameV0();
    const slot = { slotId: 2, matchId: "m1", game, moveHistory: [], ply: 1 };
    const moveRow = {
      ply: 2,
      uci: "e2e4",
      san: "e4",
      fenBefore: game.fen(),
      fenAfter: game.fen()
    };
    const row = recordChessClusterMoveDriftV0(slot, moveRow);
    expect(row?.learningEligible).toBe(false);
    expect(row?.observabilityOnly).toBe(true);
    expect(getChessLearningBatchSnapshotV0().pending).toBe(0);
  });

  it("engine truth sample enqueues batch when gate accepts", () => {
    const game = createChessArenaGameV0();
    const slot = { slotId: 1, matchId: "m2", game, moveHistory: [{ san: "e4" }], ply: 1 };
    const moveRow = {
      ply: 2,
      uci: "e7e5",
      san: "e5",
      fenBefore: game.fen(),
      fenAfter: game.fen()
    };
    const row = submitChessClusterTruthLearningSampleV0(slot, moveRow, {
      engineBest: "e7e5",
      matchedRank: 1,
      stockfishCp: 15,
      source: "learn_buffer_enrich"
    });
    expect(row?.truthAuthoritative).toBe(true);
    expect(row?.learningEligible).toBe(true);
    expect(getChessLearningBatchSnapshotV0().pending).toBe(1);
  });

  it("drift preview row is observability-only", () => {
    const game = createChessArenaGameV0();
    const slot = {
      slotId: 2,
      matchId: "m1",
      game,
      moveHistory: [],
      ply: 1
    };
    const moveRow = {
      ply: 2,
      uci: "e2e4",
      san: "e4",
      fenBefore: game.fen(),
      fenAfter: game.fen()
    };
    const row = recordChessClusterMoveDriftV0(slot, moveRow);
    expect(row?.observabilityOnly).toBe(true);
    expect(row?.learningEligible).toBe(false);
  });
});
