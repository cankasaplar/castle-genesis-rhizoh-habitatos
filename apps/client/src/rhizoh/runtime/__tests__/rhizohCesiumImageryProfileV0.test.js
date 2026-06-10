import { describe, expect, it } from "vitest";
import {
  resolveCesiumMapCameraAnchorV0,
  resolveCesiumImageryProfileForMapToolV0
} from "../rhizohCesiumImageryProfileV0.js";

describe("resolveCesiumMapCameraAnchorV0", () => {
  it("streets tool resolves to dark cyber imagery profile", () => {
    expect(resolveCesiumImageryProfileForMapToolV0("streets")).toBe("dark");
  });

  it("globe tool uses satellite imagery profile", () => {
    expect(resolveCesiumImageryProfileForMapToolV0("globe")).toBe("satellite");
  });

  it("city_map uses land-safe cinematic pitch at ~780m", () => {
    const anchor = resolveCesiumMapCameraAnchorV0("city_map");
    expect(anchor.pitchDeg).toBe(-32);
    expect(anchor.height).toBe(780);
    expect(anchor.headingDeg).toBe(12);
    expect(anchor.lat).toBeGreaterThan(41.03);
    expect(anchor.lat).toBeLessThan(41.05);
    expect(anchor.lon).toBeGreaterThan(29.0);
    expect(anchor.lon).toBeLessThan(29.02);
  });
});
