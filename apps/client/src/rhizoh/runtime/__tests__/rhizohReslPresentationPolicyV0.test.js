import { describe, expect, it, beforeEach } from "vitest";
import {
  resolveReslPresentationV0,
  shouldAllowFelChatV0
} from "../rhizohReslPresentationPolicyV0.js";
import {
  deriveRhizohPresenceStateV0,
  noteFelFailureExpressionV0,
  resetFelFailureExpressionForTestV0
} from "../rhizohPresenceStateEngineV0.js";

describe("rhizohReslPresentationPolicyV0", () => {
  beforeEach(() => {
    resetFelFailureExpressionForTestV0();
  });
  it("active_idle → continuity line, no FEL chat", () => {
    const p = deriveRhizohPresenceStateV0({
      nowMs: 1000,
      lastUserActivityMs: 100
    });
    const resl = resolveReslPresentationV0(p, { locale: "tr" });
    expect(resl.continuityLine).toContain("Rhizoh burada");
    expect(resl.showFelChat).toBe(false);
    expect(resl.orbModulation.breathe).toBe(true);
  });

  it("failure_narration allows FEL once when gap ok", () => {
    noteFelFailureExpressionV0({ reason: "unknown_band_hold", atMs: 4900 });
    const p = deriveRhizohPresenceStateV0({ nowMs: 5000, lastUserActivityMs: 4900 });
    const resl = resolveReslPresentationV0(p, { locale: "tr", lastFelChatAtMs: 0, nowMs: 5000 });
    expect(resl.showFelChat).toBe(true);
    expect(shouldAllowFelChatV0(resl, 0, 5000)).toBe(true);
    expect(shouldAllowFelChatV0(resl, 4000, 5000)).toBe(false);
  });

  it("throttles FEL when gap too short", () => {
    noteFelFailureExpressionV0({ reason: "x", atMs: 9900 });
    const p = deriveRhizohPresenceStateV0({ nowMs: 10_000, lastUserActivityMs: 9900 });
    const resl = resolveReslPresentationV0(p, { lastFelChatAtMs: 9500, nowMs: 10_000 });
    expect(resl.showFelChat).toBe(false);
  });

  it("listening attention → listening copy", () => {
    const p = deriveRhizohPresenceStateV0({
      nowMs: 2000,
      fieldState: "LISTENING",
      voiceListening: true
    });
    const resl = resolveReslPresentationV0(p, { locale: "en" });
    expect(resl.continuityLine).toMatch(/Listening/i);
    expect(resl.chatPlaceholderTone).toBe("listening");
  });
});
