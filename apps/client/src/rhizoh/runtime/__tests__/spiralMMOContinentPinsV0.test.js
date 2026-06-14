import { describe, expect, it } from "vitest";
import {
  listSpiralMMOContinentMapPinsV0,
  RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0,
  SPIRAL_MMO_CONTINENT_IDS_V0,
  spiralMMOPinIconHtmlV0
} from "../spiralMMOContinentPinsV0.js";

describe("spiralMMOContinentPinsV0", () => {
  it("defines one pin per continent", () => {
    expect(SPIRAL_MMO_CONTINENT_IDS_V0).toHaveLength(7);
    expect(RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0).toHaveLength(7);
    expect(listSpiralMMOContinentMapPinsV0()).toHaveLength(7);
  });

  it("pins use spiralmmo type with continental anchors", () => {
    for (const pin of RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0) {
      expect(pin.type).toBe("spiralmmo");
      expect(pin.id).toMatch(/^spiralmmo_/);
      expect(Number.isFinite(pin.lat)).toBe(true);
      expect(Number.isFinite(pin.lon)).toBe(true);
      expect(pin.capabilities).toEqual([]);
    }
    expect(RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0.map((p) => p.continent).sort()).toEqual(
      [...SPIRAL_MMO_CONTINENT_IDS_V0].sort()
    );
  });

  it("renders monochrome inward-spiral neon pin html", () => {
    const pin = RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0[0];
    const html = spiralMMOPinIconHtmlV0(pin);
    expect(html).toContain('data-rhizoh-spiral-mmo-pin="');
    expect(html).toContain("rhizohSpiralMMOInV0");
    expect(html).toContain("rhizohSpiralMMOPulseV0");
    expect(html).toContain('stroke="#fff"');
    expect(html).toContain("background:#000");
    expect(html).toContain("SPIRAL·");
  });
});
