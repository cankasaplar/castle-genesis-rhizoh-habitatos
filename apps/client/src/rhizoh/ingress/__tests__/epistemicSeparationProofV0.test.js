import { describe, expect, it } from "vitest";
import { buildEpistemicSeparationProofV0 } from "../epistemicSeparationProofV0.js";

describe("epistemicSeparationProofV0", () => {
  it("assembles paper evidence with separation flags", () => {
    const proof = buildEpistemicSeparationProofV0({ locale: "en" });
    expect(proof.paperSpine.length).toBeGreaterThan(0);
    expect(proof.planes.causal.mutableByObserver).toBe(false);
    expect(proof.evidence.lens.isVertex).toBe(true);
    expect(proof.interpretationOnly).toBe(true);
  });
});
