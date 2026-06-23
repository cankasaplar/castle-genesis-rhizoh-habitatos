import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSpiralMMOAwakeningLaunchPlanV0,
  spiralMMOBezierPointV0,
  spiralMMOEmptyCubeHtmlV0,
  spiralMMOGeoToPercentV0,
  SPIRAL_MMO_ORDER_COLORS_V0,
  resolveSpiralMMOTriggerIndexFromPinIdV0
} from "../spiralMMOAwakeningCycleV0.js";
import { buildSpiralMMOAwakeningBirdPlanV0 } from "../spiralMMOAwakeningBirdV0.js";
import { resetSpiralMMOContinuityForTestV0 } from "../spiralMMOContinuityV0.js";
import { resetSpiralMMOSessionCubeAccumV0 } from "../spiralMMOSessionAccumulationV0.js";
import { resetRhizohNeonCountdownDeadlineV0 } from "../rhizohNeonCountdownV0.js";

describe("spiralMMOAwakeningCycleV0", () => {
  beforeEach(() => {
    resetSpiralMMOContinuityForTestV0();
    resetSpiralMMOSessionCubeAccumV0();
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem("rhizoh_neon_countdown_deadline_v0");
      } catch {
        /* noop */
      }
    }
  });
  it("maps geo to clamped percent", () => {
    const p = spiralMMOGeoToPercentV0(50, 15);
    expect(p.x).toBeGreaterThan(4);
    expect(p.y).toBeGreaterThan(12);
  });

  it("builds bezier midpoint", () => {
    const mid = spiralMMOBezierPointV0(0.5, { x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 });
    expect(mid.x).toBeCloseTo(50, 0);
    expect(mid.y).toBeCloseTo(0, 0);
  });

  it("renders empty cube html without face labels", () => {
    const html = spiralMMOEmptyCubeHtmlV0("blue");
    expect(html).toContain("rhizoh-spiral-empty-cube");
    expect(html).toContain("#00ccff");
    expect(html).not.toContain("06:44");
    expect(html).not.toContain("0644");
  });

  it("launch plan spans order colors, dimensional collapse arcs, birds and 6:44 deadline", () => {
    const plan = buildSpiralMMOAwakeningLaunchPlanV0(2, 1_700_000_000_000, { commit: false });
    expect(plan.triggerPinIndex).toBe(2);
    expect(plan.durationMs).toBe((6 * 60 + 44) * 1000);
    expect(plan.deadlineMs).toBe(plan.durationMs + 1_700_000_000_000);
    expect(plan.routeLines.length).toBe(0);
    expect(plan.launches.length).toBeGreaterThan(50);
    expect(plan.launches[0].cubeSpec).toBeTruthy();
    expect(plan.launches.some((l) => l.kind === "order")).toBe(true);
    expect(plan.launches.some((l) => l.kind === "chaos")).toBe(true);
    const colors = new Set(plan.launches.map((l) => l.colorClass));
    for (const c of SPIRAL_MMO_ORDER_COLORS_V0) expect(colors.has(c)).toBe(true);
    const mockCubes = plan.launches.map((l) => ({
      id: l.id,
      p0: { x: 10, y: 10 },
      p2: { x: 80, y: 80 },
      kind: l.kind,
      delayMs: l.delayMs
    }));
    const birds = buildSpiralMMOAwakeningBirdPlanV0(mockCubes, plan.cycleSeed, {
      triggerX: 50,
      triggerY: 50,
      hostW: 800,
      hostH: 600
    });
    expect(birds.length).toBeGreaterThan(0);
    expect(birds[0].routeMode).toBe("spiral_flock");
    expect(birds[0].tierShort).toBeTruthy();
  });

  it("resolves trigger index from pin id", () => {
    expect(resolveSpiralMMOTriggerIndexFromPinIdV0("spiralmmo_europe")).toBeGreaterThanOrEqual(0);
    expect(resolveSpiralMMOTriggerIndexFromPinIdV0("unknown")).toBe(0);
  });

  it("resets countdown to full 6:44 on each spiral click awakening", () => {
    const t0 = 1_700_000_000_000;
    resetRhizohNeonCountdownDeadlineV0(t0);
    const first = buildSpiralMMOAwakeningLaunchPlanV0(1, t0 + 5_000, { commit: false });
    const second = buildSpiralMMOAwakeningLaunchPlanV0(3, t0 + 90_000, { commit: false });
    expect(first.deadlineMs).toBe(t0 + 5_000 + 404_000);
    expect(second.deadlineMs).toBe(t0 + 90_000 + 404_000);
  });

  it("resets countdown only when session resets at collapse", () => {
    const t0 = 1_700_000_000_000;
    resetRhizohNeonCountdownDeadlineV0(t0);
    buildSpiralMMOAwakeningLaunchPlanV0(1, t0, { commit: false });
    const collapse = buildSpiralMMOAwakeningLaunchPlanV0(1, t0 + 404_500, {
      mode: "collapse",
      commit: false,
      resetSession: true
    });
    expect(collapse.deadlineMs).toBe(t0 + 404_500 + 404_000);
  });
});
