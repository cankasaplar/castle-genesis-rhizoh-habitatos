import { describe, it, expect } from "vitest";
import {
  readCastleAwarenessFieldV1,
  worldSignalFromAwarenessV1
} from "../castleAwarenessFieldV1.js";

describe("castleAwarenessFieldV1", () => {
  it("returns normalized awareness slices", () => {
    const a = readCastleAwarenessFieldV1();
    expect(a.schema).toBeTruthy();
    expect(a.weatherAwareness).toBeGreaterThanOrEqual(0);
    expect(a.trafficAwareness).toBeGreaterThanOrEqual(0);
    expect(a.sportsAwareness).toBeGreaterThanOrEqual(0);
    expect(a.newsAwareness).toBeGreaterThanOrEqual(0);
  });

  it("collapses slices into world feed without new attention axis", () => {
    const w = worldSignalFromAwarenessV1({
      weatherAwareness: 0.2,
      trafficAwareness: 0.65,
      sportsAwareness: 0.1,
      newsAwareness: 0.3
    });
    expect(w).toBe(0.65);
  });
});
