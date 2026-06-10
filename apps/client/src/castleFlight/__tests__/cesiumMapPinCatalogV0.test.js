import { describe, expect, it, beforeEach } from "vitest";
import {
  getCesiumMapPinSpecV0,
  resolvePinTypeForEcosystemCategoryV0
} from "../cesiumMapPinCatalogV0.js";
import {
  clearCesiumMapPinCanvasCacheForTestsV0,
  createCesiumMapPinCanvasV0
} from "../cesiumMapBillboardV0.js";

describe("cesiumMapPinCatalogV0", () => {
  beforeEach(() => {
    clearCesiumMapPinCanvasCacheForTestsV0();
  });

  it("maps ecosystem categories to visual pin types", () => {
    expect(resolvePinTypeForEcosystemCategoryV0("academy")).toBe("academy");
    expect(resolvePinTypeForEcosystemCategoryV0("sound_stage")).toBe("event");
    expect(resolvePinTypeForEcosystemCategoryV0("culture_portal")).toBe("culture");
  });

  it("pin specs differ between beacon and ghost (canvas needs browser)", () => {
    const castle = getCesiumMapPinSpecV0("core_beacon");
    const ghost = getCesiumMapPinSpecV0("ghost");
    expect(castle.pathD).not.toBe(ghost.pathD);
    expect(ghost.pulse).toBe(true);
    if (typeof document !== "undefined" && document.createElement("canvas").getContext("2d")) {
      const a = createCesiumMapPinCanvasV0({ pinType: "core_beacon" });
      const b = createCesiumMapPinCanvasV0({ pinType: "ghost" });
      expect(a).not.toBe(b);
    }
  });

  it("exposes archive-aligned ghost pin spec", () => {
    const spec = getCesiumMapPinSpecV0("ghost");
    expect(spec.color).toBe("#ef4444");
    expect(spec.pulse).toBe(true);
    expect(spec.pathD).toContain("M12 2");
  });
});
