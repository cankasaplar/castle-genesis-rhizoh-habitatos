import { describe, expect, it } from "vitest";
import { resolveRhizohLlmMaxTokensV0 } from "../rhizohLlmMaxTokensV0.js";

describe("rhizohLlmMaxTokensV0", () => {
  it("keeps FAST_DIALOGUE cap for short voice turns", () => {
    expect(
      resolveRhizohLlmMaxTokensV0({
        generationMode: "FAST_DIALOGUE",
        voiceTurn: true,
        userMessageChars: 40
      })
    ).toBe(120);
  });

  it("raises cap for long voice monologue", () => {
    expect(
      resolveRhizohLlmMaxTokensV0({
        generationMode: "FAST_DIALOGUE",
        voiceTurn: true,
        userMessageChars: 600
      })
    ).toBeGreaterThanOrEqual(640);
  });

  it("does not scale text-only STANDARD", () => {
    expect(
      resolveRhizohLlmMaxTokensV0({
        generationMode: "STANDARD",
        voiceTurn: false,
        userMessageChars: 900
      })
    ).toBe(320);
  });
});
