import { describe, expect, it } from "vitest";
import {
  formatRhizohNeonCountdownMsV0,
  isRhizohNeonCountdownCompleteV0,
  resolveRhizohNeonCountdownRemainingMsV0,
  RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0
} from "../rhizohNeonCountdownV0.js";

describe("rhizohNeonCountdownV0", () => {
  it("uses 6:44 duration", () => {
    expect(RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0).toBe(404_000);
    expect(formatRhizohNeonCountdownMsV0(RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0)).toBe("06:44");
  });

  it("formats mm:ss with ceiling seconds", () => {
    expect(formatRhizohNeonCountdownMsV0(404_001)).toBe("06:45");
    expect(formatRhizohNeonCountdownMsV0(59_500)).toBe("01:00");
    expect(formatRhizohNeonCountdownMsV0(0)).toBe("00:00");
  });

  it("resolves remaining and completion", () => {
    const deadline = 1_000_000;
    expect(resolveRhizohNeonCountdownRemainingMsV0(deadline, 999_500)).toBe(500);
    expect(isRhizohNeonCountdownCompleteV0(0)).toBe(true);
    expect(isRhizohNeonCountdownCompleteV0(1)).toBe(false);
  });
});
