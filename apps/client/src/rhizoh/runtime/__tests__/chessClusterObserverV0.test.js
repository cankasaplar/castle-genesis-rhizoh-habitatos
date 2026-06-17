import { beforeEach, describe, expect, it } from "vitest";
import { createChessArenaGameV0, CHESS_GAME_MODE_V0 } from "../chessArenaEngineV0.js";
import {
  __resetChessClusterObserverForTestV0,
  getChessClusterPatternCountsV0,
  observeChessClusterMoveV0
} from "../chessClusterObserverV0.js";
import { __resetChessClusterMemoryGraphForTestV0, listChessClusterMemoryNodesV0 } from "../chessClusterMemoryGraphV0.js";
import { resolveChessClusterAgentPolicyV0 } from "../chessClusterAgentPolicyV0.js";

describe("chessClusterObserverV0", () => {
  beforeEach(() => {
    __resetChessClusterObserverForTestV0();
    __resetChessClusterMemoryGraphForTestV0();
  });

  it("observes move and writes spatial-independent memory node", () => {
    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    const slot = {
      slotId: 2,
      matchId: "test_match",
      game,
      ply: 1,
      attentionWeight: 1,
      moveHistory: [],
      criticalEvents: []
    };
    game.tryMove("e4");
    const moveRow = {
      slotId: 2,
      matchId: "test_match",
      ply: 1,
      san: "e4",
      fenBefore: "start",
      agentId: "fox_agent"
    };
    const obs = observeChessClusterMoveV0(slot, moveRow, resolveChessClusterAgentPolicyV0("fox_agent"));
    expect(obs.slotId).toBe(2);
    expect(obs.spatialBound).toBeUndefined();
    expect(listChessClusterMemoryNodesV0().length).toBe(1);
    expect(getChessClusterPatternCountsV0().length).toBeGreaterThanOrEqual(0);
  });
});
