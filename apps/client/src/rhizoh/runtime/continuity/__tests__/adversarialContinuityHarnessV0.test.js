import { describe, it, expect } from "vitest";
import { runAdversarialContinuitySuiteV0 } from "../adversarialContinuityHarnessV0.js";
import { createInMemoryContinuityAdapterV0 } from "./inMemoryContinuityAdapterV0.js";
import { assertNextReplayTickV0 } from "../replayApplyOrderGuardV0.js";
import { REPLAY_CORRUPTION_BREACH_V0 } from "../replayCorruptionTaxonomyV0.js";

describe("adversarialContinuityHarnessV0", () => {
  it("runs steril suite against in-memory adapter (test-only backend)", async () => {
    const report = await runAdversarialContinuitySuiteV0((diskKey) => createInMemoryContinuityAdapterV0(diskKey));
    expect(report.allPassed).toBe(true);
    expect(report.passCount).toBe(report.total);
  });

  it("blocks out-of-order replay tick", () => {
    const r = assertNextReplayTickV0(103, 105);
    expect(r.ok).toBe(false);
    expect(r.code).toBe("replay_order_violation");
  });

  it("taxonomy includes 7 breach classes", () => {
    expect(Object.keys(REPLAY_CORRUPTION_BREACH_V0).length).toBe(7);
  });
});
