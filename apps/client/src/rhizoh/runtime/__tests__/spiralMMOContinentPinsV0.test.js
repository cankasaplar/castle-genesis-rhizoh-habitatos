import { describe, expect, it } from "vitest";
import {
  buildSpiralMMOWhirlpoolPathV0,
  listSpiralMMOContinentMapPinsV0,
  resolveSpiralMMOContinentDisplayNameV0,
  RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0,
  RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0,
  SPIRAL_MMO_CONTINENT_IDS_V0,
  spiralMMOPinIconHtmlV0
} from "../spiralMMOContinentPinsV0.js";
import { deriveSpiralMMOContinentCubeMotionV0 } from "../spiralMMOContinentCubeMotionV0.js";

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

  it("renders closed spiral pin html per continent", () => {
    const pin = RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0[0];
    const html = spiralMMOPinIconHtmlV0(pin);
    expect(html).toContain('data-rhizoh-spiral-mmo-rev="closed-spiral-v0"');
    expect(html).toContain("animateTransform");
    expect(html).not.toContain("0644");
    expect(html).not.toContain("preserve-3d");
    const motion = deriveSpiralMMOContinentCubeMotionV0(pin);
    expect(html).toContain(motion.accent);
  });

  it("resolves continent display names for spiral pins", () => {
    expect(resolveSpiralMMOContinentDisplayNameV0("europe", "tr")).toBe("Avrupa");
    expect(resolveSpiralMMOContinentDisplayNameV0("spiralmmo_asia", "en")).toBe("Asia");
  });

  it("builds an inward whirlpool path from outer ring to center", () => {
    const { spiralOuterRadius } = RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0;
    const path = buildSpiralMMOWhirlpoolPathV0(19, 19);
    expect(path.startsWith("M")).toBe(true);
    expect(path.split("L").length).toBeGreaterThan(30);
    const nums = path.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    const xs = nums.filter((_, i) => i % 2 === 0);
    const maxR = Math.max(...xs.map((x, i) => Math.hypot(x - 19, nums[i * 2 + 1] - 19)));
    expect(maxR).toBeCloseTo(spiralOuterRadius, 0);
  });
});
