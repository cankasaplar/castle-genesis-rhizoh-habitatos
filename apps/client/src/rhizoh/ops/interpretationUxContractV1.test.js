import { describe, it, expect } from "vitest";
import {
  INTERPRETATION_UX_CONTRACT_V1,
  LAYER_VISUAL_RANK_V1,
  STATE_LAYER_V1,
  shouldCollapseDerivedByDefaultV1
} from "./interpretationUxContractV1.js";

describe("interpretationUxContractV1 client", () => {
  it("narrative visual rank below raw", () => {
    expect(LAYER_VISUAL_RANK_V1.narrative_sub_block).toBeLessThan(LAYER_VISUAL_RANK_V1[STATE_LAYER_V1.RAW]);
    expect(LAYER_VISUAL_RANK_V1[STATE_LAYER_V1.DERIVED]).toBeLessThan(LAYER_VISUAL_RANK_V1[STATE_LAYER_V1.RAW]);
  });

  it("defaults collapse derived", () => {
    expect(shouldCollapseDerivedByDefaultV1({ displayRules: { collapseDerivedByDefault: true } })).toBe(true);
    expect(shouldCollapseDerivedByDefaultV1(INTERPRETATION_UX_CONTRACT_V1)).toBe(true);
  });
});
