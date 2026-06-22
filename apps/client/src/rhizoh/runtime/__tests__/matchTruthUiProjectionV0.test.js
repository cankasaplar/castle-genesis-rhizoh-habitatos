import { describe, it, expect, beforeEach } from "vitest";
import { projectMatchTruthToUiV0 } from "../matchTruthUiProjectionV0.js";
import { clearMatchmakingTruthForTestV0, dispatchMatchmakingTruthEventV0, MATCH_TRUTH_EVENT_V0 } from "../matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "../matchSessionStateMachineV0.js";
import { simulateGatewayMatchMoveAckV0 } from "../matchmakingGatewayCommitBridgeV0.js";

describe("matchTruthUiProjectionV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
  });

  it("projects committed fen after gateway ack", () => {
    dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE, players: [{ userId: "p1", color: "white" }] }
    });
    const sessionId = projectMatchTruthToUiV0().sessionId;
    simulateGatewayMatchMoveAckV0({
      sessionId,
      san: "e4",
      playerId: "p1",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      serverSeq: 1
    });
    const p = projectMatchTruthToUiV0();
    expect(p.ok).toBe(true);
    expect(p.fen).toContain("4P3");
    expect(p.serverSeq).toBe(1);
  });
});
