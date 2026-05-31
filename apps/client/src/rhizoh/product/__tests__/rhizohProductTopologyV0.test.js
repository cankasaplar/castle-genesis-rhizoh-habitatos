import { describe, expect, it } from "vitest";
import { resolveRhizohProductPathV0, RHIZOH_PRODUCT_TOPOLOGY_V0 } from "../rhizohProductTopologyV0.js";

describe("rhizohProductTopologyV0", () => {
  it("maps each product surface to a stable path", () => {
    expect(resolveRhizohProductPathV0("world")).toBe("/");
    expect(resolveRhizohProductPathV0("hall")).toBe("/hall/main");
    expect(resolveRhizohProductPathV0("greenroom")).toBe("/greenroom/main");
    expect(resolveRhizohProductPathV0("broadcast")).toBe("/broadcast/main");
    expect(resolveRhizohProductPathV0("studio")).toBe("/studio");
    expect(resolveRhizohProductPathV0("profile")).toBe("/settings");
  });

  it("exposes Turkish labels for shell tooltips", () => {
    expect(RHIZOH_PRODUCT_TOPOLOGY_V0.studio.labelTr).toMatch(/Stüdyo/i);
  });
});
