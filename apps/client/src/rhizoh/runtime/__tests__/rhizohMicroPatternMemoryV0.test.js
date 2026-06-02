import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMicroPatternMemoryForTestV0,
  pickMicroReplyWithMemoryV0,
  recordMicroReplyPatternV0
} from "../rhizohMicroPatternMemoryV0.js";

describe("rhizohMicroPatternMemoryV0", () => {
  beforeEach(() => {
    clearMicroPatternMemoryForTestV0();
  });

  it("records and reuses reply text", () => {
    recordMicroReplyPatternV0("greeting", "tr", "Buradayım.");
    const a = pickMicroReplyWithMemoryV0("greeting", "tr", ["Merhaba.", "Buradayım."]);
    recordMicroReplyPatternV0("greeting", "tr", "Buradayım.");
    const b = pickMicroReplyWithMemoryV0("greeting", "tr", ["Merhaba.", "Buradayım."]);
    expect(a).toBe("Buradayım.");
    expect(b).toBe("Buradayım.");
  });
});
