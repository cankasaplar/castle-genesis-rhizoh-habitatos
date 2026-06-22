import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearMatchmakingTruthForTestV0,
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthLogV0,
  getMatchmakingTruthProductionStatusV0,
  MATCH_TRUTH_EVENT_V0,
  reduceMatchmakingTruthV0,
  replayMatchmakingTruthV0,
  runMatchmakingTruthProductionVerifyV0,
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

  it("verifyProduction proves deterministic replay", () => {
    const out = runMatchmakingTruthProductionVerifyV0({ reset: true });
    expect(out.ok).toBe(true);
    expect(getMatchmakingTruthLogV0().appendOnly).toBe(true);
    expect(replayMatchmakingTruthV0().activeSession?.committed?.moveCount).toBe(1);
  });

  it("productionStatus reports observation before any dispatch", () => {
    const status = getMatchmakingTruthProductionStatusV0();
    expect(status.mode).toBe("observation");
    expect(status.logCount).toBe(0);
    expect(status.hasCommittedMove).toBe(false);
    expect(status.awake).toBe(true);
  });
});
