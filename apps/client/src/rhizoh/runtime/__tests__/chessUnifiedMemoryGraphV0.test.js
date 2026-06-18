import { beforeEach, describe, expect, it } from "vitest";
import { __resetChessMemoryStoreForTestV0 } from "../chessMemoryStoreV0.js";
import { __resetChessCorpusExpansionForTestV0, loadChessCorpusExpansionBundlesV0 } from "../chessCorpusExpansionLoaderV0.js";
import { __resetChessHistoryBrainForTestV0 } from "../chessHistoryBrainReportV0.js";
import {
  __resetChessUnifiedMemoryGraphForTestV0,
  mergeChessUnifiedMemoryGraphV0,
  positionIdFromFenV0,
  readChessUnifiedMemoryGraphV0,
  upsertChessMoveEdgeV0,
  upsertChessWeightUpdateEdgeV0,
  CHESS_UNIFIED_EDGE_KIND_V0
} from "../chessUnifiedMemoryGraphV0.js";
import {
  projectChessMovesIntoUnifiedGraphV0,
  rebuildChessUnifiedGraphFromStoresV0
} from "../chessUnifiedGraphProjectorV0.js";
import {
  __resetChessUnifiedMemoryGraphBootForTestV0,
  ensureChessUnifiedMemoryGraphV0
} from "../chessUnifiedMemoryGraphBootV0.js";
import { resetChessLearningWeightsForTestV0 } from "../chessLearningWeightsV0.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("chessUnifiedMemoryGraphV0", () => {
  beforeEach(() => {
    __resetChessUnifiedMemoryGraphForTestV0();
    __resetChessMemoryStoreForTestV0();
    __resetChessCorpusExpansionForTestV0();
    __resetChessHistoryBrainForTestV0();
    __resetChessUnifiedMemoryGraphBootForTestV0();
    resetChessLearningWeightsForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
  });

  it("creates PositionNode and MoveEdge from SAN list", () => {
    const out = projectChessMovesIntoUnifiedGraphV0(["e4", "e5", "Nf3"], {
      source: "gm_classical",
      gameId: "test_game"
    });
    expect(out.projected).toBe(3);
    const graph = readChessUnifiedMemoryGraphV0();
    expect(graph.stats.positionCount).toBeGreaterThanOrEqual(2);
    expect(graph.stats.moveEdgeCount).toBe(3);
  });

  it("merge never decreases visitCount or playCount", () => {
    upsertChessMoveEdgeV0({
      fromFen: START_FEN,
      toFen: START_FEN.replace(" w ", " b ").replace("0 1", "0 1"),
      san: "e4",
      source: "live_rhizoh"
    });
    const live = readChessUnifiedMemoryGraphV0();
    const remote = {
      nodes: live.nodes.map((n) => ({ ...n, visitCount: (n.visitCount || 0) + 5 })),
      edges: live.edges.map((e) => ({ ...e, playCount: (e.playCount || 0) + 3 }))
    };
    localStorage.clear();
    __resetChessUnifiedMemoryGraphForTestV0();
    mergeChessUnifiedMemoryGraphV0(remote);
    const merged = readChessUnifiedMemoryGraphV0();
    expect(merged.nodes[0]?.visitCount).toBeGreaterThanOrEqual(5);
    expect(merged.edges[0]?.playCount).toBeGreaterThanOrEqual(3);
  });

  it("records WeightUpdateEdge from learning loop shape", () => {
    upsertChessWeightUpdateEdgeV0({
      matchId: "m1",
      weightsBefore: { matchesLearned: 11, aggressionBias: 0, winForcingWeight: 1, riskPenaltyWeight: 0.55 },
      weightsAfter: { matchesLearned: 12, aggressionBias: 0.05, winForcingWeight: 1.05, riskPenaltyWeight: 0.5 },
      regret: { forcedWinIgnored: true }
    });
    const graph = readChessUnifiedMemoryGraphV0();
    const wu = graph.edges.find((e) => e.kind === CHESS_UNIFIED_EDGE_KIND_V0.WEIGHT_UPDATE);
    expect(wu?.matchesLearnedAfter).toBe(12);
    expect(wu?.regretSummary?.forcedWinIgnored).toBe(true);
  });

  it("loads corpus expansion bundles idempotently", () => {
    const first = loadChessCorpusExpansionBundlesV0();
    expect(first.totalImported).toBeGreaterThan(0);
    const second = loadChessCorpusExpansionBundlesV0();
    expect(second.bundles.every((b) => b.skipped)).toBe(true);
    const graph = readChessUnifiedMemoryGraphV0();
    expect(graph.stats.moveEdgeCount).toBeGreaterThan(10);
  });

  it("installs window.__rhizoh.chessUnifiedMemoryGraph", () => {
    ensureChessUnifiedMemoryGraphV0();
    expect(typeof window.__rhizoh.chessUnifiedMemoryGraph).toBe("function");
    const report = window.__rhizoh.chessUnifiedMemoryGraph();
    expect(report.singleNotebook).toHaveProperty("positionNodes");
    expect(report.weightMatrix).toHaveProperty("matchesLearned");
  });

  it("positionIdFromFen is stable", () => {
    const a = positionIdFromFenV0(START_FEN);
    const b = positionIdFromFenV0(START_FEN);
    expect(a).toBe(b);
    expect(a).toMatch(/^pos_/);
  });

  it("rebuildChessUnifiedGraphFromStores projects lifetime FEN hints", () => {
    localStorage.setItem(
      "rhizoh.chess.lifetime_stats.v0",
      JSON.stringify({
        uniqueFenHints: [START_FEN],
        backfilledAt: new Date().toISOString()
      })
    );
    const out = rebuildChessUnifiedGraphFromStoresV0();
    expect(out.hintsProjected).toBe(1);
  });
});
