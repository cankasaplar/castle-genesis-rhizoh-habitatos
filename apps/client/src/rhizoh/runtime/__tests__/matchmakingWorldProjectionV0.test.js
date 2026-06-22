import { describe, expect, it, beforeEach } from "vitest";
import { clearMatchmakingTruthForTestV0 } from "../matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "../matchSessionStateMachineV0.js";
import { dispatchMatchmakingTruthEventV0, MATCH_TRUTH_EVENT_V0 } from "../matchmakingTruthKernelV0.js";
import { applyRemoteMatchWorldStateV0 } from "../matchmakingWorldProjectionV0.js";

describe("matchmakingWorldProjectionV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
  });

  it("projects remote MATCH_STATE when serverSeq advances", () => {
    const created = dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE }
    });
    const sessionId = created.session.sessionId;
    const out = applyRemoteMatchWorldStateV0({
      sessionId,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      serverSeq: 1,
      lastSan: "e4",
      playerId: "remote"
    });
    expect(out.ok).toBe(true);
    expect(out.projection.activeSession?.committed?.moveCount).toBe(1);
  });

  it("skips duplicate serverSeq projection", () => {
    const created = dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE }
    });
    const sessionId = created.session.sessionId;
    applyRemoteMatchWorldStateV0({
      sessionId,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      serverSeq: 1,
      lastSan: "e4"
    });
    const again = applyRemoteMatchWorldStateV0({
      sessionId,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      serverSeq: 1,
      lastSan: "e4"
    });
    expect(again.skipped).toBe(true);
  });

  it("reconciles join snapshot without san when serverSeq advances", () => {
    const created = dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE }
    });
    const sessionId = created.session.sessionId;
    const out = applyRemoteMatchWorldStateV0({
      sessionId,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black",
      moveCount: 1,
      serverSeq: 1,
      snapshot: true
    });
    expect(out.ok).toBe(true);
    expect(out.reconciled).toBe(true);
    expect(out.projection.activeSession?.committed?.serverSeq).toBe(1);
  });
});
