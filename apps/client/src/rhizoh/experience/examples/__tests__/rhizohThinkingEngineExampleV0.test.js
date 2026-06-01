import { describe, expect, it } from "vitest";
import {
  resolveMorphTargetsV0,
  resolveStabilizedTargetsV0
} from "../rhizohThinkingEngineExampleV0.js";

describe("rhizohThinkingEngineExampleV0", () => {
  it("raises twist for reasoning words", () => {
    const t = resolveMorphTargetsV0("neden böyle");
    expect(t.twist).toBeGreaterThan(0.5);
  });

  it("stabilizes toward lower entropy", () => {
    const s = resolveStabilizedTargetsV0({
      twist: 2,
      fold: 0.8,
      entropy: 1.5,
      tension: 0.5,
      clarity: 1.5
    });
    expect(s.entropy).toBeLessThan(1.5);
    expect(s.tension).toBe(0);
  });
});
