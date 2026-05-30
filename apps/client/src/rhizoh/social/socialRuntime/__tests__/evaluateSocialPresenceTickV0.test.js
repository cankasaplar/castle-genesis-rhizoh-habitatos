import { describe, expect, it } from "vitest";
import { evaluateSocialPresenceTickV0 } from "../evaluateSocialPresenceTickV0.js";
import { SOCIAL_MODE_V0 } from "../socialModeStateMachineV0.js";

describe("evaluateSocialPresenceTickV0", () => {
  it("idle + long silence → aware nudge + ambient ping when budget high", () => {
    const s = evaluateSocialPresenceTickV0({
      nowMs: 1_000_000,
      silenceMs: 35_000,
      mode: SOCIAL_MODE_V0.IDLE,
      initiativeBudget01: 0.55
    });
    expect(s.silenceLevel).toBe("LONG");
    expect(s.nextMode).toBe(SOCIAL_MODE_V0.AWARE);
    expect(s.shouldAmbientPing).toBe(true);
  });

  it("does not ambient-ping when initiative is low", () => {
    const s = evaluateSocialPresenceTickV0({
      silenceMs: 35_000,
      mode: SOCIAL_MODE_V0.IDLE,
      initiativeBudget01: 0.45
    });
    expect(s.shouldAmbientPing).toBe(false);
  });

  it("mid silence + high initiative upgrades toward SOCIAL_ACTIVE", () => {
    const s = evaluateSocialPresenceTickV0({
      silenceMs: 15_000,
      mode: SOCIAL_MODE_V0.AWARE,
      initiativeBudget01: 0.65
    });
    expect(s.silenceLevel).toBe("MID");
    expect(s.nextMode).toBe(SOCIAL_MODE_V0.SOCIAL_ACTIVE);
  });

  it("skips mode nudges for HOST", () => {
    const s = evaluateSocialPresenceTickV0({
      silenceMs: 60_000,
      mode: SOCIAL_MODE_V0.HOST,
      initiativeBudget01: 0.9
    });
    expect(s.nextMode).toBe(null);
    expect(s.shouldAmbientPing).toBe(false);
  });
});
