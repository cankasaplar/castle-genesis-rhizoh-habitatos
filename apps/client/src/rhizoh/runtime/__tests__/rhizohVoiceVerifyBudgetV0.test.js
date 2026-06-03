import { describe, expect, it, beforeEach } from "vitest";
import {
  getVoiceVerifyCountV0,
  isVoiceVerifyBudgetExhaustedV0,
  noteVoiceVerifyAttemptV0,
  VOICE_VERIFY_BUDGET_MAX_PER_SESSION_V0,
  __resetVoiceVerifyBudgetForTestV0
} from "../rhizohVoiceVerifyBudgetV0.js";

describe("rhizohVoiceVerifyBudgetV0", () => {
  beforeEach(() => {
    __resetVoiceVerifyBudgetForTestV0();
  });

  it("exhausts after max verify attempts per session", () => {
    const sid = "v3_test";
    expect(isVoiceVerifyBudgetExhaustedV0(sid)).toBe(false);
    noteVoiceVerifyAttemptV0(sid);
    noteVoiceVerifyAttemptV0(sid);
    expect(getVoiceVerifyCountV0(sid)).toBe(VOICE_VERIFY_BUDGET_MAX_PER_SESSION_V0);
    expect(isVoiceVerifyBudgetExhaustedV0(sid)).toBe(true);
  });
});
