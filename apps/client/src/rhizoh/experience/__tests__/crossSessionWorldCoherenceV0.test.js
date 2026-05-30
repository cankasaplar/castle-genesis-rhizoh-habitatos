import { describe, it, expect, beforeEach } from "vitest";
import {
  sealCrossSessionCoherenceAnchorV0,
  readCrossSessionCoherenceAnchorV0,
  hydrateCrossSessionCoherenceV0,
  clearCrossSessionCoherenceForTestV0,
  COHERENCE_BLEND_STRENGTH_V0
} from "../crossSessionWorldCoherenceV0.js";
import {
  recordWorldMutationV0,
  readWorldMutationLedgerV0,
  clearWorldMutationForTestV0,
  WORLD_MUTATION_ACTION_V0
} from "../worldMutationFeedbackV0.js";

const WI = "wi_cross_session";

describe("crossSessionWorldCoherenceV0", () => {
  beforeEach(() => {
    clearCrossSessionCoherenceForTestV0(WI);
    clearWorldMutationForTestV0(WI);
  });

  it("seals anchor to localStorage and hydrates toward it after long gap", () => {
    recordWorldMutationV0({ worldInstanceId: WI, action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE });
    const anchor = sealCrossSessionCoherenceAnchorV0(WI);
    expect(anchor?.castleAffinity).toBeGreaterThan(0.1);
    expect(readCrossSessionCoherenceAnchorV0(WI)?.worldInstanceId).toBe(WI);

    clearWorldMutationForTestV0(WI);

    const hydrated = hydrateCrossSessionCoherenceV0({
      worldInstanceId: WI,
      lastVisitGapMs: 4 * 24 * 60 * 60 * 1000,
      returning: true
    });
    expect(hydrated.hydrated).toBe(true);
    const ledger = readWorldMutationLedgerV0(WI);
    expect(ledger.castleAffinity).toBeCloseTo((anchor?.castleAffinity ?? 0) * COHERENCE_BLEND_STRENGTH_V0, 1);
    expect(hydrated.coherenceLine).toMatch(/tanıdık|benzer/i);
  });
});
