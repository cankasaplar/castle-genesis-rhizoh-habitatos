import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCommittedActionSurfaceV0,
  buildCommittedSpatialObjectV0,
  commitPrismCubesV0,
  commitResolvedPrismCubeV0,
  resetPrismCubeCommitForTestV0,
} from "../prismCubeCommitV0.js";
import { ARENA_TYPE_V0 } from "../arenaBindingLayerV0.js";

function makeResolvedCube(overrides = {}) {
  return {
    cubeId: "cube-1",
    entityId: "entity-1",
    arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
    spatialSlot: {
      slotId: "slot-1",
      logicalPosition: { x: 0, y: 0, z: 0 },
      worldPosition: {
        lat: 41.04,
        lon: 29.01,
        alt: 120,
        observerRelative: true,
        observationOrigin: { source: "test_observer" },
      },
      eventAnchor: { entityId: "entity-1" },
    },
    actionSurface: {
      status: "armed",
      commitDeferred: true,
    },
    ...overrides,
  };
}

describe("prismCubeCommitV0", () => {
  beforeEach(() => {
    resetPrismCubeCommitForTestV0();
  });

  it("buildCommittedSpatialObjectV0 marks cube as committed spatial object", () => {
    const obj = buildCommittedSpatialObjectV0(makeResolvedCube());
    expect(obj.status).toBe("committed");
    expect(obj.mapPinEligible).toBe(true);
    expect(obj.observerRelative).toBe(true);
    expect(obj.cesiumCommitDeferred).toBe(true);
  });

  it("buildCommittedActionSurfaceV0 opens authority affordances", () => {
    const surface = buildCommittedActionSurfaceV0(makeResolvedCube());
    expect(surface.status).toBe("active");
    expect(surface.commitDeferred).toBe(false);
    expect(surface.affordances.resolveIdentity.enabled).toBe(true);
    expect(surface.affordances.bindEntity.enabled).toBe(true);
  });

  it("buildCommittedActionSurfaceV0 opens chess affordances", () => {
    const surface = buildCommittedActionSurfaceV0(
      makeResolvedCube({
        arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
      })
    );
    expect(surface.affordances.playMove.stub).toBe(true);
    expect(surface.affordances.playMove.ingest).toBe("ingestChessMoveArena");
  });

  it("commitResolvedPrismCubeV0 upgrades cube to committed state", () => {
    const committed = commitResolvedPrismCubeV0(makeResolvedCube());
    expect(committed.committed).toBe(true);
    expect(committed.spatialObject.status).toBe("committed");
    expect(committed.actionSurface.status).toBe("active");
  });

  it("commitPrismCubesV0 commits all resolved cubes", () => {
    const spatialSlotResolver = {
      ok: true,
      resolverHead: "resolver-head-1",
      observationOrigin: { lat: 41.04, lon: 29.01, source: "test_observer" },
      resolvedCubes: [
        makeResolvedCube({ cubeId: "cube-a", entityId: "entity-a" }),
        makeResolvedCube({
          cubeId: "cube-b",
          entityId: "entity-b",
          arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
        }),
      ],
    };

    const result = commitPrismCubesV0({ spatialSlotResolver });
    expect(result.ok).toBe(true);
    expect(result.committedCount).toBe(2);
    expect(result.committedCubes[1].actionSurface.affordances.playMove).toBeTruthy();

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("prism.cube.committed");
    expect(signalNames).toContain("prism.action_surface.active");
    expect(signalNames).toContain("prism.commit.complete");
  });

  it("commitPrismCubesV0 requires spatial slot resolver", () => {
    const result = commitPrismCubesV0({ spatialSlotResolver: { ok: false } });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("spatial_slot_resolver_required");
  });
});
