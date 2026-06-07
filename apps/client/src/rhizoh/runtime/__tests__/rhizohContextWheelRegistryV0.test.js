import { describe, expect, it } from "vitest";
import { resolveRhizohContextWheelPackV0 } from "../rhizohContextWheelRegistryV0.js";
import { RHIZOH_LAYER_MODE_V0 } from "../rhizohLayerContextV0.js";

describe("rhizohContextWheelRegistryV0", () => {
  it("returns empty pack for t0_live", () => {
    const pack = resolveRhizohContextWheelPackV0(RHIZOH_LAYER_MODE_V0.T0_LIVE, "tr");
    expect(pack.nodes).toHaveLength(0);
  });

  it("isolates map nodes from social nodes", () => {
    const map = resolveRhizohContextWheelPackV0(RHIZOH_LAYER_MODE_V0.MAPS_SPACE, "tr");
    const social = resolveRhizohContextWheelPackV0(RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL, "tr");
    expect(map.nodes.some((n) => n.id === "zoom_in")).toBe(true);
    expect(social.nodes.some((n) => n.id === "invite")).toBe(true);
    expect(map.nodes.some((n) => n.id === "invite")).toBe(false);
    expect(social.nodes.some((n) => n.id === "zoom_in")).toBe(false);
  });

  it("hydrates robotics wheel separately from spiral", () => {
    const robotics = resolveRhizohContextWheelPackV0(RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS, "en");
    const spiral = resolveRhizohContextWheelPackV0(RHIZOH_LAYER_MODE_V0.MODE_SPIRAL, "en");
    expect(robotics.nodes.some((n) => n.id === "autonomy")).toBe(true);
    expect(spiral.nodes.some((n) => n.id === "time_speed")).toBe(true);
    expect(robotics.hideLibrary).toBe(true);
    expect(robotics.nodes.some((n) => n.id === "time_speed")).toBe(false);
  });
});
