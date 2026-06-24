import { describe, expect, it } from "vitest";
import { ensureRhizohStudioVisibilityDevToolsV0 } from "../rhizohStudioVisibilityWireV0.js";

describe("rhizohStudioVisibilityWireV0", () => {
  it("exposes studioVisibility on window.__rhizoh", () => {
    const fn = ensureRhizohStudioVisibilityDevToolsV0();
    expect(typeof fn).toBe("function");
    const snap = fn();
    expect(snap.schema).toContain("studio_visibility");
    expect(snap.interpretationOnly).toBe(true);
  });
});
