import { beforeEach, describe, expect, it } from "vitest";
import {
  resetSpatialSlotResolverForTestV0,
  resolveArenaProjectionOriginV0,
  resolveBoundCubeSpatialSlotV0,
  resolveLogicalToWorldPositionV0,
  resolveObservationOriginV0,
  resolveSpatialSlotsV0,
} from "../spatialSlotResolverV0.js";
import { ARENA_TYPE_V0 } from "../arenaBindingLayerV0.js";
import { RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 } from "../../spatial/geographicAnchorsV0.js";

const BERLIN_ORIGIN = Object.freeze({
  lat: 52.52,
  lon: 13.405,
  label: "Berlin",
  source: "test_berlin_observer",
});

describe("spatialSlotResolverV0", () => {
  beforeEach(() => {
    resetSpatialSlotResolverForTestV0();
  });

  it("resolveObservationOriginV0 accepts explicit observer override", () => {
    const origin = resolveObservationOriginV0(BERLIN_ORIGIN);
    expect(origin.lat).toBe(52.52);
    expect(origin.lon).toBe(13.405);
    expect(origin.source).toBe("test_berlin_observer");
    expect(origin.policy).toBe("observation_origin");
  });

  it("resolveLogicalToWorldPositionV0 projects from observer origin not calibration root", () => {
    const world = resolveLogicalToWorldPositionV0(
      { x: 2, y: 3, z: 1 },
      { observationOrigin: BERLIN_ORIGIN }
    );
    expect(world.coordinateSpace).toBe("wgs84_epistemic_projection");
    expect(world.observerRelative).toBe(true);
    expect(world.resolverMethod).toBe("logical_grid_observation_origin_v0.1");
    expect(world.calibrationOriginId).toBe(RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0);
    expect(world.lon).toBeCloseTo(13.405 + 2 * 0.0008, 6);
    expect(world.lat).toBeCloseTo(52.52 + 3 * 0.0008, 6);
    expect(world.observationOrigin.source).toBe("test_berlin_observer");
  });

  it("resolveArenaProjectionOriginV0 uses observation origin for chess arena", () => {
    const origin = resolveArenaProjectionOriginV0(ARENA_TYPE_V0.CHESS, {
      observationOrigin: BERLIN_ORIGIN,
    });
    expect(origin.policy).toBe("observation_origin");
    expect(origin.lat).toBe(52.52);
    expect(origin.lon).toBe(13.405);
  });

  it("resolveArenaProjectionOriginV0 uses venue anchor for sports live event", () => {
    const origin = resolveArenaProjectionOriginV0(ARENA_TYPE_V0.SPORTS, {
      observationOrigin: BERLIN_ORIGIN,
      venueTeamName: "Galatasaray",
    });
    expect(origin.policy).toBe("venue_anchor");
    expect(origin.source).toContain("sports_venue:");
    expect(origin.lat).toBeCloseTo(41.103, 3);
    expect(origin.lon).toBeCloseTo(28.991, 3);
  });

  it("resolveBoundCubeSpatialSlotV0 fills observer-relative worldPosition", () => {
    const boundCube = {
      cubeId: "cube-1",
      entityId: "entity-1",
      arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
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
        arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
      },
    };

    const resolved = resolveBoundCubeSpatialSlotV0(boundCube, {
      observationOrigin: BERLIN_ORIGIN,
    });
    expect(resolved.spatialSlot.worldPosition.observerRelative).toBe(true);
    expect(resolved.spatialSlot.worldPosition.lat).toBeCloseTo(52.52, 4);
    expect(resolved.spatialSlot.eventAnchor.arenaType).toBe(ARENA_TYPE_V0.CHESS);
    expect(resolved.actionSurface.arenaType).toBe(ARENA_TYPE_V0.CHESS);
  });

  it("resolveSpatialSlotsV0 resolves all arena-bound cubes for observer", () => {
    const arenaBinding = {
      ok: true,
      bindingHead: "bind-head-1",
      boundCubes: [
        {
          cubeId: "cube-a",
          entityId: "entity-a",
          arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
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
        },
        {
          cubeId: "cube-b",
          entityId: "entity-b",
          arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
          spatialSlot: {
            slotId: "slot-b",
            logicalPosition: { x: 3, y: 1, z: 0 },
            coordinateSpace: "logical_epistemic_grid",
            worldPosition: null,
          },
          spatialBinding: {
            entityId: "entity-b",
            spatialSlot: { logicalPosition: { x: 3, y: 1, z: 0 }, worldPosition: null },
            arenaBinding: { status: "bound", arenaType: ARENA_TYPE_V0.CHESS },
          },
        },
      ],
    };

    const result = resolveSpatialSlotsV0({
      arenaBinding,
      observationOrigin: BERLIN_ORIGIN,
    });
    expect(result.ok).toBe(true);
    expect(result.resolvedCount).toBe(2);
    expect(result.observationOrigin.source).toBe("test_berlin_observer");
    expect(result.resolvedCubes[0].spatialSlot.worldPosition.lat).toBeCloseTo(52.52, 4);
    expect(result.resolvedCubes[1].spatialSlot.worldPosition.lon).toBeCloseTo(13.405 + 3 * 0.0008, 6);

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("spatial.slot.world_resolved");
    expect(signalNames).toContain("spatial.binding.world_position_set");
    expect(signalNames).toContain("spatial.observer_origin.active");
  });

  it("resolveSpatialSlotsV0 requires arena binding", () => {
    const result = resolveSpatialSlotsV0({ arenaBinding: { ok: false } });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("arena_binding_required");
  });
});
