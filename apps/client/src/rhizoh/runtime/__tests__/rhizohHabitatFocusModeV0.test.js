import { describe, expect, it } from "vitest";
import {
  HABITAT_FOCUS_MODE_V0,
  resolveRhizohHabitatFocusModeV0,
  resolveRhizohHabitatFocusVisualsV0
} from "../rhizohHabitatFocusModeV0.js";

describe("rhizohHabitatFocusModeV0", () => {
  it("prioritizes conversation when reply or draft is active", () => {
    expect(
      resolveRhizohHabitatFocusModeV0({
        fieldState: "IDLE",
        hasReply: true,
        worldMapTool: "globe"
      })
    ).toBe(HABITAT_FOCUS_MODE_V0.CONVERSATION);

    expect(
      resolveRhizohHabitatFocusModeV0({
        fieldState: "IDLE",
        hasDraft: "merhaba"
      })
    ).toBe(HABITAT_FOCUS_MODE_V0.CONVERSATION);
  });

  it("uses world mode for immersive map surfaces", () => {
    expect(
      resolveRhizohHabitatFocusModeV0({
        fieldState: "IDLE",
        productSurface: "world",
        realityMode: "REAL_MAP",
        worldMapTool: "globe"
      })
    ).toBe(HABITAT_FOCUS_MODE_V0.WORLD);
  });

  it("defaults to navigation when chat is idle", () => {
    expect(
      resolveRhizohHabitatFocusModeV0({
        fieldState: "IDLE",
        productSurface: "world",
        realityMode: "GLOBE",
        worldMapTool: "globe"
      })
    ).toBe(HABITAT_FOCUS_MODE_V0.NAVIGATION);
  });

  it("dims wheel and hides map strip in conversation visuals", () => {
    const v = resolveRhizohHabitatFocusVisualsV0(HABITAT_FOCUS_MODE_V0.CONVERSATION);
    expect(v.wheelOpacity).toBeLessThan(0.3);
    expect(v.showMapStrip).toBe(false);
    expect(v.chatZIndex).toBeGreaterThan(v.wheelZIndex);
    expect(v.octoHeightPx).toBeGreaterThan(100);
  });
});
