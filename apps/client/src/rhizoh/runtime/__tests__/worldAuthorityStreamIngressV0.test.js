import { describe, it, expect } from "vitest";
import {
  WAL_STREAM_GEOMETRY_AUTHORITY_CONTRACT_V0,
  WAL_STREAM_FRAME_KIND_V0,
  mapStreamFrameToWalDiffV0,
  ingestObstacleStreamFrameOnKernelV0,
  ingestSceneGraphDiffFrameOnKernelV0,
  ingestTopologyPatchFrameOnKernelV0
} from "../worldAuthorityStreamIngressV0.js";
import { WAL_WORLD_DIFF_KIND_V0 } from "../submitWorldAuthoritySealCandidateV0.js";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";

describe("worldAuthorityStreamIngressV0", () => {
  function mockKernel() {
    let state = createInitialStudioKernelState();
    return {
      getState: () => state,
      setState: (next) => {
        state = next;
      }
    };
  }

  it("states geometry authority contract", () => {
    expect(WAL_STREAM_GEOMETRY_AUTHORITY_CONTRACT_V0).toContain("schedule");
  });

  it("maps obstacle stream to obstacle_delta wal diff", () => {
    const m = mapStreamFrameToWalDiffV0({
      streamKind: WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM,
      frame: { frameId: "o1", roomScope: "room:a", delta: { add: [] } }
    });
    expect(m.ok).toBe(true);
    expect(m.walDiff.kind).toBe(WAL_WORLD_DIFF_KIND_V0.OBSTACLE_DELTA);
  });

  it("maps scene diff to scene_chunk (high-rate, no direct epoch)", () => {
    const { getState, setState } = mockKernel();
    const epoch0 = getState().realitySeal.realityEpoch;
    const r = ingestSceneGraphDiffFrameOnKernelV0(getState, setState, {
      frameId: "s1",
      roomScope: "room:a",
      chunk: { nodes: [] }
    });
    expect(r.ok).toBe(true);
    expect(r.geometryAuthority.walWroteEpochDirectly).toBe(false);
    expect(r.geometryAuthority.epochDeltaFromWal).toBe(0);
    if (!r.scheduleInfluence.drained) {
      expect(getState().realitySeal.realityEpoch).toBe(epoch0);
    }
  });

  it("ingests topology patch via kernel entry only", () => {
    const { getState, setState } = mockKernel();
    const r = ingestTopologyPatchFrameOnKernelV0(getState, setState, {
      frameId: "t1",
      roomScope: "room:main",
      patch: { regionUid: "r1" }
    });
    expect(r.ok).toBe(true);
    expect(r.geometryAuthority.walWroteEpochDirectly).toBe(false);
    expect(r.scheduleInfluence).toBeDefined();
  });

  it("ingests obstacle stream without wal epoch write", () => {
    const { getState, setState } = mockKernel();
    const before = getState().realitySeal.realityEpoch;
    const r = ingestObstacleStreamFrameOnKernelV0(getState, setState, {
      frameId: "ob1",
      roomScope: "room:hall",
      delta: { discs: [{ x: 0, z: 0, r: 1 }] }
    });
    expect(r.ok).toBe(true);
    expect(r.geometryAuthority.epochBefore).toBe(before);
    expect(r.geometryAuthority.walWroteEpochDirectly).toBe(false);
  });
});
