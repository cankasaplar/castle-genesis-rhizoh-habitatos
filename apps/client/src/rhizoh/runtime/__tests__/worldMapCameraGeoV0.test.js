import { describe, expect, it } from "vitest";
import { ORIGIN_SEED_SERENCEBEY_V0 } from "../memoryAnchorSystemV0.js";
import {
  isLikelyBosphorusWaterV0,
  resolveWorldMapCameraTargetV0
} from "../worldMapCameraGeoV0.js";

describe("worldMapCameraGeoV0", () => {
  it("detects mid-channel Bosphorus as water", () => {
    expect(isLikelyBosphorusWaterV0(41.05, 29.04)).toBe(true);
  });

  it("keeps Serencebey shore as land", () => {
    expect(isLikelyBosphorusWaterV0(ORIGIN_SEED_SERENCEBEY_V0.location.lat, ORIGIN_SEED_SERENCEBEY_V0.location.lon)).toBe(
      false
    );
  });

  it("clamps water GPS to Serencebey seed for camera", () => {
    const cam = resolveWorldMapCameraTargetV0({ lat: 41.05, lon: 29.04 });
    expect(cam.clamped).toBe(true);
    expect(cam.lat).toBeCloseTo(ORIGIN_SEED_SERENCEBEY_V0.location.lat, 4);
    expect(cam.lon).toBeCloseTo(ORIGIN_SEED_SERENCEBEY_V0.location.lon, 4);
  });

  it("passes through inland geo unchanged", () => {
    const cam = resolveWorldMapCameraTargetV0({ lat: 41.08, lon: 28.98 });
    expect(cam.clamped).toBe(false);
    expect(cam.lat).toBe(41.08);
    expect(cam.lon).toBe(28.98);
  });
});
