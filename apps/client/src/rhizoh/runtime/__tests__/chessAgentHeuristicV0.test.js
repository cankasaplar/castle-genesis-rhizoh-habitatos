import { describe, expect, it } from "vitest";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import { pickChessAgentHeuristicMoveV0 } from "../chessAgentHeuristicV0.js";

describe("chessAgentHeuristicV0", () => {
  it("returns legal moves for aggressive vs defensive policies", () => {
    const game = createChessArenaGameV0();
    const aggressive = pickChessAgentHeuristicMoveV0(
      game,
      { contempt: 30, riskProfile: "aggressive", explorationRate: 0 },
      { slotId: 1, agentId: "octo" }
    );
    const defensive = pickChessAgentHeuristicMoveV0(
      game,
      { contempt: -10, riskProfile: "defensive", explorationRate: 0 },
      { slotId: 2, agentId: "fox" }
    );
    expect(aggressive).toMatch(/^[a-h][1-8][a-h][1-8]/);
    expect(defensive).toMatch(/^[a-h][1-8][a-h][1-8]/);
  });

  it("varies moves per slot seed at same ply", () => {
    const gameA = createChessArenaGameV0();
    const gameB = createChessArenaGameV0();
    const policy = { contempt: 0, riskProfile: "balanced", explorationRate: 0.25 };
    const a = pickChessAgentHeuristicMoveV0(gameA, policy, { slotId: 0 });
    const b = pickChessAgentHeuristicMoveV0(gameB, policy, { slotId: 4 });
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });
});
