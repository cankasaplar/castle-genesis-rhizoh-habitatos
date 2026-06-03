import { describe, expect, it, beforeEach } from "vitest";
import {
  deriveRhizohPresenceStateV0,
  noteFelFailureExpressionV0,
  resetFelFailureExpressionForTestV0,
  RHIZOH_ATTENTION_V0,
  RHIZOH_SILENCE_FORM_V0,
  RHIZOH_MEMORY_CONTINUITY_V0,
  RPSE_IDLE_USER_GAP_MS_V0
} from "../rhizohPresenceStateEngineV0.js";

describe("rhizohPresenceStateEngineV0", () => {
  beforeEach(() => {
    resetFelFailureExpressionForTestV0();
  });

  it("idle shell with no recent user → present + active_idle (not absent)", () => {
    const now = 100_000;
    const s = deriveRhizohPresenceStateV0({
      nowMs: now,
      shellMounted: true,
      lastUserActivityMs: now - RPSE_IDLE_USER_GAP_MS_V0 - 1000
    });
    expect(s.rhizoh_is_present).toBe(true);
    expect(s.rhizoh_attention).toBe(RHIZOH_ATTENTION_V0.IDLE);
    expect(s.silence_form).toBe(RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE);
  });

  it("recent user activity → partial attention", () => {
    const now = 50_000;
    const s = deriveRhizohPresenceStateV0({
      nowMs: now,
      lastUserActivityMs: now - 5000
    });
    expect(s.rhizoh_attention).toBe(RHIZOH_ATTENTION_V0.PARTIAL);
  });

  it("quarantine → absent", () => {
    const s = deriveRhizohPresenceStateV0({ quarantine: true });
    expect(s.rhizoh_is_present).toBe(false);
    expect(s.silence_form).toBe(RHIZOH_SILENCE_FORM_V0.ABSENT);
  });

  it("FEL note sets failure_narration temporarily without clearing present", () => {
    const now = 200_000;
    noteFelFailureExpressionV0({ reason: "unknown_band_hold", atMs: now });
    const s = deriveRhizohPresenceStateV0({ nowMs: now + 1000 });
    expect(s.rhizoh_is_present).toBe(true);
    expect(s.silence_form).toBe(RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION);
    const later = deriveRhizohPresenceStateV0({ nowMs: now + 20_000 });
    expect(later.silence_form).toBe(RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE);
  });

  it("returning user with anchor → strong memory continuity", () => {
    const s = deriveRhizohPresenceStateV0({
      returningUser: true,
      hasAnchor: true
    });
    expect(s.rhizoh_memory_continuity).toBe(RHIZOH_MEMORY_CONTINUITY_V0.STRONG);
  });
});
