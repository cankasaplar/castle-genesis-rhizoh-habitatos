import { describe, expect, it } from "vitest";
import {
  assertDriftOutputGuardsV0,
  assertDriftSuggestionDr01V0,
  assertDriftSuggestionDr02V0,
  INVARIANT_DR_01_LOOP_V0,
  INVARIANT_DR_02_ISOLATION_V0
} from "../driftSuggestionGuardsV0.js";

describe("driftSuggestionGuardsV0", () => {
  it("DR-01 rejects non-suggest execution class", () => {
    const guard = assertDriftSuggestionDr01V0({ executionClass: "mutate_l1" });
    expect(guard.ok).toBe(false);
    expect(guard.code).toBe(INVARIANT_DR_01_LOOP_V0);
  });

  it("DR-02 allows category + delta language", () => {
    const guard = assertDriftSuggestionDr02V0({
      suggestion: "sc_frequency_increased",
      executionClass: "suggest"
    });
    expect(guard.ok).toBe(true);
  });

  it("DR-02 rejects user-specific mutation suggestions", () => {
    const guard = assertDriftSuggestionDr02V0({
      suggestion: "user castle:u1 should be blocked",
      executionClass: "suggest"
    });
    expect(guard.ok).toBe(false);
    expect(guard.code).toBe(INVARIANT_DR_02_ISOLATION_V0);
  });

  it("DR-02 rejects cube mutation suggestions", () => {
    const guard = assertDriftSuggestionDr02V0({
      suggestion: "cube rank should decrease",
      executionClass: "suggest"
    });
    expect(guard.ok).toBe(false);
  });

  it("DR-02 rejects target fields on packet", () => {
    const guard = assertDriftSuggestionDr02V0({
      suggestion: "quota_stress_detected",
      targetUserId: "u1",
      executionClass: "suggest"
    });
    expect(guard.ok).toBe(false);
  });

  it("assertDriftOutputGuardsV0 applies both DR-01 and DR-02", () => {
    expect(() =>
      assertDriftOutputGuardsV0({
        suggestion: "quota_stress_detected",
        executionClass: "suggest"
      })
    ).not.toThrow();
  });
});
