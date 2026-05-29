import { describe, expect, it } from "vitest";
import {
  evaluatePostGoLiveIntegrityV0,
  isMonotonicNonDecreasingV0,
  SYSTEM_STATE_V0
} from "../postGoLiveIntegrityLoopV0.js";

describe("postGoLiveIntegrityLoopV0", () => {
  it("isMonotonicNonDecreasingV0 detects regression", () => {
    expect(isMonotonicNonDecreasingV0([1, 2, 3])).toBe(true);
    expect(isMonotonicNonDecreasingV0([1, 3, 2])).toBe(false);
  });

  it("LIVE_OK when all checks pass", () => {
    const r = evaluatePostGoLiveIntegrityV0({
      eventSeqs: [1, 2, 3],
      derivedTracePresent: true,
      nodeHeartbeats: [{ nodeId: "node:a", lastSeenMs: Date.now() }],
      expectedGuardianNodes: 1
    });
    expect(r.system_state).toBe(SYSTEM_STATE_V0.LIVE_OK);
  });

  it("QUARANTINE when two or more checks fail", () => {
    const r = evaluatePostGoLiveIntegrityV0({
      eventSeqs: [3, 1],
      orphanNarrativeDetected: true,
      nodeHeartbeats: [],
      expectedGuardianNodes: 3
    });
    expect(r.system_state).toBe(SYSTEM_STATE_V0.QUARANTINE);
  });
});
