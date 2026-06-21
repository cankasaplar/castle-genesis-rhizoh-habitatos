import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMatchCommitLogForTestV0,
  computeMatchDriftScoreV0,
  getMatchCommitLogV0,
  getMatchKernelStatusV0,
  isLegalKernelTransitionV0,
  MATCH_EVENT_TYPE_V0,
  MATCH_KERNEL_STATE_V0,
  processKernelProposeMoveV0,
  processKernelReconcileV0
} from "../matchAuthorityKernelV0.js";
import { validateMatchMoveV0 } from "../matchStockfishValidatorBridgeV0.js";
import {
  clearMatchSessionForTestV0,
  createMatchSessionV0,
  MATCH_SESSION_STATE_V0
} from "../matchSessionLifecycleV0.js";

describe("matchAuthorityKernelV0", () => {
  beforeEach(() => {
    clearMatchSessionForTestV0();
    clearMatchCommitLogForTestV0();
  });

  it("enforces kernel state machine transitions", () => {
    expect(isLegalKernelTransitionV0(MATCH_KERNEL_STATE_V0.ACTIVE, MATCH_KERNEL_STATE_V0.PENDING_MOVE)).toBe(true);
    expect(isLegalKernelTransitionV0(MATCH_KERNEL_STATE_V0.PENDING_MOVE, MATCH_KERNEL_STATE_V0.COMMITTING)).toBe(true);
    expect(isLegalKernelTransitionV0(MATCH_KERNEL_STATE_V0.ACTIVE, MATCH_KERNEL_STATE_V0.COMMITTING)).toBe(false);
  });

  it("validates illegal moves via chess.js bridge", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const bad = processKernelProposeMoveV0(session, { san: "Qxd9", playerId: "user_a" });
    expect(bad.ok).toBe(false);
    expect(bad.rejected).toBe(true);

    const log = getMatchCommitLogV0(session.sessionId);
    expect(log.entries.some((e) => e.type === MATCH_EVENT_TYPE_V0.REJECT_MOVE)).toBe(true);
  });

  it("runs propose → validate → commit through append-only log", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const out = processKernelProposeMoveV0(session, { san: "e4", playerId: "user_a" });

    expect(out.ok).toBe(true);
    expect(out.committed).toBe(true);
    expect(out.kernelState).toBe(MATCH_KERNEL_STATE_V0.ACTIVE);
    expect(out.session.committed.moveCount).toBe(1);
    expect(out.session.shadow.moveCount).toBe(1);
    expect(out.broadcastDiff?.seq).toBe(1);

    const log = getMatchCommitLogV0(session.sessionId);
    expect(log.entries.some((e) => e.type === MATCH_EVENT_TYPE_V0.PROPOSE_MOVE)).toBe(true);
    expect(log.entries.some((e) => e.type === MATCH_EVENT_TYPE_V0.COMMIT_MOVE)).toBe(true);
  });

  it("computes drift score when lanes diverge", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const proposed = processKernelProposeMoveV0(session, { san: "e4", playerId: "user_a", autoCommitShadow: false });
    const drift = computeMatchDriftScoreV0(proposed.session);
    expect(drift.driftScore).toBeGreaterThan(0);
    expect(["pattern", "conflict", "fork"]).toContain(drift.classification);
  });

  it("reconciles toward server state", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const reconciled = processKernelReconcileV0(session, {
      serverState: {
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        turn: "black",
        moveCount: 1,
        serverSeq: 1
      }
    });
    expect(reconciled.ok).toBe(true);
    expect(getMatchKernelStatusV0(reconciled.session).kernel?.state || reconciled.kernelState).toBe(
      MATCH_KERNEL_STATE_V0.ACTIVE
    );
  });

  it("validator returns fen on legal move", () => {
    const v = validateMatchMoveV0({
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      san: "e4",
      expectedTurn: "white"
    });
    expect(v.ok).toBe(true);
    expect(v.fen).toContain("4P3");
  });
});
