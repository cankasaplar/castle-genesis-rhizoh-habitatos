import { describe, expect, it } from "vitest";
import {
  coerceRhizohUiReplyTextV0,
  materializeRhizohHudReplyFromNormalizedV0
} from "../rhizohLlmUiContractV0.js";

describe("rhizohLlmUiContractV0", () => {
  it("coerces nested reply objects to display text", () => {
    expect(coerceRhizohUiReplyTextV0({ reply: "Merhaba" })).toBe("Merhaba");
    expect(coerceRhizohUiReplyTextV0({ message: "Hi" })).toBe("Hi");
  });

  it("never returns [object Object]", () => {
    expect(coerceRhizohUiReplyTextV0({ foo: "bar" }, { fallback: "fallback" })).toBe("fallback");
  });

  it("materializes TEXT norm for HUD", () => {
    const hud = materializeRhizohHudReplyFromNormalizedV0(
      { type: "TEXT", payload: "Tamam, buradayım." },
      ""
    );
    expect(hud.text).toBe("Tamam, buradayım.");
    expect(hud.skipSpeech).toBe(false);
  });
});
