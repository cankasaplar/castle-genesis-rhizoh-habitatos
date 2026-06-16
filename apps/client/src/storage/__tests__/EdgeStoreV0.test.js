import { describe, expect, it } from "vitest";
import { deriveEdgeIdV0 } from "../EdgeStoreV0.js";

describe("EdgeStoreV0", () => {
  it("deriveEdgeIdV0 builds stable edge key", () => {
    expect(deriveEdgeIdV0("Europe", "Japan")).toBe("Europe→Japan");
  });
});
