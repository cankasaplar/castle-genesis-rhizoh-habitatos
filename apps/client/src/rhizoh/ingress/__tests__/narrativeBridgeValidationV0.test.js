import { describe, expect, it } from "vitest";
import {
  bridgeValidateV0,
  computePatternStabilityV0,
  computeTemporalContinuityV0,
  containsIntentInferenceV0,
  writesToSourceGraphsV0
} from "../narrativeBridgeValidationV0.js";

const STABLE_ENTRIES = [
  { type: "map_hover", target: "pin_42", ts: 1_000_000 },
  { type: "map_hover", target: "pin_42", ts: 1_030_000 },
  { type: "map_hover", target: "pin_42", ts: 1_090_000 },
  { type: "chess_open", target: "e4", ts: 1_050_000 },
  { type: "chess_open", target: "e4", ts: 1_120_000 }
];

describe("narrativeBridgeValidationV0", () => {
  it("rejects intent inference (non-agentic closure)", () => {
    expect(
      containsIntentInferenceV0({ description: "User wanted to explore the region" })
    ).toBe(true);
    expect(containsIntentInferenceV0({ description: "Repeated map hover cluster" })).toBe(false);
  });

  it("rejects feedback writes (bidirectional non-entanglement)", () => {
    expect(writesToSourceGraphsV0({ influencesCausalGraph: true })).toBe(true);
    expect(writesToSourceGraphsV0({ influencesCausalGraph: false })).toBe(false);
  });

  it("requires pattern stability and temporal continuity", () => {
    const key = "map_hover:pin_42";
    expect(computePatternStabilityV0(STABLE_ENTRIES, key)).toBeGreaterThanOrEqual(0.35);
    expect(computeTemporalContinuityV0(STABLE_ENTRIES, key)).toBeGreaterThanOrEqual(0.28);
  });

  it("passes bridge gate for stable co-occurrence without agency", () => {
    const result = bridgeValidateV0({
      mapEvent: { type: "map_hover", target: "pin_42" },
      chessEvent: { type: "chess_open", target: "e4" },
      narrativeEdge: {
        from: "map:pin_42",
        to: "chess:e4",
        strength: 0.2,
        description: "weak correlation between map attention and chess opening pattern"
      },
      observerEntries: STABLE_ENTRIES
    });
    expect(result.passed).toBe(true);
    expect(result.axioms.non_agentic_closure).toBe(true);
    expect(result.axioms.bidirectional_non_entanglement).toBe(true);
  });

  it("rejects single-event noise (causal invariance)", () => {
    const result = bridgeValidateV0({
      mapEvent: { type: "map_hover", target: "pin_99" },
      narrativeEdge: {
        from: "map:pin_99",
        to: "narrative",
        description: "one-off hover"
      },
      observerEntries: [{ type: "map_hover", target: "pin_99", ts: Date.now() }]
    });
    expect(result.passed).toBe(false);
    expect(result.axioms.causal_invariance).toBe(false);
  });
});
