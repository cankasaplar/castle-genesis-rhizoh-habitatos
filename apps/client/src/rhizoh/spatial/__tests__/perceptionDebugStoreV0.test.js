import { describe, it, expect, beforeEach } from "vitest";
import {
  setPerceptionDebugSnapshotV0,
  getPerceptionDebugSnapshotV0,
  resetPerceptionDebugStoreForTestsV0
} from "../perceptionDebugStoreV0.js";
import { PERCEPTION_SIGNAL_SCHEMA_V0 } from "../perceptionSignalV0.js";

describe("perceptionDebugStoreV0", () => {
  beforeEach(() => {
    resetPerceptionDebugStoreForTestsV0();
  });

  it("stores snapshot without mutating signal object identity contract", () => {
    setPerceptionDebugSnapshotV0({
      schema: PERCEPTION_SIGNAL_SCHEMA_V0,
      cameraDriftFromOrigin: 0.4,
      anchorFieldDistortion: 0.2,
      fogMismatchDelta: 0.1
    });
    const s = getPerceptionDebugSnapshotV0();
    expect(s?.cameraDriftFromOrigin).toBe(0.4);
    expect(s?.recordedAtMs).toBeGreaterThan(0);
  });
});
