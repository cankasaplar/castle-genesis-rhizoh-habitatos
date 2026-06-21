import { describe, expect, it } from "vitest";
import {
  isSpiralCountdownCalmVisualV0,
  resolveWorldEntryMapToolV0
} from "../worldDomainCalmModeV0.js";
import { resetRhizohNeonCountdownDeadlineV0 } from "../rhizohNeonCountdownV0.js";

describe("worldDomainCalmModeV0", () => {
  it("resolveWorldEntryMapToolV0 prefers streets during legal calm", () => {
    expect(resolveWorldEntryMapToolV0("city_map", false)).toBe("city_map");
  });

  it("resolveWorldEntryMapToolV0 preserves explicit satellite selection", () => {
    expect(resolveWorldEntryMapToolV0("satellite", false)).toBe("satellite");
    expect(resolveWorldEntryMapToolV0("streets", false)).toBe("streets");
  });

  it("isSpiralCountdownCalmVisualV0 true while countdown active", () => {
    resetRhizohNeonCountdownDeadlineV0(Date.now());
    expect(isSpiralCountdownCalmVisualV0()).toBe(true);
  });
});
