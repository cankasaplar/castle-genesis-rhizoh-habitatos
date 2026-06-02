import { describe, expect, it } from "vitest";
import { mergeSttUtteranceFragmentsV0 } from "../mergeSttUtteranceFragmentsV0.js";

describe("mergeSttUtteranceFragmentsV0", () => {
  it("merges greeting + short follow-up into single utterance", () => {
    const out = mergeSttUtteranceFragmentsV0("Günaydın Gryzor. Nasılsın?");
    expect(out).toContain("Günaydın Gryzor");
    expect(out).toContain("Nasılsın");
    expect(out).not.toMatch(/^Günaydın Gryzor\.\s+Nasılsın\?$/);
  });
});
