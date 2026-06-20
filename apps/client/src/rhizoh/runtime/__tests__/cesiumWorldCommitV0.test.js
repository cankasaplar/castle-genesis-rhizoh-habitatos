import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPrismCubeMapPinRowV0,
  buildPrismCubeSpatialNodeV0,
  commitPrismCubeSpatialObjectToWorldV0,
  commitPrismCubesToWorldV0,
  getPrismCubeMapPinRowsV0,
  resetCesiumWorldCommitForTestV0,
} from "../cesiumWorldCommitV0.js";
import { ARENA_TYPE_V0 } from "../arenaBindingLayerV0.js";
import { __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { registerCesiumExecutorApiV0 } from "../../../castleFlight/cesiumCommandExecutorV0.js";

function makeCommittedCube(overrides = {}) {
  return {
    cubeId: "cube-1",
    entityId: "entity-1",
    arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
    spatialObject: {
      status: "committed",
      cubeId: "cube-1",
      entityId: "entity-1",
      slotId: "slot-1",
      arenaType: ARENA_TYPE_V0.CHESS,
      mapPinEligible: true,
      observerRelative: true,
      logicalPosition: { x: 1, y: 0, z: 0 },
      worldPosition: {
        lat: 41.04,
        lon: 29.01,
        alt: 120,
        observerRelative: true,
        observationOrigin: { source: "test_observer" },
      },
    },
    ...overrides,
  };
}

describe("cesiumWorldCommitV0", () => {
  beforeEach(() => {
    resetCesiumWorldCommitForTestV0();
    __resetSpatialNodeLayerForTestV0();
    vi.unstubAllGlobals();
  });

  it("buildPrismCubeSpatialNodeV0 creates static spatial node", () => {
    const node = buildPrismCubeSpatialNodeV0(makeCommittedCube());
    expect(node.id).toBe("prism-cube-cube-1");
    expect(node.payload.kind).toBe("prism_cube_spatial_object");
    expect(node.payload.lat).toBeCloseTo(41.04, 2);
    expect(node.payload.arenaType).toBe(ARENA_TYPE_V0.CHESS);
  });

  it("buildPrismCubeMapPinRowV0 creates map pin row", () => {
    const pin = buildPrismCubeMapPinRowV0(makeCommittedCube());
    expect(pin?.id).toBe("prism_cube:cube-1");
    expect(pin?.type).toBe("agent");
    expect(pin?.lat).toBeCloseTo(41.04, 2);
    expect(pin?.prismCube.arenaType).toBe(ARENA_TYPE_V0.CHESS);
  });

  it("commitPrismCubeSpatialObjectToWorldV0 commits through cesium sink", () => {
    const commits = [];
    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode(node, meta) {
        commits.push({ node, meta });
        return { ok: true, nodeId: node.id };
      },
    });
    globalThis.window = {
      __CASTLE_CESIUM__: { ready: true, commandReady: true },
      location: { pathname: "/world/space" },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const outcome = commitPrismCubeSpatialObjectToWorldV0(makeCommittedCube());
    expect(outcome.worldCommitted).toBe(true);
    expect(commits.length).toBe(1);
    expect(commits[0].node.id).toContain("prism-cube-cube-1");
  });

  it("commitPrismCubesToWorldV0 registers map pins for all eligible cubes", () => {
    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode: () => ({ ok: true }),
    });
    globalThis.window = {
      __CASTLE_CESIUM__: { ready: true, commandReady: true },
      location: { pathname: "/world/space" },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const result = commitPrismCubesToWorldV0({
      prismCubeCommit: {
        ok: true,
        commitHead: "commit-head",
        committedCubes: [
          makeCommittedCube({ cubeId: "cube-a", entityId: "entity-a" }),
          makeCommittedCube({
            cubeId: "cube-b",
            entityId: "entity-b",
            arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
            spatialObject: {
              ...makeCommittedCube().spatialObject,
              cubeId: "cube-b",
              entityId: "entity-b",
              arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC,
            },
          }),
        ],
      },
    });

    expect(result.ok).toBe(true);
    expect(result.mapPinCount).toBe(2);
    expect(getPrismCubeMapPinRowsV0().length).toBe(2);

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("cesium.world.commit_complete");
    expect(signalNames).toContain("cesium.world.pin_committed");
  });

  it("commitPrismCubesToWorldV0 requires prism cube commit", () => {
    const result = commitPrismCubesToWorldV0({ prismCubeCommit: { ok: false } });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("prism_cube_commit_required");
  });
});
