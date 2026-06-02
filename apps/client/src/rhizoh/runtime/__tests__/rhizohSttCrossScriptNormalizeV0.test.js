import { describe, expect, it } from "vitest";
import { normalizeSttCrossScriptForTurkishUiV0 } from "../rhizohSttCrossScriptNormalizeV0.js";

describe("rhizohSttCrossScriptNormalizeV0", () => {
  it("maps Arabic marhaba to merhaba and collapses repeats", () => {
    const out = normalizeSttCrossScriptForTurkishUiV0("مرحبا مرحبا مرحبا مرحبا");
    expect(out.remapped).toBe(true);
    expect(out.text).toBe("merhaba");
  });
});
