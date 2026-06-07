import { describe, expect, it } from "vitest";
import { ASSETS, STUDIO_ASSET_MANIFEST_V1 } from "../assetRegistryV1.js";

describe("assetRegistryV1", () => {
  it("defines stage and ambient paths", () => {
    expect(ASSETS.rhizoh).toBe("/models/rh-glowing-energy-figure.glb");
    expect(ASSETS.octo).toBe("/models/octo-blue-ringed.glb");
    expect(ASSETS.ambient.fox).toMatch(/^\/models\//);
  });

  it("manifest covers five GLBs", () => {
    expect(STUDIO_ASSET_MANIFEST_V1).toHaveLength(5);
    expect(STUDIO_ASSET_MANIFEST_V1.filter((e) => e.layer === "stage")).toHaveLength(2);
    expect(STUDIO_ASSET_MANIFEST_V1.filter((e) => e.layer === "ambient")).toHaveLength(3);
  });
});
