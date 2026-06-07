import { describe, expect, it } from "vitest";
import {
  COGNITIVE_DOMINANT_COLORS_V1,
  resolveSpeakingCrystalColorV1
} from "../octoCognitiveGeometryCompilerV1.js";

describe("octoSpeakingCrystalV1", () => {
  it("returns default cyan when draft empty", () => {
    const c = resolveSpeakingCrystalColorV1("");
    expect(c.base).toBe(COGNITIVE_DOMINANT_COLORS_V1.NEUTRAL.base);
  });

  it("shifts palette as draft text grows", () => {
    const short = resolveSpeakingCrystalColorV1("a");
    const longer = resolveSpeakingCrystalColorV1("merhaba rhizoh kristal speaking design");
    expect(longer.base).not.toBe(short.base);
    expect(longer.phase).toBeGreaterThan(short.phase);
  });

  it("locks distinct emissive for octo tint", () => {
    const c = resolveSpeakingCrystalColorV1("test", { words: 4, activation: 0.5 });
    expect(c.emissive).toBeTruthy();
    expect(c.accent).toBeTruthy();
  });
});
