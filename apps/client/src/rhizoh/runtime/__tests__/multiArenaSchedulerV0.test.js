import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARENA_ARBITRATION_REASON_V0,
  ARENA_EXECUTION_MODE_V0,
  ARENA_SPACE_OVERLAY_V0,
  MULTI_ARENA_TICK_EVENT_V0,
  gameTypeToSpaceIdV0,
  isSpaceExecutionGrantedV0,
  listArenaFramesV0,
  notifySportsArenaActivityV0,
  resetMultiArenaSchedulerForTestV0,
  resolveSchedulerRouteForGameTypeV0,
  runMultiArenaTickV0,
  selectActiveArenaFrameV0
} from "../multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "../sportsCausalSpaceV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "../rhizohUglSchemaV0.js";

vi.mock("../chessEngineContentionGateV0.js", () => ({
  getChessEngineContentionSnapshotV0: vi.fn(() => ({
    contended: false,
    arenaWorkspaceOpen: false,
    chessLock: false
  })),
  isChessArenaWorkspaceOpenV0: vi.fn(() => false)
}));

import {
  getChessEngineContentionSnapshotV0,
  isChessArenaWorkspaceOpenV0
} from "../chessEngineContentionGateV0.js";

describe("multiArenaSchedulerV0", () => {
  beforeEach(() => {
    resetMultiArenaSchedulerForTestV0();
    vi.mocked(isChessArenaWorkspaceOpenV0).mockReturnValue(false);
    vi.mocked(getChessEngineContentionSnapshotV0).mockReturnValue({
      contended: false,
      arenaWorkspaceOpen: false,
      chessLock: false
    });
  });

  it("registers chess baseline, sports burst, and CUX overlay frames", () => {
    const frames = listArenaFramesV0();
    expect(frames.map((f) => f.spaceId)).toEqual(
      expect.arrayContaining([
        CAUSAL_SPACE_ID_V0.CHESS,
        CAUSAL_SPACE_ID_V0.SPORTS,
        ARENA_SPACE_OVERLAY_V0
      ])
    );
    const chess = frames.find((f) => f.spaceId === CAUSAL_SPACE_ID_V0.CHESS);
    expect(chess?.executionMode).toBe(ARENA_EXECUTION_MODE_V0.BASELINE_ALWAYS);
    expect(chess?.resourceQuota).toBeGreaterThan(0.5);
  });

  it("defaults primary reality to chess baseline", () => {
    const selection = selectActiveArenaFrameV0();
    expect(selection.primarySpaceId).toBe(CAUSAL_SPACE_ID_V0.CHESS);
    expect(selection.arbitrationReason).toBe(ARENA_ARBITRATION_REASON_V0.CHESS_BASELINE_DEFAULT);
    expect(isSpaceExecutionGrantedV0(CAUSAL_SPACE_ID_V0.CHESS)).toBe(true);
    expect(isSpaceExecutionGrantedV0(CAUSAL_SPACE_ID_V0.SPORTS)).toBe(false);
  });

  it("grants sports execution during burst window after activity", () => {
    notifySportsArenaActivityV0({ reason: "score_delta" });
    const selection = selectActiveArenaFrameV0();
    expect(selection.primarySpaceId).toBe(CAUSAL_SPACE_ID_V0.SPORTS);
    expect(selection.arbitrationReason).toBe(ARENA_ARBITRATION_REASON_V0.SPORTS_BURST_WINDOW);
    expect(isSpaceExecutionGrantedV0(CAUSAL_SPACE_ID_V0.SPORTS)).toBe(true);
  });

  it("reasserts chess primary when arena workspace is open", () => {
    notifySportsArenaActivityV0({ reason: "momentum_shift" });
    vi.mocked(isChessArenaWorkspaceOpenV0).mockReturnValue(true);
    const selection = selectActiveArenaFrameV0();
    expect(selection.primarySpaceId).toBe(CAUSAL_SPACE_ID_V0.CHESS);
    expect(selection.arbitrationReason).toBe(ARENA_ARBITRATION_REASON_V0.CHESS_ARENA_WORKSPACE_OPEN);
  });

  it("maps game types to causal spaces", () => {
    expect(gameTypeToSpaceIdV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS)).toBe(CAUSAL_SPACE_ID_V0.CHESS);
    expect(gameTypeToSpaceIdV0(RHIZOH_UGL_GAME_TYPE_V0.SPORTS)).toBe(CAUSAL_SPACE_ID_V0.SPORTS);
  });

  it("resolveSchedulerRouteForGameTypeV0 denies sports outside burst", () => {
    const route = resolveSchedulerRouteForGameTypeV0(RHIZOH_UGL_GAME_TYPE_V0.SPORTS);
    expect(route.spaceId).toBe(CAUSAL_SPACE_ID_V0.SPORTS);
    expect(route.executionGranted).toBe(false);
    expect(route.isPrimary).toBe(false);
  });

  it("runMultiArenaTickV0 dispatches tick event", () => {
    const handler = vi.fn();
    window.addEventListener(MULTI_ARENA_TICK_EVENT_V0, handler);
    const tick = runMultiArenaTickV0({ atMs: 1_700_000_000_000 });
    expect(tick.tickId).toBe(1);
    expect(tick.selection.primarySpaceId).toBe(CAUSAL_SPACE_ID_V0.CHESS);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(MULTI_ARENA_TICK_EVENT_V0, handler);
  });
});
