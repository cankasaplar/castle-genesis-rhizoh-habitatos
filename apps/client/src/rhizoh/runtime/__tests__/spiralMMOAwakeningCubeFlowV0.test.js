import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSpiralMMOOrderedRouteWalkV0,
  buildSpiralMMOSequencedCubeLaunchesV0,
  resolveSpiralMMOAccumulationOffsetV0,
  verifySpiralMMOCubeFlowContinuityV0
} from "../spiralMMOAwakeningCubeFlowV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../spiralMMOContinentPinsV0.js";
import { listSpiralMMOContinentRouteEdgesV0 } from "../spiralMMOContinentRouteGraphV0.js";
import { buildSpiralMMOAwakeningLaunchPlanV0 } from "../spiralMMOAwakeningCycleV0.js";
import { resetSpiralMMOContinuityForTestV0 } from "../spiralMMOContinuityV0.js";
import { resetSpiralMMOSessionCubeAccumV0 } from "../spiralMMOSessionAccumulationV0.js";
import { resolveSpiralMMOBehaviorProfileV0 } from "../spiralMMOSpiralBehaviorV0.js";
import { SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0 } from "../spiralMMODimensionalCollapseV0.js";

describe("spiralMMOAwakeningCubeFlowV0", () => {
  beforeEach(() => {
    resetSpiralMMOContinuityForTestV0();
    resetSpiralMMOSessionCubeAccumV0();
  });
  it("orders route walk with forward then reverse per edge (legacy helper)", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const walk = buildSpiralMMOOrderedRouteWalkV0(2, pins);
    expect(walk.length).toBe(listSpiralMMOContinentRouteEdgesV0().length * 2);
    const firstEdge = walk[0]?.edgeKey;
    const fwd = walk.find((w) => w.edgeKey === firstEdge && w.direction === "forward");
    const rev = walk.find((w) => w.edgeKey === firstEdge && w.direction === "reverse");
    expect(fwd).toBeTruthy();
    expect(rev).toBeTruthy();
    expect(walk.indexOf(fwd)).toBeLessThan(walk.indexOf(rev));
  });

  it("builds dimensional collapse launches with order, chaos, and special kinds", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    /** @type {Record<string, unknown>[]} */
    const launches = [];
    const meta = buildSpiralMMOSequencedCubeLaunchesV0({
      triggerPinIndex: 1,
      pins,
      cycleSeed: 42,
      addLaunch: (launch) => launches.push(launch)
    });
    expect(meta.sequenceCount).toBe(launches.length);
    expect(launches.length).toBeGreaterThan(50);
    expect(launches.some((l) => l.kind === "order")).toBe(true);
    expect(launches.some((l) => l.kind === "chaos")).toBe(true);
    expect(launches.some((l) => ["mirror", "black", "white"].includes(l.kind))).toBe(true);

    const continuity = verifySpiralMMOCubeFlowContinuityV0(launches);
    expect(continuity.ok).toBe(true);
    expect(continuity.orderCount).toBeGreaterThan(0);
    expect(continuity.chaosCount).toBeGreaterThan(0);

    for (let i = 1; i < launches.length; i += 1) {
      expect(launches[i].delayMs).toBeGreaterThanOrEqual(launches[i - 1].delayMs);
    }
    expect(launches.every((l) => l.holdAtDest === true)).toBe(true);
    expect(launches.every((l) => l.accumulationOffset)).toBe(true);
  });

  it("accumulation offsets stack in 3d rings by depth", () => {
    const inner = resolveSpiralMMOAccumulationOffsetV0(1, 1, 0);
    const outer = resolveSpiralMMOAccumulationOffsetV0(8, 1, 2);
    expect(outer.z).toBeGreaterThan(inner.z);
    expect(outer.stackScale).toBeGreaterThan(inner.stackScale);
  });

  it("launch plan uses dimensional collapse wave (no route mesh scatter)", () => {
    const plan = buildSpiralMMOAwakeningLaunchPlanV0(0, 1_700_000_000_000, { commit: false });
    const expectedMin =
      SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0.ghostDensity +
      Math.floor(SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0.ghostDensity * 0.8) +
      Math.floor(SPIRAL_MMO_DIM_COLLAPSE_DEFAULTS_V0.ghostDensity * 0.45);
    expect(plan.launches.length).toBeGreaterThanOrEqual(expectedMin);
    expect(plan.launches[0].sequenceIndex).toBe(0);
    expect(plan.launches[1].sequenceIndex).toBe(1);
    expect(plan.launches.some((l) => l.kind === "order")).toBe(true);
    expect(plan.behavior.continent).toBeTruthy();
  });

  it("reverse-first behavior swaps dual direction order on an edge (legacy walk)", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const forwardFirst = buildSpiralMMOOrderedRouteWalkV0(2, pins, { dualLead: "forward" });
    const reverseFirst = buildSpiralMMOOrderedRouteWalkV0(2, pins, { dualLead: "reverse" });
    expect(forwardFirst[0]?.direction).toBe("forward");
    expect(reverseFirst[0]?.direction).toBe("reverse");
  });

  it("behavior profile alters ghost density via stagger scale", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const asia = resolveSpiralMMOBehaviorProfileV0("asia", 0);
    const europe = resolveSpiralMMOBehaviorProfileV0("europe", 0);
    /** @type {Record<string, unknown>[]} */
    const asiaLaunches = [];
    const europeLaunches = [];
    buildSpiralMMOSequencedCubeLaunchesV0({
      triggerPinIndex: 0,
      pins,
      cycleSeed: 1,
      behavior: asia,
      addLaunch: (l) => asiaLaunches.push(l)
    });
    buildSpiralMMOSequencedCubeLaunchesV0({
      triggerPinIndex: 0,
      pins,
      cycleSeed: 1,
      behavior: europe,
      addLaunch: (l) => europeLaunches.push(l)
    });
    expect(asiaLaunches.length).not.toBe(europeLaunches.length);
    expect(asiaLaunches[0].colorClass).not.toBe(europeLaunches[0].colorClass);
  });
});
