import { describe, expect, it } from "vitest";
import {
  CASTLE_ARBITRATION_PRIORITY_STACK_V0,
  CASTLE_CSIL_THREAD_RULES_V0,
  getCastleArbitrationPriorityStackV0
} from "../castleMultiUserSocialRuntimeContractV0.js";

describe("castleMultiUserSocialRuntimeContractV0", () => {
  it("exposes arbitration priority in strict order", () => {
    expect(getCastleArbitrationPriorityStackV0()).toBe(CASTLE_ARBITRATION_PRIORITY_STACK_V0);
    expect([...CASTLE_ARBITRATION_PRIORITY_STACK_V0]).toEqual([
      "USER_HARD_EVENT",
      "RHIZOH_INITIATIVE",
      "TICK_DRIFT_AMBIENT"
    ]);
  });

  it("defines five CSIL thread rules", () => {
    expect(CASTLE_CSIL_THREAD_RULES_V0).toHaveLength(5);
    expect(CASTLE_CSIL_THREAD_RULES_V0[0].id).toMatch(/^CSIL_RULE_1/);
  });
});
