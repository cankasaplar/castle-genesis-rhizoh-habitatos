import { describe, it, expect, vi, beforeEach } from "vitest";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";
import {
  resetWorldRuntimeDaemonStateV0,
  enqueueWorldRuntimeStreamFrameV0,
  accumulateTopologyDiffV0,
  tickWorldRuntimeDaemonV0,
  reconcileSceneGraphRoomV0
} from "../worldRuntimeDaemonV0.js";
import { WAL_STREAM_FRAME_KIND_V0 } from "../worldAuthorityStreamIngressV0.js";
import { grantRosAuthorityLeaseV0 } from "../realityOperatingSystemExecutionRuntimeV0.js";

describe("worldRuntimeDaemonV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_WORLD_RUNTIME_DAEMON", "");
    resetWorldRuntimeDaemonStateV0();
  });

  it("drops frames when queue exceeds max depth", () => {
    for (let i = 0; i < 70; i++) {
      enqueueWorldRuntimeStreamFrameV0({
        streamKind: WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM,
        frame: { frameId: `ob:${i}`, roomScope: "room:test", delta: { discs: [] }, signed: true }
      });
    }
    const last = enqueueWorldRuntimeStreamFrameV0({
      streamKind: WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM,
      frame: { frameId: "ob:overflow", roomScope: "room:test", delta: { discs: [] }, signed: true }
    });
    expect(last.accepted).toBe(false);
    expect(last.code).toBe("BACKPRESSURE_DROP");
  });

  it("drains queued obstacle frames on tick with daemonBypass", () => {
    let state = createInitialStudioKernelState();
    const getState = () => state;
    const setState = (n) => {
      state = n;
    };
    grantRosAuthorityLeaseV0("room:hall", "daemon-test");
    enqueueWorldRuntimeStreamFrameV0({
      streamKind: WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM,
      frame: {
        frameId: "ob:daemon:1",
        roomScope: "room:hall",
        delta: { discs: [{ x: 2, z: 3, r: 1.1 }] },
        signed: true
      }
    });
    const tick = tickWorldRuntimeDaemonV0(getState, setState, { nowMs: Date.now() });
    expect(tick.processed).toBe(1);
    expect(tick.drained[0].ok).toBe(true);
    const war = getState().worldAuthorityRuntime;
    expect(
      war.pendingObstaclesByRoomUid["room:hall"] || war.sealedObstacleByRoomUid["room:hall"]
    ).toBeTruthy();
  });

  it("detects scene graph reconciliation drift", () => {
    const kernel = createInitialStudioKernelState();
    kernel.worldAuthorityRuntime.sceneGraphByRoomUid["room:a"] = {
      revision: 3,
      nodes: {},
      updatedAtMs: Date.now()
    };
    const r = reconcileSceneGraphRoomV0(kernel, "room:a", Date.now());
    expect(r.driftDetected).toBe(true);
    expect(r.cacheRevision).toBe(3);
  });

  it("accumulates topology patches per room", () => {
    const a = accumulateTopologyDiffV0("room:topo", { patchId: "p1", patch: { edge: "e1" } });
    const b = accumulateTopologyDiffV0("room:topo", { patchId: "p1", patch: { edge: "e1-dup" } });
    expect(a.ok).toBe(true);
    expect(b.duplicate).toBe(true);
  });
});
