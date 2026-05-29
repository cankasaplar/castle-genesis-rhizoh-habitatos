import { describe, it, expect, beforeEach } from "vitest";
import { checkObservationLaneDriftV0, resetObservationLaneDriftForTestsV0 } from "../observationLaneDriftV0.js";

describe("observationLaneDriftV0", () => {
  beforeEach(() => {
    resetObservationLaneDriftForTestsV0();
  });

  it("allows same frameId with same lane repeatedly", () => {
    expect(checkObservationLaneDriftV0("rf_1", "owner").ok).toBe(true);
    expect(checkObservationLaneDriftV0("rf_1", "owner").ok).toBe(true);
  });

  it("flags drift when frameId re-used with different lane", () => {
    expect(checkObservationLaneDriftV0("rf_2", "guest").ok).toBe(true);
    const d = checkObservationLaneDriftV0("rf_2", "owner");
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.frameId).toBe("rf_2");
      expect(d.expectedLane).toBe("guest");
      expect(d.gotLane).toBe("owner");
    }
  });
});
