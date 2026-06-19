import { describe, expect, it, beforeEach } from "vitest";
import {
  CHESS_ENGINE_TASK_PRIORITY_V0,
  CHESS_ENGINE_TASK_KIND_V0,
  __resetChessEngineTaskQueueForTestV0,
  cancelPendingClusterEngineTasksV0,
  enqueueChessEngineTaskV0,
  getChessEngineQueueSnapshotV0
} from "../chessEngineTaskQueueV0.js";
import {
  __resetChessClusterEngineSchedulerForTestV0,
  getChessClusterEngineSchedulerSnapshotV0
} from "../chessClusterEngineSchedulerV0.js";
import { withChessStockfishEngineLockV0 } from "../chessStockfishEngineV0.js";

describe("chessEngineTaskQueueV0", () => {
  beforeEach(() => {
    __resetChessEngineTaskQueueForTestV0();
  });

  it("runs higher-priority tasks before lower-priority FIFO backlog", async () => {
    const order = [];
    let releaseCluster = null;

    const clusterSlow = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: "cluster_move",
      label: "cluster_slow",
      run: async () => {
        order.push("cluster_start");
        await new Promise((resolve) => {
          releaseCluster = resolve;
        });
        order.push("cluster_end");
      }
    });

    await Promise.resolve();

    const clusterQueued = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: "cluster_move",
      label: "cluster_queued",
      run: async () => {
        order.push("cluster_queued");
      }
    });

    const arenaQueued = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.ARENA_MATCH,
      kind: "arena_move",
      label: "arena_queued",
      run: async () => {
        order.push("arena");
      }
    });

    releaseCluster?.();
    await Promise.all([clusterSlow, clusterQueued, arenaQueued]);

    expect(order).toEqual(["cluster_start", "cluster_end", "arena", "cluster_queued"]);
  });

  it("supersedes pending cluster moves with latest-only flatten", async () => {
    let releaseActive = null;
    const active = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
      label: "cluster_active",
      run: async () => {
        await new Promise((resolve) => {
          releaseActive = resolve;
        });
        return "active";
      }
    });
    await Promise.resolve();

    const superseded = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
      label: "cluster_old_pending",
      run: async () => "old_pending"
    });

    const latest = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
      label: "cluster_latest",
      run: async () => "latest"
    });

    releaseActive?.();
    const [activeResult, supersededResult, latestResult] = await Promise.all([
      active,
      superseded,
      latest
    ]);
    expect(activeResult).toBe("active");
    expect(supersededResult).toBe(null);
    expect(latestResult).toBe("latest");
    expect(getChessEngineQueueSnapshotV0().clusterSupersededCount).toBeGreaterThanOrEqual(1);
  });

  it("preempts lower-priority active search when arena task is enqueued", async () => {
    let preempted = false;
    const clusterDone = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: "cluster_move",
      label: "cluster_preempt",
      onPreempt: () => {
        preempted = true;
      },
      run: async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        return preempted ? null : "cluster_move";
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    const arenaDone = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.ARENA_MATCH,
      kind: "arena_move",
      label: "arena_preempt",
      run: async () => "arena_move"
    });

    const [clusterResult, arenaResult] = await Promise.all([clusterDone, arenaDone]);
    expect(preempted).toBe(true);
    expect(arenaResult).toBe("arena_move");
    expect(getChessEngineQueueSnapshotV0().preemptCount).toBeGreaterThanOrEqual(1);
    expect(clusterResult === null || clusterResult === "cluster_move").toBe(true);
  });

  it("exposes window registry snapshot", async () => {
    await enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.BACKGROUND,
      kind: "prewarm",
      label: "prewarm",
      run: async () => "ok"
    });
    expect(typeof window).toBe("object");
    expect(window.__rhizoh?.chessEngineQueue?.schema).toContain("chess_engine_task_queue");
  });
});

describe("chessClusterEngineSchedulerV0 queue snapshot", () => {
  beforeEach(() => {
    __resetChessEngineTaskQueueForTestV0();
    __resetChessClusterEngineSchedulerForTestV0();
  });

  it("includes engine queue fields in scheduler snapshot", () => {
    const snap = getChessClusterEngineSchedulerSnapshotV0();
    expect(snap.queuePending).toBe(0);
    expect(snap.queuePendingByPriority).toBeTruthy();
    expect(snap.preemptCount).toBe(0);
  });

  it("cancelPendingClusterEngineTasksV0 resolves queued cluster work", async () => {
    let release = null;
    const blocker = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
      label: "cluster_blocker",
      run: () =>
        new Promise((resolve) => {
          release = resolve;
        })
    });
    const pending = enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
      label: "cluster_cancel",
      run: async () => "cluster"
    });
    cancelPendingClusterEngineTasksV0();
    expect(await pending).toBe(null);
    release?.("done");
    await blocker;
    expect(getChessEngineQueueSnapshotV0().pendingByPriority.cluster).toBe(0);
  });
});

describe("withChessStockfishEngineLockV0 + queue", () => {
  beforeEach(() => {
    __resetChessEngineTaskQueueForTestV0();
  });

  it("allows nested acquire without deadlock", async () => {
    const out = await Promise.race([
      withChessStockfishEngineLockV0(() =>
        withChessStockfishEngineLockV0(async () => "nested_ok")
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error("deadlock")), 400))
    ]);
    expect(out).toBe("nested_ok");
  });
});
