import { describe, expect, it } from "vitest";
import {
  buildSpiralMMOBirdFlockPlanV0,
  buildSpiralMMOBirdFlockRouteV0,
  sampleSpiralMMOBirdRoutePointV0
} from "../spiralMMOBirdFlockFlightV0.js";
import { buildSpiralMMOAwakeningBirdPlanV0 } from "../spiralMMOAwakeningBirdV0.js";
import { resolveSpiralMMOSixFortyFourTierLabelV0 } from "../spiralMMOPinCitizenshipV0.js";

describe("spiralMMOBirdFlockFlightV0", () => {
  it("samples points along a closed spiral route", () => {
    const route = buildSpiralMMOBirdFlockRouteV0(200, 150, { seed: "test-flock" });
    expect(route.points.length).toBeGreaterThan(20);
    const start = sampleSpiralMMOBirdRoutePointV0(route.points, 0);
    const mid = sampleSpiralMMOBirdRoutePointV0(route.points, 0.5);
    expect(start.x).not.toBeCloseTo(mid.x, 0);
    expect(Number.isFinite(start.headingDeg)).toBe(true);
  });

  it("builds multiple flocks with distinct tier labels", () => {
    const plan = buildSpiralMMOBirdFlockPlanV0({ hostW: 900, hostH: 600, cycleSeed: 42 });
    expect(plan.flockCount).toBeGreaterThanOrEqual(2);
    const tierShorts = new Set(plan.flocks.map((f) => f.tierShort));
    expect(tierShorts.size).toBeGreaterThan(1);
    expect(plan.birds.every((b) => b.routeMode === "spiral_flock")).toBe(true);
  });

  it("labels 6+44 tiers as hour/day/month/year units", () => {
    expect(resolveSpiralMMOSixFortyFourTierLabelV0("hour").short).toContain("6h");
    expect(resolveSpiralMMOSixFortyFourTierLabelV0("day").short).toContain("6d");
    expect(resolveSpiralMMOSixFortyFourTierLabelV0("month").short).toContain("6mo");
    expect(resolveSpiralMMOSixFortyFourTierLabelV0("year").short).toContain("6y");
  });

  it("awakening bird plan uses spiral flock routes instead of sparse singles", () => {
    const launches = Array.from({ length: 12 }, (_, i) => ({
      id: `launch-${i}`,
      p0: { x: 10 + i, y: 20 },
      p2: { x: 100 + i * 8, y: 80 + i * 3 },
      delayMs: i * 40,
      kind: i % 2 === 0 ? "order" : "chaos"
    }));
    const birds = buildSpiralMMOAwakeningBirdPlanV0(launches, 99, {
      triggerX: 400,
      triggerY: 300,
      hostW: 960,
      hostH: 640
    });
    expect(birds.length).toBeGreaterThan(6);
    expect(birds.every((b) => b.routeMode === "spiral_flock")).toBe(true);
    expect(birds.every((b) => b.routePoints?.length > 10)).toBe(true);
    expect(birds.some((b) => b.tierShort)).toBe(true);
  });
});
