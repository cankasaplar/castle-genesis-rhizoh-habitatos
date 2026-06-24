import { describe, expect, it } from "vitest";
import { ensureRhizohStudioDemoSeedDevToolsV0 } from "../rhizohStudioDemoSeedWireV0.js";

describe("rhizohStudioDemoSeedWireV0", () => {
  it("exposes studioDemoSeed on window.__rhizoh", () => {
    const fn = ensureRhizohStudioDemoSeedDevToolsV0();
    expect(typeof fn).toBe("function");
    const out = fn({ locale: "en" });
    expect(out.lifeOsStatus).toBe("ACHIEVED");
  });
});
