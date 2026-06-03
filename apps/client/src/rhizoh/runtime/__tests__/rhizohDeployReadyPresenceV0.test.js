import { describe, expect, it } from "vitest";
import {
  evaluateVoiceEntryGateV0,
  resolveT0ZeroFramePresenceV0
} from "../rhizohDeployReadyPresenceV0.js";
import { deriveRhizohPresenceStateV0 } from "../rhizohPresenceStateEngineV0.js";

describe("rhizohDeployReadyPresenceV0", () => {
  it("zero frame policy never returns empty strip", () => {
    const z = resolveT0ZeroFramePresenceV0({ continuityLine: null, presenceBadge: null, localeTr: true });
    expect(z.continuityLine).toContain("Rhizoh");
    expect(z.presenceBadge?.label).toBeTruthy();
    expect(z.zero_frame_applied).toBe(true);
  });

  it("voice entry blocks until voice ready and presence present", () => {
    const p = deriveRhizohPresenceStateV0({
      shellMounted: true,
      nowMs: 1000,
      lastUserActivityMs: 990
    });
    const blocked = evaluateVoiceEntryGateV0({
      voiceReady: false,
      presence: p,
      firstPaintOk: true
    });
    expect(blocked.allow_listen).toBe(false);
    expect(blocked.reason).toBe("voice_not_ready");

    const ok = evaluateVoiceEntryGateV0({
      voiceReady: true,
      voiceAdapterReady: true,
      presence: p,
      firstPaintOk: true
    });
    expect(ok.allow_listen).toBe(true);
  });
});
