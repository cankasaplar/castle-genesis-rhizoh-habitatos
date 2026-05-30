import { describe, expect, it } from "vitest";
import { compressIdentityToCharacterLineV0 } from "../identityCompressionV0.js";

describe("compressIdentityToCharacterLineV0", () => {
  it("returns a single Turkish sentence for host band", () => {
    const line = compressIdentityToCharacterLineV0(
      { band: "HOST", ticksInBand: 4, continuityStrength01: 0.55, socialModeEcho: "HOST" },
      "GUIDE",
      { locale: "tr" }
    );
    expect(line.length).toBeGreaterThan(12);
    expect(line).toContain("Rhizoh");
    expect(line.split(/[.!?]/).filter(Boolean).length).toBeLessThanOrEqual(2);
  });
});
