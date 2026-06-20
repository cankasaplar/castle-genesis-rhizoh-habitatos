import { beforeEach, describe, expect, it } from "vitest";
import {
  resetSpatialSlotResolverForTestV0,
  resolveBoundCubeSpatialSlotV0,
  resolveLogicalToWorldPositionV0,
  resolveSpatialSlotsV0,
} from "../spatialSlotResolverV0.js";
import { RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 } from "../../spatial/geographicAnchorsV0.js";

describe("spatialSlotResolverV0", () => {
  beforeEach(() => {
    resetSpatialSlotResolverForTestV0();
  });

  it("resolveLogicalToWorldPositionV0 projects grid offset from calibration root", () => {
    const world = resolveLogicalToWorldPositionV0({ x: 2, y: 3, z: 1 });
    expect(world.coordinateSpace).toBe("wgs84_epistemic_projection");
    expect(world.originAnchorId).toBe(RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0);
    expect(world.resolverMethod).toBe("logical_grid_calibration_root_v0");
    expect(world.lon).toBeCloseTo(29.0567 + 2 * 0.0008, 6);
    expect(world.lat).toBeCloseTo(41.1169 + 3 * 0.0008, 6);
    expect(world.alt).toBe(120 + 40);
    expect(world.logicalSource).toEqual({ x: 2, y: 3, z: 1 });
  });

  it("resolveBoundCubeSpatialSlotV0 fills worldPosition and eventAnchor", () => {
    const boundCube = {
      cubeId: "cube-1",
      entityId: "entity-1",
      spatialSlot: {
        slotId: "slot-1",
        logicalPosition: { x: 1, y: 0, z: 2 },
        coordinateSpace: "logical_epistemic_grid",
        worldPosition: null,
        eventAnchor: null,
      },
      spatialBinding: {
        entityId: "entity-1",
        spatialSlot: {
          logicalPosition: { x: 1, y: 0, z: 2 },
          coordinateSpace: "logical_epistemic_grid",
          worldPosition: null,
        },
        arenaBinding: { status: "bound" },
      },
      arenaBinding: { status: "bound" },
    };

    const resolved = resolveBoundCubeSpatialSlotV0(boundCube);
    expect(resolved.spatialSlot.worldPosition).not.toBeNull();
    expect(resolved.spatialSlot.worldPosition.lat).toBeCloseTo(41.1169, 4);
    expect(resolved.spatialBinding.spatialSlot.worldPosition).not.toBeNull();
    expect(resolved.spatialSlot.eventAnchor.entityId).toBe("entity-1");
    expect(resolved.actionSurface.status).toBe("armed");
    expect(resolved.actionSurface.commitDeferred).toBe(true);
  });

  it("resolveSpatialSlotsV0 resolves all arena-bound cubes", () => {
    const arenaBinding = {
      ok: true,
      bindingHead: "bind-head-1",
      boundCubes: [
        {
          cubeId: "cube-a",
          entityId: "entity-a",
          spatialSlot: {
            slotId: "slot-a",
            logicalPosition: { x: 0, y: 0, z: 0 },
            coordinateSpace: "logical_epistemic_grid",
            worldPosition: null,
          },
          spatialBinding: {
            entityId: "entity-a",
            spatialSlot: { logicalPosition: { x: 0, y: 0, z: 0 }, worldPosition: null },
            arenaBinding: { status: "bound" },
          },
          arenaBinding: { status: "bound" },
        },
        {
          cubeId: "cube-b",
          entityId: "entity-b",
          spatialSlot: {
            slotId: "slot-b",
            logicalPosition: { x: 3, y: 1, z: 0 },
            coordinateSpace: "logical_epistemic_grid",
            worldPosition: null,
          },
          spatialBinding: {
            entityId: "entity-b",
            spatialSlot: { logicalPosition: { x: 3, y: 1, z: 0 }, worldPosition: null },
            arenaBinding: { status: "bound" },
          },
          arenaBinding: { status: "bound" },
        },
      ],
    };

    const result = resolveSpatialSlotsV0({ arenaBinding });
    expect(result.ok).toBe(true);
    expect(result.resolvedCount).toBe(2);
    expect(result.resolvedCubes[0].spatialSlot.worldPosition).not.toBeNull();
    expect(result.resolvedCubes[1].spatialSlot.worldPosition.lon).toBeCloseTo(29.0567 + 3 * 0.0008, 6);
    expect(result.originAnchorId).toBe(RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0);

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("spatial.slot.world_resolved");
    expect(signalNames).toContain("spatial.binding.world_position_set");
  });

  it("resolveSpatialSlotsV0 requires arena binding", () => {
    const result = resolveSpatialSlotsV0({ arenaBinding: { ok: false } });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("arena_binding_required");
  });
});
