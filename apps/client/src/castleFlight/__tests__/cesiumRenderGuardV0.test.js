import { describe, expect, it, vi } from "vitest";
import {
  configureOsmBuildingsTilesetV0,
  cesiumSafeFromDegreesV0,
  isCesiumCanvasRenderableV0,
  isCesiumNaNCartesianErrorV0,
  isCesiumPvsRangeErrorV0,
  isCesiumSafeModeRenderErrorV0,
  isFiniteCartesian3V0,
  sanitizeCesiumCameraV0
} from "../cesiumRenderGuardV0.js";

describe("cesiumRenderGuardV0", () => {
  it("isFiniteCartesian3V0 rejects NaN components", () => {
    expect(isFiniteCartesian3V0({ x: 1, y: 2, z: 3 })).toBe(true);
    expect(isFiniteCartesian3V0({ x: NaN, y: 2, z: 3 })).toBe(false);
    expect(isFiniteCartesian3V0(null)).toBe(false);
  });

  it("sanitizeCesiumCameraV0 resets broken camera", () => {
    const setView = vi.fn();
    const viewer = {
      camera: {
        positionWC: { x: NaN, y: 0, z: 0 },
        directionWC: { x: 1, y: 0, z: 0 },
        upWC: { x: 0, y: 0, z: 1 },
        setView
      }
    };
    const Cesium = {
      Cartesian3: {
        fromDegrees: (lon, lat, h) => ({ lon, lat, h }),
        magnitude: (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
      },
      Math: { toRadians: (d) => (d * Math.PI) / 180 }
    };
    const ok = sanitizeCesiumCameraV0(viewer, Cesium, { lon: 29, lat: 41, height: 3000 });
    expect(ok).toBe(true);
    expect(setView).toHaveBeenCalledOnce();
  });

  it("isCesiumCanvasRenderableV0 requires minimum client size", () => {
    expect(
      isCesiumCanvasRenderableV0({
        canvas: { clientWidth: 100, clientHeight: 80, width: 100, height: 80 }
      })
    ).toBe(true);
    expect(
      isCesiumCanvasRenderableV0({
        canvas: { clientWidth: 0, clientHeight: 0, width: 0, height: 0 }
      })
    ).toBe(false);
  });

  it("isCesiumPvsRangeErrorV0 detects PVS overflow message", () => {
    expect(isCesiumPvsRangeErrorV0(new Error("Invalid array length"))).toBe(true);
    expect(isCesiumPvsRangeErrorV0(new Error("other"))).toBe(false);
  });

  it("isCesiumNaNCartesianErrorV0 detects NaN and destroyed primitive", () => {
    expect(isCesiumNaNCartesianErrorV0(new Error("cartesian has a NaN component"))).toBe(true);
    expect(isCesiumNaNCartesianErrorV0(new Error("This object was destroyed"))).toBe(true);
    expect(isCesiumSafeModeRenderErrorV0(new Error("cartesian has a NaN component"))).toBe(true);
  });

  it("cesiumSafeFromDegreesV0 rejects invalid coordinates", () => {
    const Cesium = {
      Cartesian3: {
        fromDegrees: (lon, lat, alt) => ({ x: lon, y: lat, z: alt })
      }
    };
    expect(cesiumSafeFromDegreesV0(Cesium, NaN, 41, 10)).toBeNull();
    expect(cesiumSafeFromDegreesV0(Cesium, 29, 41, 10)).toEqual({ x: 29, y: 41, z: 10 });
  });

  it("configureOsmBuildingsTilesetV0 raises SSE floor", () => {
    const tileset = { maximumScreenSpaceError: 8 };
    configureOsmBuildingsTilesetV0(tileset);
    expect(tileset.maximumScreenSpaceError).toBeGreaterThanOrEqual(28);
    expect(tileset.dynamicScreenSpaceError).toBe(true);
  });
});
