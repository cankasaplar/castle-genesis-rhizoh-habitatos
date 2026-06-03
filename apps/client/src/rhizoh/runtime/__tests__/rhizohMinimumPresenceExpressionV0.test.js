import { describe, expect, it } from "vitest";
import {
  buildMvicHudReplyV0,
  resolveMvicPresenceIntensityV0,
  resolveMvicV0,
  MVIC_PRESENCE_MODE_V0
} from "../rhizohMinimumPresenceExpressionV0.js";

describe("rhizohMinimumPresenceExpressionV0", () => {
  it("maps unknown_band_hold to deterministic TR primary", () => {
    const m = resolveMvicV0({ reason: "unknown_band_hold", locale: "tr" });
    expect(m.mvicId).toBe("mvic.unknown_band_hold");
    expect(m.text).toContain("Buradayım");
    expect(m.presenceMode).toBe(MVIC_PRESENCE_MODE_V0.ACKNOWLEDGE);
  });

  it("maps whisper_default_conf to TR uncertainty phrase", () => {
    const m = resolveMvicV0({ reason: "whisper_default_conf", locale: "tr-TR" });
    expect(m.mvicId).toBe("mvic.whisper_default_conf");
    expect(m.text).toMatch(/Seni duydum/);
  });

  it("maps strict_hold_suppressed with never TTS policy", () => {
    const m = resolveMvicV0({ reason: "strict_hold_suppressed", locale: "en" });
    expect(m.mvicId).toBe("mvic.strict_hold_suppressed");
    expect(m.text).toMatch(/I'm here/);
    expect(m.ttsPolicy).toBe("never");
    expect(m.presenceMode).toBe(MVIC_PRESENCE_MODE_V0.LISTENING);
  });

  it("uses STT_DISPATCH_BLOCKED event when reason is secondary", () => {
    const m = resolveMvicV0({
      reason: "unknown_band_hold",
      eventTag: "STT_DISPATCH_BLOCKED",
      locale: "tr"
    });
    expect(m.lookupReason).toBe("unknown_band_hold");
    expect(m.text).toContain("Buradayım");
  });

  it("falls back to STT_DISPATCH_BLOCKED catalog via event tag only", () => {
    const m = resolveMvicV0({ eventTag: "STT_DISPATCH_BLOCKED", locale: "en" });
    expect(m.mvicId).toBe("mvic.stt_dispatch_blocked");
    expect(m.text).toMatch(/heard you/i);
  });

  it("buildMvicHudReplyV0 exposes chat source and intensity", () => {
    const hud = buildMvicHudReplyV0({
      reason: "strict_hold_suppressed",
      locale: "tr",
      returningUser: true
    });
    expect(hud.source).toBe("mvic");
    expect(hud.text.length).toBeGreaterThan(12);
    expect(hud.intensity).toBeGreaterThan(0.6);
    expect(hud.meta.reason).toBe("strict_hold_suppressed");
  });

  it("resolveMvicPresenceIntensityV0 boosts returning user without exceeding 1", () => {
    const base = resolveMvicPresenceIntensityV0({ baseIntensity: 0.62, presenceMode: "listening" });
    const boosted = resolveMvicPresenceIntensityV0({
      baseIntensity: 0.62,
      presenceMode: "listening",
      returningUser: true,
      relationshipTier: 2
    });
    expect(boosted).toBeGreaterThan(base);
    expect(boosted).toBeLessThanOrEqual(1);
  });

  it("is stable for same sessionId and reason", () => {
    const a = resolveMvicV0({ reason: "unknown_band_hold", locale: "tr", sessionId: "s1" });
    const b = resolveMvicV0({ reason: "unknown_band_hold", locale: "tr", sessionId: "s1" });
    expect(a.text).toBe(b.text);
  });
});
