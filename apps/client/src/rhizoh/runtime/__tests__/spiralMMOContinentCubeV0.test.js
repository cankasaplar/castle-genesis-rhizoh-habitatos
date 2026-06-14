import { describe, expect, it } from "vitest";
import {
  listSpiralMMOContinentCubeIdsV0,
  resolveSpiralMMOContinentCubeV0
} from "../spiralMMOContinentCubeV0.js";
import { SPIRAL_MMO_CONTINENT_IDS_V0 } from "../spiralMMOContinentPinsV0.js";

describe("spiralMMOContinentCubeV0", () => {
  it("defines one cube profile per continent", () => {
    expect(listSpiralMMOContinentCubeIdsV0()).toHaveLength(SPIRAL_MMO_CONTINENT_IDS_V0.length);
  });

  it("resolves cube from node id", () => {
    const asia = resolveSpiralMMOContinentCubeV0("spiralmmo_asia");
    expect(asia.code).toBe("AS");
    expect(asia.accent).toBeTruthy();
    const eu = resolveSpiralMMOContinentCubeV0("europe");
    expect(eu.code).toBe("EU");
  });
});
