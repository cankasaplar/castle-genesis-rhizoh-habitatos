import { describe, expect, it, beforeEach } from "vitest";
import {
  COHERENCE_ACTIVITY_V1,
  __resetTemporalCoherenceForTestV1,
  getTemporalCoherenceV1,
  updateTemporalCoherenceV1
} from "../castleTemporalCoherenceV1.js";

describe("castleTemporalCoherenceV1", () => {
  beforeEach(() => {
    __resetTemporalCoherenceForTestV1();
  });

  it("tracks co_watch when youtube dominates field", () => {
    const c = updateTemporalCoherenceV1({
      field: { dominantSource: "youtube", graphTickId: 3 },
      atMs: 5000
    });
    expect(c.activity).toBe(COHERENCE_ACTIVITY_V1.CO_WATCH);
    expect(c.label).toContain("youtube");
  });

  it("preserves sinceMs across same activity updates", () => {
    updateTemporalCoherenceV1({
      field: { dominantSource: "file" },
      mode: "ambient_observer",
      atMs: 1000
    });
    const c2 = updateTemporalCoherenceV1({
      field: { dominantSource: "file" },
      mode: "ambient_observer",
      atMs: 3000
    });
    expect(c2.sinceMs).toBe(1000);
    expect(getTemporalCoherenceV1()?.activity).toBe(COHERENCE_ACTIVITY_V1.AUDIOBOOK);
  });
});
