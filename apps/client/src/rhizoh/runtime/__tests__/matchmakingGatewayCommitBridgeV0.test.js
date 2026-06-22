import { describe, it, expect, beforeEach } from "vitest";
import {
  applyGatewayMatchMoveAckV0,
  simulateGatewayMatchMoveAckV0
} from "../matchmakingGatewayCommitBridgeV0.js";
import {
  clearMatchmakingTruthForTestV0,
  dispatchMatchmakingTruthEventV0,
  MATCH_TRUTH_EVENT_V0
} from "../matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "../matchSessionStateMachineV0.js";
import { clearMatchCommitLogForTestV0 } from "../matchAuthorityKernelV0.js";

describe("matchmakingGatewayCommitBridgeV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
    clearMatchCommitLogForTestV0();
    dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { sessionId: "dup_test", initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE }
    });
  });

  it("skips duplicate serverSeq ack", () => {
    const first = simulateGatewayMatchMoveAckV0({
      sessionId: "dup_test",
      san: "e4",
      playerId: "a",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      serverSeq: 1
    });
    expect(first.ok).toBe(true);
    const dup = applyGatewayMatchMoveAckV0({
      sessionId: "dup_test",
      san: "e4",
      playerId: "a",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      serverSeq: 1
    });
    expect(dup.skipped).toBe(true);
    expect(dup.reason).toBe("duplicate_server_seq");
  });
});
