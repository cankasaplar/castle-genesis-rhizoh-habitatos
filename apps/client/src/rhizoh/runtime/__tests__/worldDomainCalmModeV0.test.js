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

  it("isSpiralCountdownCalmVisualV0 true while countdown active", () => {
    resetRhizohNeonCountdownDeadlineV0(Date.now());
    expect(isSpiralCountdownCalmVisualV0()).toBe(true);
  });
});
