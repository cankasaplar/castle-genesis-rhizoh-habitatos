import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSpiralMMOOrderedRouteWalkV0,
  buildSpiralMMOSequencedCubeLaunchesV0,
  resolveSpiralMMOAccumulationOffsetV0,
  SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0,
  verifySpiralMMOCubeFlowContinuityV0
} from "../spiralMMOAwakeningCubeFlowV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../spiralMMOContinentPinsV0.js";
import { listSpiralMMOContinentRouteEdgesV0 } from "../spiralMMOContinentRouteGraphV0.js";
import { buildSpiralMMOAwakeningLaunchPlanV0 } from "../spiralMMOAwakeningCycleV0.js";
import { resetSpiralMMOContinuityForTestV0 } from "../spiralMMOContinuityV0.js";
import { resolveSpiralMMOBehaviorProfileV0 } from "../spiralMMOSpiralBehaviorV0.js";

describe("spiralMMOAwakeningCubeFlowV0", () => {
  beforeEach(() => {
    resetSpiralMMOContinuityForTestV0();
  });
  it("orders route walk with forward then reverse per edge", () => {
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

  it("builds sequenced launches across all routes, depths, and dual directions", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    /** @type {Record<string, unknown>[]} */
    const launches = [];
    const meta = buildSpiralMMOSequencedCubeLaunchesV0({
      triggerPinIndex: 1,
      pins,
      cycleSeed: 42,
      addLaunch: (launch) => launches.push(launch)
    });
    const edgeCount = listSpiralMMOContinentRouteEdgesV0().length;
    expect(meta.routeStepCount).toBe(edgeCount * 2);
    expect(meta.depthLayerCount).toBe(SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0.length);
    expect(launches.length).toBe(edgeCount * 2 * SPIRAL_MMO_CUBE_DEPTH_LAYERS_V0.length);

    const continuity = verifySpiralMMOCubeFlowContinuityV0(launches);
    expect(continuity.ok).toBe(true);
    expect(continuity.dualDirectionCoverage).toBe(true);
    expect(continuity.depthLayers).toEqual([0, 1, 2]);

    for (let i = 1; i < launches.length; i += 1) {
      expect(launches[i].delayMs).toBeGreaterThanOrEqual(launches[i - 1].delayMs);
    }
    expect(launches.every((l) => l.holdAtDest === true)).toBe(true);
    expect(launches.every((l) => l.accumulationOffset)).toBe(true);
  });

  it("accumulation offsets spiral outward by ring", () => {
    const inner = resolveSpiralMMOAccumulationOffsetV0(1);
    const outer = resolveSpiralMMOAccumulationOffsetV0(9);
    expect(Math.hypot(outer.x, outer.y)).toBeGreaterThan(Math.hypot(inner.x, inner.y));
  });

  it("launch plan uses sequenced flow (no random scatter delays)", () => {
    const plan = buildSpiralMMOAwakeningLaunchPlanV0(0, 1_700_000_000_000, { commit: false });
    expect(plan.launches.length).toBeGreaterThan(60);
    expect(plan.launches[0].sequenceIndex).toBe(0);
    expect(plan.launches[1].sequenceIndex).toBe(1);
    expect(new Set(plan.launches.map((l) => l.depthLayer)).size).toBe(3);
    expect(plan.behavior.continent).toBeTruthy();
  });

  it("reverse-first behavior swaps dual direction order on an edge", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const forwardFirst = buildSpiralMMOOrderedRouteWalkV0(2, pins, { dualLead: "forward" });
    const reverseFirst = buildSpiralMMOOrderedRouteWalkV0(2, pins, { dualLead: "reverse" });
    expect(forwardFirst[0]?.direction).toBe("forward");
    expect(reverseFirst[0]?.direction).toBe("reverse");
  });

  it("behavior profile alters stagger and color wave in launches", () => {
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
    expect(asiaLaunches[1].delayMs).not.toBe(europeLaunches[1].delayMs);
    expect(asiaLaunches[0].colorClass).not.toBe(europeLaunches[0].colorClass);
  });
});
