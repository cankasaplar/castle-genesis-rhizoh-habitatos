import { beforeEach, describe, expect, it } from "vitest";
import {
  getChessEngineContentionSnapshotV0,
  isChessArenaWorkspaceOpenV0,
  isChessClusterArenaOpenV0,
  publishChessArenaWorkspaceOpenV0,
  publishChessClusterArenaOpenV0,
  resolveChessMoveTimeoutBufferMsV0,
  shouldDeferArenaEngineWorkV0,
  shouldDeferArenaPrewarmV0,
  shouldDeferMapChessArenaOpenV0,
  shouldPauseClusterTickForArenaV0
} from "../chessEngineContentionGateV0.js";
import { CHESS_ENGINE_TASK_KIND_V0 } from "../chessEngineTaskQueueV0.js";

describe("chessEngineContentionGateV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
  });

  it("shouldDeferArenaPrewarmV0 when cluster running and lock held", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessScheduler = { chessLock: true };
    expect(shouldDeferArenaPrewarmV0()).toBe(true);
    expect(shouldDeferArenaEngineWorkV0()).toBe(false);
  });

  it("allows map chess arena while cluster runs in background", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessScheduler = { chessLock: true };
    publishChessClusterArenaOpenV0(false);
    expect(shouldDeferMapChessArenaOpenV0()).toBe(false);
  });

  it("shouldDeferMapChessArenaOpenV0 when cluster arena modal is open", () => {
    publishChessClusterArenaOpenV0(true);
    expect(isChessClusterArenaOpenV0()).toBe(true);
    expect(shouldDeferMapChessArenaOpenV0()).toBe(true);
    publishChessClusterArenaOpenV0(false);
    expect(isChessClusterArenaOpenV0()).toBe(false);
  });

  it("shouldDeferArenaEngineWorkV0 when cluster arena open even without lock", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    publishChessClusterArenaOpenV0(true);
    expect(shouldDeferArenaEngineWorkV0()).toBe(true);
  });

  it("shouldDeferArenaEngineWorkV0 false when map arena workspace is playing", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    publishChessClusterArenaOpenV0(true);
    publishChessArenaWorkspaceOpenV0(true);
    expect(shouldDeferArenaEngineWorkV0()).toBe(false);
    publishChessArenaWorkspaceOpenV0(false);
  });

  it("resolveChessMoveTimeoutBufferMsV0 gives cluster moves more wall time", () => {
    const cluster = resolveChessMoveTimeoutBufferMsV0({
      queueKind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE
    });
    const prewarm = resolveChessMoveTimeoutBufferMsV0({
      queueKind: CHESS_ENGINE_TASK_KIND_V0.PREWARM
    });
    expect(cluster).toBeGreaterThan(prewarm);
    expect(cluster).toBeGreaterThanOrEqual(2800);
  });

  it("resolveChessMoveTimeoutBufferMsV0 gives arena moves extra time when cluster runs", () => {
    const idle = resolveChessMoveTimeoutBufferMsV0({
      queueKind: CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE
    });
    window.__rhizoh.chessGameCluster = { running: true };
    const arena = resolveChessMoveTimeoutBufferMsV0({
      queueKind: CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE
    });
    delete window.__rhizoh.chessGameCluster;
    expect(arena).toBeGreaterThan(idle);
    expect(arena).toBeGreaterThanOrEqual(5200);
    expect(idle).toBeGreaterThanOrEqual(3200);
  });

  it("getChessEngineContentionSnapshotV0 reports contended state", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessEngineQueue = { pendingCount: 3 };
    const snap = getChessEngineContentionSnapshotV0();
    expect(snap.contended).toBe(true);
  });

  it("shouldPauseClusterTickForArenaV0 when map arena workspace is open", () => {
    publishChessArenaWorkspaceOpenV0(true);
    expect(isChessArenaWorkspaceOpenV0()).toBe(true);
    expect(shouldPauseClusterTickForArenaV0()).toBe(true);
    publishChessArenaWorkspaceOpenV0(false);
    expect(shouldPauseClusterTickForArenaV0()).toBe(false);
  });

  it("pauses cluster ticks when map arena workspace is open (even if broadcast UI was open)", () => {
    publishChessArenaWorkspaceOpenV0(true);
    publishChessClusterArenaOpenV0(true);
    expect(shouldPauseClusterTickForArenaV0()).toBe(true);
    publishChessArenaWorkspaceOpenV0(false);
    publishChessClusterArenaOpenV0(false);
  });

  it("getChessEngineContentionSnapshotV0 includes arenaWorkspaceOpen", () => {
    publishChessArenaWorkspaceOpenV0(true);
    const snap = getChessEngineContentionSnapshotV0();
    expect(snap.arenaWorkspaceOpen).toBe(true);
    expect(isChessClusterArenaOpenV0()).toBe(false);
    publishChessArenaWorkspaceOpenV0(false);
  });
});
