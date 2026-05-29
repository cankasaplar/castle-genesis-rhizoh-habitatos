import { describe, it, expect } from "vitest";
import { deriveShellHighlightId } from "../castleRuntimeShellModelV0.js";

describe("castleRuntimeShellModelV0", () => {
  it("maps demo surface to empty shell highlight", () => {
    expect(deriveShellHighlightId("/demo", { productSurface: "demo" })).toBe("");
  });

  it("maps world surface to world tab", () => {
    expect(deriveShellHighlightId("/map", { productSurface: "world" })).toBe("world");
  });

  it("uses pathname for core routes", () => {
    expect(deriveShellHighlightId("/spiral", { productSurface: "core" })).toBe("studio");
    expect(deriveShellHighlightId("/", { productSurface: "core" })).toBe("world");
  });
});
