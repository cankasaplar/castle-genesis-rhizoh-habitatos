import { describe, expect, it, beforeEach } from "vitest";
import { clearObserverTraceForTestV0, observeV0 } from "../observerReadOnlyHookV0.js";
import { measureEpistemicResonanceFieldV0 } from "../epistemicResonanceFieldV0.js";

describe("epistemicResonanceFieldV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
  });

  it("measures without influencing system", () => {
    observeV0({
      type: "map_hover",
      target: "origin_home_serencebey",
      meta: { surface: "map", focus: 0.6 }
    });

    const field = measureEpistemicResonanceFieldV0({ locale: "en" });
    expect(field.measurementOnly).toBe(true);
    expect(field.isCoupling).toBe(false);
    expect(field.influencesCausalGraph).toBe(false);
    expect(field.influencesNarrative).toBe(false);
    expect(field.measurements.length).toBeGreaterThan(0);
  });
});
