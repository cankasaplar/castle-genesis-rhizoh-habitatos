import { describe, expect, it, beforeEach } from "vitest";
import {
  observeMutualFamiliarityV0,
  resetMutualFamiliarityFieldForTestV0
} from "../rhizohMutualFamiliarityFieldV0.js";

describe("rhizohMutualFamiliarityFieldV0", () => {
  beforeEach(() => resetMutualFamiliarityFieldForTestV0());

  it("increases familiarity score on repeated same habit key", () => {
    const meta = {
      atMs: Date.UTC(2026, 4, 30, 18, 10),
      band: "unknown",
      strategy: "whisper_only",
      lat: 41.01,
      lon: 28.98
    };
    const a = observeMutualFamiliarityV0(meta);
    const b = observeMutualFamiliarityV0(meta);
    expect(b.familiarityScore).toBeGreaterThan(a.familiarityScore);
    expect(b.habitMemory.visitCount).toBe(2);
  });
});
