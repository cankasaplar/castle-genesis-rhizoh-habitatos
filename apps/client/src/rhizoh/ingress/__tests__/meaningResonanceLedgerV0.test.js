import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMeaningResonanceLedgerForTestV0,
  computeEpistemicWeightDecayV0,
  getMeaningResonanceLedgerSnapshotV0,
  recordMeaningResonanceV0,
  EPISTEMIC_WEIGHT_HALF_LIFE_MS_V0
} from "../meaningResonanceLedgerV0.js";

describe("meaningResonanceLedgerV0", () => {
  beforeEach(() => {
    clearMeaningResonanceLedgerForTestV0();
  });

  it("records co-occurrence without asserting structure or learning", () => {
    const record = recordMeaningResonanceV0({
      mapSignal: { type: "map_hover", target: "pin_42" },
      chessSignal: { type: "chess_open", target: "e4" },
      narrativeRelation: { from: "map:pin_42", to: "chess:e4", strength: 0.2 },
      temporalContinuity: 0.4,
      patternStability: 0.5,
      epistemicWeight: 0.2
    });

    expect(record.assertsStructure).toBe(false);
    expect(record.isTruth).toBe(false);
    expect(record.learns).toBe(false);
    expect(record.influencesCausalGraph).toBe(false);
    expect(record.influencesMap).toBe(false);
    expect(record.influencesChess).toBe(false);
    expect(record.influencesNarrative).toBe(false);
    expect(record.authority).toBe("soft");

    const snap = getMeaningResonanceLedgerSnapshotV0();
    expect(snap.count).toBe(1);
    expect(snap.authorityPolicy.causal).toBe("hard");
    expect(snap.authorityPolicy.identity).toBe("none");
  });

  it("decays epistemic weight over time", () => {
    const now = Date.now();
    const fresh = computeEpistemicWeightDecayV0(now, 0.3, now);
    const aged = computeEpistemicWeightDecayV0(
      now - EPISTEMIC_WEIGHT_HALF_LIFE_MS_V0,
      0.3,
      now
    );
    expect(fresh).toBe(0.3);
    expect(aged).toBeCloseTo(0.15, 2);
    expect(aged).toBeLessThan(fresh);
  });
});
