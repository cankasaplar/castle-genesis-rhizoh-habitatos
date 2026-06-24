import { describe, expect, it } from "vitest";
import { buildRhizohWorldSportsObservationShortCaptureV0 } from "../rhizohWorldSportsObservationShortCaptureV0.js";

describe("rhizohWorldSportsObservationShortCaptureV0", () => {
  it("builds 50s shot list with four beats", () => {
    const cap = buildRhizohWorldSportsObservationShortCaptureV0({ locale: "en" });
    expect(cap.shotList).toHaveLength(4);
    expect(cap.durationSecTarget).toBe(50);
    expect(cap.shotList.reduce((s, b) => s + b.durationSec, 0)).toBe(50);
  });
});
