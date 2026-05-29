import { describe, it, expect, vi } from "vitest";
import { computeNavInvalidationMaskV0, parseObstacleDiscsFromDeltaV0 } from "../obstacleNavInvalidationV0.js";
import { normalizeGltfSceneNodesV0, applySceneGraphCacheUpdateV0 } from "../sceneGraphStreamV0.js";
import {
  executeRosPolicyOnWalDiffV0,
  grantRosAuthorityLeaseV0,
  hasActiveRosLeaseV0
} from "../realityOperatingSystemExecutionRuntimeV0.js";
import { stagePendingObstacleAuthorityV0 } from "../postSealSimulationBridgeV0.js";
import { WAL_WORLD_DIFF_KIND_V0 } from "../submitWorldAuthoritySealCandidateV0.js";
import { ingestObstacleStreamFrameOnKernelV0 } from "../worldAuthorityStreamIngressV0.js";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";

describe("Sprint B world authority", () => {
  it("computes nav invalidation mask on obstacle change", () => {
    const prev = [{ x: 0, z: 0, r: 1 }];
    const next = [{ x: 5, z: 5, r: 1 }];
    const mask = computeNavInvalidationMaskV0(prev, next);
    expect(mask.length).toBeGreaterThan(0);
  });

  it("normalizes glTF node array", () => {
    const nodes = normalizeGltfSceneNodesV0([{ name: "wall_a", meshUid: "m1" }]);
    expect(nodes[0].nodeUid).toBe("wall_a");
  });

  it("ROS execution grants lease and allows sealing proposal", () => {
    grantRosAuthorityLeaseV0("room:test", "holder1");
    const r = executeRosPolicyOnWalDiffV0({
      diffId: "d1",
      kind: WAL_WORLD_DIFF_KIND_V0.OBSTACLE_DELTA,
      roomScope: "room:test",
      signed: true,
      payload: { discs: [{ x: 1, z: 1, r: 1 }] }
    });
    expect(r.allow).toBe(true);
    expect(hasActiveRosLeaseV0("room:test")).toBe(true);
  });

  it("stages pending obstacle authority pre-seal", () => {
    const war = stagePendingObstacleAuthorityV0(
      { sceneGraphByRoomUid: {}, pendingObstaclesByRoomUid: {}, sealedObstacleByRoomUid: {} },
      "room:hall",
      { discs: [{ x: 0, z: 0, r: 2 }], invalidationCellKeys: [1, 2, 3] }
    );
    expect(war.pendingObstaclesByRoomUid["room:hall"].discs).toHaveLength(1);
  });

  it("obstacle stream ingress binds nav invalidation without wal epoch write", () => {
    const { getState, setState } = (() => {
      let state = createInitialStudioKernelState();
      return {
        getState: () => state,
        setState: (n) => {
          state = n;
        }
      };
    })();
    grantRosAuthorityLeaseV0("room:hall", "test");
    const r = ingestObstacleStreamFrameOnKernelV0(getState, setState, {
      frameId: "ob-sprint-b",
      roomScope: "room:hall",
      delta: { discs: parseObstacleDiscsFromDeltaV0({ discs: [{ x: 2, z: 3, r: 1.2 }] }) },
      signed: true
    }, { forceDrain: true });
    expect(r.ok).toBe(true);
    expect(r.geometryAuthority.walWroteEpochDirectly).toBe(false);
    expect(r.navInvalidation).toBeTruthy();
    const war = getState().worldAuthorityRuntime;
    expect(
      war.sealedObstacleByRoomUid["room:hall"] || war.pendingObstaclesByRoomUid["room:hall"]
    ).toBeTruthy();
  });

  it("scene graph cache revision increments", () => {
    const war = applySceneGraphCacheUpdateV0(
      { sceneGraphByRoomUid: {}, pendingObstaclesByRoomUid: {}, sealedObstacleByRoomUid: {} },
      "room:a",
      normalizeGltfSceneNodesV0([{ name: "n1" }])
    );
    expect(war.sceneGraphByRoomUid["room:a"].revision).toBe(1);
  });
});
