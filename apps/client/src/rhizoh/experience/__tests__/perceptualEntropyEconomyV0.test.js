import { describe, it, expect, beforeEach } from "vitest";
import {
  readEntropyEconomyStateV0,
  spendEntropyWithEconomyV0,
  applyEntropyRechargeV0,
  computeAttentionDecayV0,
  clearEntropyEconomyForTestV0
} from "../perceptualEntropyEconomyV0.js";
import { WORLD_MUTATION_ACTION_V0 } from "../worldMutationFeedbackV0.js";

const SELF = "self_test_economy";
const SESSION = "wi_economy_session";

describe("perceptualEntropyEconomyV0", () => {
  beforeEach(() => {
    clearEntropyEconomyForTestV0(SELF, SESSION);
  });

  it("recharges entropy over time", () => {
    const recharged = applyEntropyRechargeV0({
      spent: 0.8,
      lastUpdatedAtMs: Date.now() - 3 * 60 * 60 * 1000
    });
    expect(recharged.spent).toBeLessThan(0.8);
    expect(recharged.rechargedAmount).toBeGreaterThan(0.1);
  });

  it("fatigue increases cost and attention decays with burst", () => {
    let fatigue = 0;
    for (let i = 0; i < 4; i += 1) {
      const spend = spendEntropyWithEconomyV0({
        selfSignature: SELF,
        sessionIdentity: SESSION,
        action: WORLD_MUTATION_ACTION_V0.OBSERVE
      });
      expect(spend.allowed).toBe(true);
      fatigue = spend.state.sessionFatigue;
    }
    expect(fatigue).toBeGreaterThan(0.3);
    const attention = computeAttentionDecayV0(
      { actionCount: 4, lastActionAtMs: Date.now() },
      fatigue
    );
    expect(attention).toBeLessThan(0.85);
  });

  it("blocks when budget exhausted", () => {
    while (true) {
      const spend = spendEntropyWithEconomyV0({
        selfSignature: SELF,
        sessionIdentity: SESSION,
        action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE
      });
      if (!spend.allowed) break;
    }
    const blocked = spendEntropyWithEconomyV0({
      selfSignature: SELF,
      sessionIdentity: SESSION,
      action: WORLD_MUTATION_ACTION_V0.OBSERVE
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.feedbackLine).toMatch(/Dikkat|entropy/i);
  });
});
