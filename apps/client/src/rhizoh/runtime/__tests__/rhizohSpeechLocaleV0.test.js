import { describe, expect, it } from "vitest";
import { resolveSpeechBcp47ForUiLocaleV0 } from "../rhizohSpeechLocaleV0.js";

describe("rhizohSpeechLocaleV0", () => {
  it("maps en UI locale to en-US BCP-47", () => {
    expect(resolveSpeechBcp47ForUiLocaleV0("en")).toBe("en-US");
  });

  it("maps tr UI locale to tr-TR BCP-47", () => {
    expect(resolveSpeechBcp47ForUiLocaleV0("tr")).toBe("tr-TR");
  });
});
