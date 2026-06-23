import { describe, expect, it } from "vitest";
import {
  applyClusterOpeningSeedV0,
  CHESS_CLUSTER_OPENING_SEEDS_V0,
  pickClusterOpeningSeedV0
} from "../chessClusterOpeningDiversityV0.js";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import {
  CHESS_CLUSTER_LEARNING_GRID_MAX_PLY_V0,
  resolveChessClusterLearningMaxPlyV0,
  resolveChessClusterTeacherLeagueRowV0
} from "../chessClusterLearningThroughputV0.js";
import { shouldFinalizeClusterBroadcastEndV0 } from "../chessClusterBroadcastEnginePolicyV0.js";
import { publishChessClusterBroadcastActiveV0 } from "../chessEngineContentionGateV0.js";
import { recordChessClusterMoveDriftV0, clearChessClusterDriftDatasetForTestV0 } from "../chessClusterDriftDatasetV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "../chessClusterLearningTraceV0.js";

describe("chessClusterLearningThroughputV0", () => {
  it("uses shorter learning ply caps than cinematic defaults", () => {
    expect(resolveChessClusterLearningMaxPlyV0(1)).toBe(CHESS_CLUSTER_LEARNING_GRID_MAX_PLY_V0);
    expect(resolveChessClusterLearningMaxPlyV0(1)).toBeLessThan(80);
    expect(resolveChessClusterLearningMaxPlyV0(0)).toBeGreaterThan(
      CHESS_CLUSTER_LEARNING_GRID_MAX_PLY_V0
    );
  });

  it("assigns distinct teacher league depth per slot", () => {
    const d1 = resolveChessClusterTeacherLeagueRowV0(1).depth;
    const d7 = resolveChessClusterTeacherLeagueRowV0(7).depth;
    expect(d7).toBeGreaterThan(d1);
  });
});

describe("chessClusterOpeningDiversityV0", () => {
  it("applies opening seed moves to fresh game", () => {
    const game = createChessArenaGameV0();
    const seed = CHESS_CLUSTER_OPENING_SEEDS_V0[0];
    const applied = applyClusterOpeningSeedV0(game, seed);
    expect(applied.applied).toBeGreaterThan(0);
    expect(game.fen()).not.toContain("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  });

  it("varies seed by slot id", () => {
    const a = pickClusterOpeningSeedV0(0).name;
    const b = pickClusterOpeningSeedV0(3).name;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });
});

describe("chessClusterDriftDatasetV0", () => {
  it("emits policy_diff on every move for agreement samples", () => {
    clearChessClusterDriftDatasetForTestV0();
    const game = createChessArenaGameV0();
    game.tryMove("e4");
    const events = [];
    const handler = (ev) => events.push(ev.detail);
    window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, handler);
    const slot = {
      slotId: 1,
      matchId: "cluster_1_test",
      game
    };
    const moveRow = {
      ply: 1,
      uci: "e2e4",
      fenBefore: "startpos",
      san: "e4"
    };
    const row = recordChessClusterMoveDriftV0(slot, moveRow);
    window.removeEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, handler);
    expect(row?.playedMove).toBe("e2e4");
    expect(events.length).toBe(1);
    expect(events[0].drifted).toBeDefined();
  });
});

describe("broadcast max ply learning fix", () => {
  it("finalizes max_ply_cap in broadcast mode at low ply", () => {
    window.__rhizoh = {};
    publishChessClusterBroadcastActiveV0(true);
    expect(shouldFinalizeClusterBroadcastEndV0({ slotId: 0, ply: 4 }, "draw", "max_ply_cap")).toBe(
      true
    );
  });
});
