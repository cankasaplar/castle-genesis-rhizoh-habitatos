import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUARD_DENY_REASON_V0,
  assessCrossSpaceResourceLoadV0,
  guardFusionAdmissionV0,
  resetCrossSpaceResourceGuardForTestV0,
  scoreFusionReliabilityV0
} from "../crossSpaceResourceContentionGuardV0.js";

vi.mock("../chessEngineContentionGateV0.js", () => ({
  getChessEngineContentionSnapshotV0: vi.fn(() => ({
    contended: false,
    arenaWorkspaceOpen: false,
    chessLock: false,
    queuePending: 0
  })),
  isChessArenaWorkspaceOpenV0: vi.fn(() => false),
  prioritizeArenaEngineForMoveV0: vi.fn(() => true)
}));

vi.mock("../multiArenaSchedulerV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    selectActiveArenaFrameV0: vi.fn(() => ({
      primarySpaceId: "chess.causal.space",
      sportsBurstActive: false,
      arbitrationReason: "chess_baseline_default"
    }))
  };
});

import { getChessEngineContentionSnapshotV0 } from "../chessEngineContentionGateV0.js";

describe("crossSpaceResourceContentionGuardV0", () => {
  beforeEach(() => {
    resetCrossSpaceResourceGuardForTestV0();
    vi.mocked(getChessEngineContentionSnapshotV0).mockReturnValue({
      contended: false,
      arenaWorkspaceOpen: false,
      chessLock: false,
      queuePending: 0
    });
  });

  it("assesses resource load", () => {
    const load = assessCrossSpaceResourceLoadV0();
    expect(load.totalLoad01).toBeGreaterThanOrEqual(0);
    expect(load.overload).toBe(false);
  });

  it("admits fusion when load is healthy", () => {
    const verdict = guardFusionAdmissionV0();
    expect(verdict.admitted).toBe(true);
    expect(verdict.separabilityRequired).toBe(true);
  });

  it("defers fusion on epistemic overload", () => {
    vi.mocked(getChessEngineContentionSnapshotV0).mockReturnValue({
      contended: true,
      arenaWorkspaceOpen: true,
      chessLock: true,
      queuePending: 8
    });
    const verdict = guardFusionAdmissionV0();
    expect(verdict.admitted).toBe(false);
    expect(verdict.reason).toBe(GUARD_DENY_REASON_V0.EPISTEMIC_OVERLOAD);
  });

  it("scores fusion reliability with separability flag", () => {
    const reliability = scoreFusionReliabilityV0({
      epistemicUpdate: { confidence01: 0.6 },
      laneAudit: { separabilityPreserved: true, chess: { present: true } },
      guard: { admitted: true, load: { overload: false } }
    });
    expect(reliability.separabilityPreserved).toBe(true);
    expect(reliability.reliability01).toBeGreaterThan(0);
  });
});
