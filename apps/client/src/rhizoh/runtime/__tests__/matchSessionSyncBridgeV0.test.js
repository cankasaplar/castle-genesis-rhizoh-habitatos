import { describe, it, expect, beforeEach } from "vitest";
import {
  clearMatchmakingTruthForTestV0,
  dispatchMatchmakingTruthEventV0,
  MATCH_TRUTH_EVENT_V0
} from "../matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "../matchSessionStateMachineV0.js";
import {
  getMatchRealityStatusV0,
  resetMatchSessionSyncBridgeForTestV0
} from "../matchSessionSyncBridgeV0.js";
import { resetMatchGatewayWsForTestV0 } from "../matchmakingGatewayWsV0.js";

describe("matchSessionSyncBridgeV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
    resetMatchSessionSyncBridgeForTestV0();
    resetMatchGatewayWsForTestV0();
  });

  it("realityStatus exposes fen from active session when sync inactive", () => {
    dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: {
        sessionId: "test_room_1",
        initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE
      }
    });
    const status = getMatchRealityStatusV0();
    expect(status.sessionId).toBe("test_room_1");
    expect(status.fen).toContain("rnbqkbnr");
    expect(status.activeSession?.committed?.fen).toContain("rnbqkbnr");
    expect(status.syncActive).toBe(false);
  });
});
