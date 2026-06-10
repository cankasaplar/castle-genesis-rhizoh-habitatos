import { describe, it, expect } from "vitest";
import {
  FOX_ATTENTION_AXIS_COUNT_V1,
  FOX_ATTENTION_AXIS_KEYS_V1,
  validateFoxAttentionFieldAxesV1
} from "../foxAxisPolicyV1.js";

describe("foxAxisPolicyV1", () => {
  it("freezes attention axis count at 5", () => {
    expect(FOX_ATTENTION_AXIS_COUNT_V1).toBe(5);
    expect(FOX_ATTENTION_AXIS_KEYS_V1).toEqual([
      "userSignal",
      "continuitySignal",
      "emotionalSignal",
      "noveltySignal",
      "worldSignal"
    ]);
  });

  it("rejects extra attention axes", () => {
    const bad = validateFoxAttentionFieldAxesV1({
      userSignal: 0.2,
      calendarSignal: 0.9
    });
    expect(bad.valid).toBe(false);
    expect(bad.extraAxes).toContain("calendarSignal");
  });
});
