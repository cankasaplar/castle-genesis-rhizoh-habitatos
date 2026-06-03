import { describe, expect, it, beforeEach } from "vitest";
import {
  resolveTransitionFeelV0,
  resolveTransitionFeelFromPresenceV0,
  resetReslTransitionSemanticsForTestV0
} from "../rhizohReslTransitionSemanticsV0.js";
import { RHIZOH_SILENCE_FORM_V0 } from "../rhizohPresenceStateEngineV0.js";

describe("rhizohReslTransitionSemanticsV0", () => {
  beforeEach(() => {
    resetReslTransitionSemanticsForTestV0();
  });

  it("FEL to active_idle uses long fade and fel dampen", () => {
    const feel = resolveTransitionFeelV0(
      RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION,
      RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE,
      "idle"
    );
    expect(feel.durationMs).toBeGreaterThanOrEqual(480);
    expect(feel.felDampen01).toBeGreaterThan(0.8);
    expect(feel.reEngagePulse).toBe(true);
  });

  it("active_idle to listening uses re-engage pulse", () => {
    const feel = resolveTransitionFeelV0(
      RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE,
      RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD,
      "listening"
    );
    expect(feel.reEngagePulse).toBe(true);
    expect(feel.delayMs).toBeGreaterThan(0);
  });

  it("tracks prev form across publish sequence", () => {
    const a = resolveTransitionFeelFromPresenceV0(RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE, "idle");
    expect(a.durationMs).toBeGreaterThan(0);
    const b = resolveTransitionFeelFromPresenceV0(
      RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION,
      "partial"
    );
    expect(b.felDampen01).toBeGreaterThan(0);
  });
});
