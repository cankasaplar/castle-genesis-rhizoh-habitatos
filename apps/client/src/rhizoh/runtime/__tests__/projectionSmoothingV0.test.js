import { describe, it, expect } from "vitest";
import { smoothProjectionHintsV0 } from "../projectionSmoothingV0.js";

const H = (fog, aura, meta, rgb = [0.5, 0.55, 0.6]) => ({
  fogDensity: fog,
  castleAuraIntensity: aura,
  castleMetabolicPulse: meta,
  ambientTint: { r: rgb[0], g: rgb[1], b: rgb[2] }
});

describe("projectionSmoothingV0", () => {
  it("first sample passes through", () => {
    const n = H(0.8, 0.7, 0.65);
    const s = smoothProjectionHintsV0(null, n);
    expect(s.fogDensity).toBe(n.fogDensity);
  });

  it("EMA pulls fog toward next but not instant jump", () => {
    const a = H(0.1, 0.4, 0.35);
    const b = H(0.9, 0.4, 0.35);
    const once = smoothProjectionHintsV0(a, b, { fogEmaAlpha: 0.25 });
    expect(once.fogDensity).toBeGreaterThan(a.fogDensity);
    expect(once.fogDensity).toBeLessThan(b.fogDensity);
  });
});
