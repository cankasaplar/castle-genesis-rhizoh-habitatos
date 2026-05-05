import { describe, expect, it } from "vitest";
import { computeSoulContinuityHash } from "../lib/soulHash";

describe("continuity hash determinism", () => {
  it("returns the same digest for the same soul material", () => {
    const parts = {
      mindUids: ["m-a", "m-b"],
      entityUids: ["e-1"],
      milestones: ["bootstrap:root", "owner-42"]
    };
    const a = computeSoulContinuityHash(parts);
    const b = computeSoulContinuityHash(parts);
    expect(a).toBe(b);
    expect(a.startsWith("c0-")).toBe(true);
  });
});
