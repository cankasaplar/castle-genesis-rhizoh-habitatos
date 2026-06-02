import { describe, expect, it, vi } from "vitest";
import {
  configureOsmBuildingsTilesetV0,
  isCesiumCanvasRenderableV0,
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

  it("configureOsmBuildingsTilesetV0 raises SSE floor", () => {
    const tileset = { maximumScreenSpaceError: 8 };
    configureOsmBuildingsTilesetV0(tileset);
    expect(tileset.maximumScreenSpaceError).toBeGreaterThanOrEqual(28);
    expect(tileset.dynamicScreenSpaceError).toBe(true);
  });
});
