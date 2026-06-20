import { beforeEach, describe, expect, it } from "vitest";
import {
  computeDistributionOffsetV0,
  computeExplorerSeedSpreadOffsetV0,
  countUniqueMapCoordinatesV0,
  distributeMapPinV0,
  distributeSpatialPinsV0,
  resetSpatialDistributionForTestV0,
  resolveSpiralMapLayerV0,
  resolveTowerClassV0,
  TOWER_CLASS_V0,
} from "../spatialDistributionLayerV0.js";
import { ARENA_TYPE_V0 } from "../arenaBindingLayerV0.js";
import { resetCesiumWorldCommitForTestV0 } from "../cesiumWorldCommitV0.js";

describe("spatialDistributionLayerV0", () => {
  beforeEach(() => {
    resetSpatialDistributionForTestV0();
    resetCesiumWorldCommitForTestV0();
  });

  it("resolveTowerClassV0 maps arena types to tower classes", () => {
    expect(resolveTowerClassV0(ARENA_TYPE_V0.CHESS)).toBe(TOWER_CLASS_V0.CHESS);
    expect(resolveTowerClassV0(ARENA_TYPE_V0.AUTHORITY_EPISTEMIC)).toBe(
      TOWER_CLASS_V0.AUTHORITY_EPISTEMIC
    );
    expect(resolveSpiralMapLayerV0(TOWER_CLASS_V0.CHESS)).toBe("explorer");
    expect(resolveSpiralMapLayerV0(TOWER_CLASS_V0.MEDIA)).toBe("economy");
  });

  it("computeExplorerSeedSpreadOffsetV0 yields unique offsets per seed slot", () => {
    const offsets = [0, 1, 2, 3].map((slot) => computeExplorerSeedSpreadOffsetV0(slot, 0));
    const pins = offsets.map((o, i) => ({
      lat: 41.04 + o.dLat,
      lon: 29.01 + o.dLon,
      id: `seed-${i}`
    }));
    expect(countUniqueMapCoordinatesV0(pins)).toBe(4);
  });

  it("computeDistributionOffsetV0 separates colliding pins via golden angle", () => {
    const a = computeDistributionOffsetV0({ x: 0, y: 0, z: 0 }, 0, 0);
    const b = computeDistributionOffsetV0({ x: 0, y: 0, z: 0 }, 1, 1);
    expect(a.dLat).not.toBeCloseTo(b.dLat, 6);
    expect(b.method).toBe("golden_angle_spiral_v0");
  });

  it("distributeSpatialPinsV0 spreads pins that share the same base coordinate", () => {
    const base = { lat: 41.044256, lon: 29.009017 };
    const cesiumWorldCommit = {
      ok: true,
      commitHead: "cesium-head",
      mapPins: [
        {
          id: "prism_cube:cube-a",
          lat: base.lat,
          lon: base.lon,
          type: "agent",
          prismCube: { cubeId: "cube-a", arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
        },
        {
          id: "prism_cube:cube-b",
          lat: base.lat,
          lon: base.lon,
          type: "agent",
          prismCube: { cubeId: "cube-b", arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
        },
      ],
    };
    const prismCubeCommit = {
      committedCubes: [
        {
          cubeId: "cube-a",
          arenaBinding: { arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
          spatialObject: {
            logicalPosition: { x: 0, y: 0, z: 0 },
            worldPosition: { ...base, alt: 120, observerRelative: true },
          },
        },
        {
          cubeId: "cube-b",
          arenaBinding: { arenaType: ARENA_TYPE_V0.AUTHORITY_EPISTEMIC },
          spatialObject: {
            logicalPosition: { x: 1, y: 0, z: 0 },
            worldPosition: { ...base, alt: 120, observerRelative: true },
          },
        },
      ],
    };

    const result = distributeSpatialPinsV0({ cesiumWorldCommit, prismCubeCommit });
    expect(result.ok).toBe(true);
    expect(result.uniqueCoordinateCount).toBe(2);
    expect(result.distributedPins[0].lat).not.toBeCloseTo(result.distributedPins[1].lat, 5);
    expect(result.distributedPins[0].towerClass).toBe(TOWER_CLASS_V0.AUTHORITY_EPISTEMIC);
    expect(result.distributedPins[0].spiralLayer).toBe("castle");

    const signalNames = result.signals.map((s) => s.signal);
    expect(signalNames).toContain("spatial.distribution.spread");
    expect(signalNames).toContain("spatial.distribution.complete");
  });

  it("distributeMapPinV0 assigns tower class label", () => {
    const collisionCounts = new Map();
    const pin = distributeMapPinV0(
      {
        id: "prism_cube:cube-c",
        lat: 41.0,
        lon: 29.0,
        prismCube: { cubeId: "cube-c", arenaType: ARENA_TYPE_V0.SPORTS },
      },
      {
        cubeId: "cube-c",
        arenaBinding: { arenaType: ARENA_TYPE_V0.SPORTS },
        spatialObject: { logicalPosition: { x: 2, y: 1, z: 0 } },
      },
      0,
      collisionCounts
    );
    expect(pin.towerClass).toBe(TOWER_CLASS_V0.SPORTS);
    expect(pin.label).toBe(TOWER_CLASS_V0.SPORTS);
  });
});
