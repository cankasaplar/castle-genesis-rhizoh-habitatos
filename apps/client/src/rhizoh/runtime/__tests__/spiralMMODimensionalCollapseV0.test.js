import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSpiralMMODimensionalCollapseLaunchesV0,
  resolveSpiralMMODimCollapseParamsV0,
  verifySpiralMMODimCollapseFlowV0
} from "../spiralMMODimensionalCollapseV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../spiralMMOContinentPinsV0.js";
import { resolveSpiralMMOOrderPartnerIndexV0 } from "../spiralMMOContinentRouteGraphV0.js";
import { resetSpiralMMOSessionCubeAccumV0 } from "../spiralMMOSessionAccumulationV0.js";
import { resolveSpiralMMOBehaviorProfileV0 } from "../spiralMMOSpiralBehaviorV0.js";

describe("spiralMMODimensionalCollapseV0", () => {
  beforeEach(() => {
    resetSpiralMMOSessionCubeAccumV0();
  });

  it("spawns order, chaos, and special ghosts from trigger gate", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const trigger = 2;
    const partner = resolveSpiralMMOOrderPartnerIndexV0(trigger, pins.length);
    const behavior = resolveSpiralMMOBehaviorProfileV0(pins[trigger].continent, 0);
    const params = resolveSpiralMMODimCollapseParamsV0(behavior);
    /** @type {Record<string, unknown>[]} */
    const launches = [];
    const meta = buildSpiralMMODimensionalCollapseLaunchesV0({
      triggerPinIndex: trigger,
      pins,
      cycleSeed: 12345,
      behavior,
      addLaunch: (l) => launches.push(l)
    });

    expect(meta.triggerIndex).toBe(trigger);
    expect(meta.partnerIndex).toBe(partner);
    expect(launches.length).toBeLessThan(25);
    expect(launches.length).toBeGreaterThan(10);

    const order = launches.filter((l) => l.kind === "order");
    const chaos = launches.filter((l) => l.kind === "chaos");
    const special = launches.filter((l) => ["mirror", "black", "white"].includes(l.kind));
    expect(order.length).toBe(params.ghostDensity);
    expect(chaos.length).toBe(Math.max(2, Math.floor(params.ghostDensity * 0.35)));
    expect(special.length).toBe(Math.max(1, Math.floor(params.ghostDensity * 0.2)));

    expect(order[0].srcIdx).toBe(partner);
    expect(order[0].destIdx).toBe(trigger);
    expect(order[1].srcIdx).toBe(trigger);
    expect(order[1].destIdx).toBe(partner);

    const verify = verifySpiralMMODimCollapseFlowV0(launches);
    expect(verify.ok).toBe(true);
    expect(verify.orderCount).toBeGreaterThan(0);
    expect(verify.chaosCount).toBeGreaterThan(0);
    expect(verify.specialCount).toBeGreaterThan(0);
  });

  it("chaos ghosts carry scatter offsets", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    /** @type {Record<string, unknown>[]} */
    const launches = [];
    buildSpiralMMODimensionalCollapseLaunchesV0({
      triggerPinIndex: 0,
      pins,
      cycleSeed: 99,
      addLaunch: (l) => launches.push(l)
    });
    const chaos = launches.filter((l) => l.kind === "chaos");
    expect(chaos.some((l) => l.scatterX !== 0 || l.scatterY !== 0)).toBe(true);
    expect(chaos.every((l) => Number.isFinite(l.scatterX) && Number.isFinite(l.scatterY))).toBe(true);
    expect(chaos.every((l) => l.srcIdx === 0 || l.srcIdx === 3)).toBe(true);
  });
});
