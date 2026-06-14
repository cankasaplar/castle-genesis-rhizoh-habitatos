import { describe, expect, it } from "vitest";
import {
  deriveSpiralMMOContinentCubeMotionV0,
  resolveEarthSurfaceSpeedRatioV0,
  resolveSpiralMMOCubePeriodSecV0
} from "../spiralMMOContinentCubeMotionV0.js";

describe("spiralMMOContinentCubeMotionV0", () => {
  it("equator spins faster than high latitude", () => {
    const eq = resolveEarthSurfaceSpeedRatioV0(1.5);
    const pole = resolveEarthSurfaceSpeedRatioV0(-78);
    expect(eq).toBeGreaterThan(pole);
    expect(resolveSpiralMMOCubePeriodSecV0(eq)).toBeLessThan(resolveSpiralMMOCubePeriodSecV0(pole));
  });

  it("derives distinct motion per continent", () => {
    const africa = deriveSpiralMMOContinentCubeMotionV0({ continent: "africa" });
    const ant = deriveSpiralMMOContinentCubeMotionV0({ continent: "antarctica" });
    expect(africa.periodSec).toBeLessThan(ant.periodSec);
    expect(africa.direction).toBe(1);
    expect(ant.direction).toBe(-1);
    expect(africa.accent).not.toBe(ant.accent);
  });

  it("phase follows longitude", () => {
    const asia = deriveSpiralMMOContinentCubeMotionV0({ continent: "asia" });
    const na = deriveSpiralMMOContinentCubeMotionV0({ continent: "north_america" });
    expect(asia.phaseDeg).not.toBe(na.phaseDeg);
  });
});
