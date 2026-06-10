import { describe, expect, it, beforeEach } from "vitest";
import {
  scaffoldShadowTurnV0,
  getShadowTurnSnapshotV0,
  __resetShadowTurnScaffoldForTestV0
} from "../rhizohShadowTurnScaffoldV0.js";

describe("rhizohShadowTurnScaffoldV0", () => {
  beforeEach(() => {
    __resetShadowTurnScaffoldForTestV0();
  });

  it("creates shadow turn with continuity even when not accepted", () => {
    const shadow = scaffoldShadowTurnV0({
      text: "biraz konuşalım mı",
      confidence: 0.41,
      band: "unknown",
      accepted: false,
      source: "mic_v3"
    });
    expect(shadow).toBeTruthy();
    expect(shadow.usableForContinuity).toBe(true);
    expect(shadow.memoryStrength).toBeGreaterThan(0);
    expect(shadow.memoryStrength).toBeLessThan(0.5);
    expect(getShadowTurnSnapshotV0().count).toBe(1);
  });

  it("raises memory strength when accepted", () => {
    const shadow = scaffoldShadowTurnV0({
      text: "bugün ne yapıyoruz",
      confidence: 0.72,
      band: "directed_candidate",
      accepted: true
    });
    expect(shadow.memoryStrength).toBeGreaterThan(0.5);
  });
});
