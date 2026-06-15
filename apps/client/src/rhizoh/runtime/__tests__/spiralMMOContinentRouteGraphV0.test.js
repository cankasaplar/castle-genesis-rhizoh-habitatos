import { describe, expect, it } from "vitest";
import {
  listSpiralMMOContinentRouteEdgesV0,
  resolveSpiralMMOAwakeningRoutePairsV0,
  resolveSpiralMMOOrderPartnerIndexV0
} from "../spiralMMOContinentRouteGraphV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../spiralMMOContinentPinsV0.js";

describe("spiralMMOContinentRouteGraphV0", () => {
  it("defines a connected route mesh", () => {
    expect(listSpiralMMOContinentRouteEdgesV0().length).toBeGreaterThanOrEqual(10);
  });

  it("resolves directed route pairs for all edges", () => {
    const pins = listSpiralMMOContinentMapPinsV0();
    const pairs = resolveSpiralMMOAwakeningRoutePairsV0(0, pins);
    expect(pairs.length).toBe(listSpiralMMOContinentRouteEdgesV0().length * 2);
  });

  it("order partner index wraps on 7 continents", () => {
    expect(resolveSpiralMMOOrderPartnerIndexV0(0, 7)).toBe(3);
    expect(resolveSpiralMMOOrderPartnerIndexV0(5, 7)).toBe(1);
  });
});
