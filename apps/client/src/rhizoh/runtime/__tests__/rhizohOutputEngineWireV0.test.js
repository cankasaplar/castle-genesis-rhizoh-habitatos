import { describe, expect, it } from "vitest";
import { ensureRhizohOutputEngineDevToolsV0 } from "../rhizohOutputEngineWireV0.js";

describe("rhizohOutputEngineWireV0", () => {
  it("exposes outputPack on window.__rhizoh", () => {
    const fn = ensureRhizohOutputEngineDevToolsV0();
    expect(typeof fn).toBe("function");
    const pack = fn({ locale: "en" });
    expect(pack.programs).toHaveLength(2);
    expect(typeof window.__rhizoh.copyOutputPack).toBe("function");
    expect(typeof window.__rhizoh.exportOutputPackJson).toBe("function");
  });
});
