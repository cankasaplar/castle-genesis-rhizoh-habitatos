import { describe, it, expect, beforeEach } from "vitest";
import { runMatchBroadcastE2eVerifyV0 } from "../matchmakingBroadcastE2eVerifyV0.js";
import { clearMatchmakingTruthForTestV0 } from "../matchmakingTruthKernelV0.js";

describe("matchmakingBroadcastE2eVerifyV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
  });

  it("proves client B projects same fen as server commit", () => {
    const out = runMatchBroadcastE2eVerifyV0({ reset: true });
    expect(out.ok).toBe(true);
    expect(out.fenMatches).toBe(true);
    expect(out.projectionB.moveCount).toBeGreaterThanOrEqual(1);
  });
});
