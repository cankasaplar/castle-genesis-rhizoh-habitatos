import { describe, expect, it } from "vitest";
import { compileEpistemicContextRailsFromSnapshotForLlmV0 } from "../epistemicContextRailsFromSnapshotV0.js";

describe("compileEpistemicContextRailsFromSnapshotForLlmV0", () => {
  it("orders the six mandatory rails sections", () => {
    const { railsText, railsMeta } = compileEpistemicContextRailsFromSnapshotForLlmV0({
      identityCompressionLine: "Rhizoh host.",
      socialMemoryRecall: { recallLines: ["Earlier as GUIDE."] },
      personaContinuity: {
        band: "HOST",
        directorBrief: "Host continuity · 3 ticks · strength 0.4",
        lastRuntimeRole: "GUIDE",
        socialModeEcho: "IDLE"
      },
      crossCastleBleedGuard: {
        identityIsolationDirective: "Keep castles separate.",
        memoryAttributionHint: "Do not merge remote castle biography.",
        bleedRisk01: 0.4
      },
      rhizohCastleRuntimeRole: "GUIDE",
      socialRuntimeV1: { mode: "IDLE", initiativeBudget01: 0.55, allowProactivePing: false }
    });
    const i1 = railsText.indexOf("1)");
    const i2 = railsText.indexOf("2)");
    const i3 = railsText.indexOf("3)");
    const i4 = railsText.indexOf("4)");
    const i5 = railsText.indexOf("5)");
    const i6 = railsText.indexOf("6)");
    expect(i1).toBeGreaterThan(-1);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
    expect(i4).toBeGreaterThan(i3);
    expect(i5).toBeGreaterThan(i4);
    expect(i6).toBeGreaterThan(i5);
    expect(railsText).toContain("Rhizoh host");
    expect(railsText).toContain("Earlier as GUIDE");
    expect(railsText).toContain("Host continuity");
    expect(railsText).toContain("Keep castles separate");
    expect(railsText).toContain("Do not merge remote castle biography");
    expect(railsText).toContain("GUIDE");
    expect(railsText).toContain("Initiative budget");
    expect(railsMeta?.memoryAttributionPresent).toBe(true);
    expect(railsMeta?.initiativeBudget01).toBe(0.55);
  });
});
