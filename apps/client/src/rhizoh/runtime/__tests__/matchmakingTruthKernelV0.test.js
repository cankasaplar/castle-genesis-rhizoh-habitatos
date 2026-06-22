import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearMatchmakingTruthForTestV0,
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthLogV0,
  MATCH_TRUTH_EVENT_V0,
  reduceMatchmakingTruthV0,
  replayMatchmakingTruthV0,
  INITIAL_MATCH_TRUTH_STATE_V0
} from "../matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "../matchSessionStateMachineV0.js";
import { clearMatchCommitLogForTestV0 } from "../matchAuthorityKernelV0.js";

describe("matchmakingTruthKernelV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
    clearMatchCommitLogForTestV0();
  });

  it("reduces session create without I/O", () => {
    const next = reduceMatchmakingTruthV0(INITIAL_MATCH_TRUTH_STATE_V0, {
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE },
      seq: 1
    });
    expect(next.activeSession?.state).toBe(MATCH_SESSION_STATE_V0.SESSION_ACTIVE);
    expect(next.truthModel).toBe("event_sourced_reducer_v0");
  });

  it("dispatch appends to truth log and rebuilds projection", () => {
    const out = dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE }
    });
    expect(out.ok).toBe(true);
    expect(out.session?.sessionId).toBeTruthy();
    const log = getMatchmakingTruthLogV0();
    expect(log.count).toBe(1);
    expect(log.appendOnly).toBe(true);
  });

  it("replay is deterministic from append-only log", () => {
    dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE }
    });
    vi.spyOn(console, "info").mockImplementation(() => {});
    dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
      payload: { san: "e4", playerId: "user_a" }
    });
    const replayed = replayMatchmakingTruthV0();
    expect(replayed.activeSession?.committed?.moveCount).toBe(1);
    expect(replayed.logSeq).toBeGreaterThan(0);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[MATCH_TRUTH_CHAIN] MATCH_EVENT_COMMITTED")
    );
  });
});
