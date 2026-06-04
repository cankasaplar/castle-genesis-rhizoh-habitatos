import { describe, expect, it } from "vitest";
import {
  captureWorldObservationSnapshotV0,
  normalizeWorldObservationSnapshotExtraV0
} from "../worldObservationObservabilityV0.js";

describe("normalizeWorldObservationSnapshotExtraV0", () => {
  it("maps string arg to meta.label (not char indices)", () => {
    expect(normalizeWorldObservationSnapshotExtraV0("A_SYNC")).toEqual({
      meta: { label: "A_SYNC" }
    });
  });

  it("hoists label and laptop into meta", () => {
    expect(normalizeWorldObservationSnapshotExtraV0({ label: "b1", laptop: "A" })).toEqual({
      meta: { label: "b1", laptop: "A" }
    });
  });

  it("captureWorldObservationSnapshotV0 keeps label under meta only", () => {
    const snap = captureWorldObservationSnapshotV0("A_SYNC");
    expect(snap.meta?.label).toBe("A_SYNC");
    expect(snap[0]).toBeUndefined();
  });
});
