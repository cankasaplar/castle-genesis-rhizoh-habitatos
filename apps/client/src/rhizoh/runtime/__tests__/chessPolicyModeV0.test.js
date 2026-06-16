import { describe, expect, it } from "vitest";
import {
  CHESS_POLICY_MODE_V0,
  normalizeChessPolicyModeV0,
  resolveRhizohChessEngineParamsV0
} from "../chessPolicyModeV0.js";

describe("chessPolicyModeV0", () => {
  it("normalizes policy modes", () => {
    expect(normalizeChessPolicyModeV0("aggressive")).toBe(CHESS_POLICY_MODE_V0.AGGRESSIVE);
    expect(normalizeChessPolicyModeV0("safe")).toBe(CHESS_POLICY_MODE_V0.SAFE);
    expect(normalizeChessPolicyModeV0("")).toBe(CHESS_POLICY_MODE_V0.BALANCED);
  });

  it("aggressive boosts contempt when winning", () => {
    const aggressive = resolveRhizohChessEngineParamsV0({
      baseSkill: 10,
      materialLead: 4,
      isCheck: false,
      policyMode: CHESS_POLICY_MODE_V0.AGGRESSIVE
    });
    const safe = resolveRhizohChessEngineParamsV0({
      baseSkill: 10,
      materialLead: 4,
      isCheck: false,
      policyMode: CHESS_POLICY_MODE_V0.SAFE
    });
    expect(aggressive.contempt).toBeGreaterThan(safe.contempt);
    expect(aggressive.skill).toBeGreaterThan(safe.skill);
    expect(aggressive.winning).toBe(true);
  });
});
