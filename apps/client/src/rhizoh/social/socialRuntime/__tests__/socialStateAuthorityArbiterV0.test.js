import { describe, expect, it } from "vitest";
import {
  applySocialArbiterEventV0,
  applySocialArbiterTickV0,
  SOCIAL_ARB_EVENT_AUTHORITY_MS,
  SOCIAL_ARB_INITIATIVE_BLEND_GAMMA,
  socialAuthorityTickBlend01,
  socialAuthorityInitiativeScale01
} from "../socialStateAuthorityArbiterV0.js";
import { SOCIAL_MODE_V0 } from "../socialModeStateMachineV0.js";

describe("socialAuthorityTickBlend01", () => {
  it("ramps linearly inside the window", () => {
    expect(socialAuthorityTickBlend01(0)).toBe(0);
    expect(socialAuthorityTickBlend01(3000)).toBe(0.5);
    expect(socialAuthorityTickBlend01(SOCIAL_ARB_EVENT_AUTHORITY_MS)).toBe(1);
  });
});

describe("socialAuthorityInitiativeScale01", () => {
  it("is steeper than linear for mid-blend when gamma < 1", () => {
    const b = 0.5;
    const scale = socialAuthorityInitiativeScale01(b);
    expect(scale).toBeGreaterThan(b);
    expect(scale).toBeCloseTo(b ** SOCIAL_ARB_INITIATIVE_BLEND_GAMMA, 5);
  });
});

describe("socialStateAuthorityArbiterV0", () => {
  it("event path bumps initiative and stamps hard event", () => {
    const r = applySocialArbiterEventV0({
      nowMs: 5000,
      prevSr: { mode: SOCIAL_MODE_V0.IDLE, initiativeBudget01: 0.4 }
    });
    expect(r.skipPersistence).toBe(false);
    expect(r.nextSr.initiativeBudget01).toBe(0.45);
    expect(r.nextSr.socialAuthorityLastHardEventAt).toBe(5000);
    expect(r.nextSr.socialAuthoritySource).toBe("event");
  });

  it("inside authority window: gradient uses initiative curve (not raw blend)", () => {
    const msSince = 1000;
    const blend = socialAuthorityTickBlend01(msSince);
    const initiativeScale01 = socialAuthorityInitiativeScale01(blend);
    const r = applySocialArbiterTickV0({
      nowMs: SOCIAL_ARB_EVENT_AUTHORITY_MS,
      silenceMs: 40_000,
      msSinceHardEvent: msSince,
      prevSr: {
        mode: SOCIAL_MODE_V0.IDLE,
        initiativeBudget01: 0.55,
        socialAuthorityLastHardEventAt: SOCIAL_ARB_EVENT_AUTHORITY_MS - msSince
      }
    });
    expect(r.arbiter.authorityPhase).toBe("gradient");
    expect(r.arbiter.initiativeScale01).toBe(initiativeScale01);
    expect(r.didModeChange).toBe(false);
    expect(r.shouldEmitAmbientPing).toBe(false);
    expect(r.nextSr.mode).toBe(SOCIAL_MODE_V0.IDLE);
    expect(r.arbiter.blend01).toBe(blend);
    expect(r.skipPersistence).toBe(false);
    const scaled = -0.006 * initiativeScale01;
    expect(r.nextSr.initiativeBudget01).toBe(Math.round((0.55 + scaled) * 1000) / 1000);
    expect(r.nextSr.socialAuthoritySource).toBe("tick_gradient");
  });

  it("gradient persists when scaled initiative crosses rounding threshold", () => {
    const r = applySocialArbiterTickV0({
      nowMs: 10_000,
      silenceMs: 40_000,
      msSinceHardEvent: 4000,
      prevSr: { mode: SOCIAL_MODE_V0.IDLE, initiativeBudget01: 0.552 }
    });
    expect(r.arbiter.authorityPhase).toBe("gradient");
    expect(r.skipPersistence).toBe(false);
    expect(r.nextSr.socialAuthoritySource).toBe("tick_gradient");
    expect(r.nextSr.mode).toBe(SOCIAL_MODE_V0.IDLE);
    expect(r.shouldEmitAmbientPing).toBe(false);
  });

  it("tick applies fully when outside hard window", () => {
    const r = applySocialArbiterTickV0({
      nowMs: 100_000,
      silenceMs: 40_000,
      msSinceHardEvent: SOCIAL_ARB_EVENT_AUTHORITY_MS + 500,
      prevSr: { mode: SOCIAL_MODE_V0.IDLE, initiativeBudget01: 0.55 }
    });
    expect(r.skipPersistence).toBe(false);
    expect(r.arbiter.authorityPhase).toBe("open");
    expect(r.nextSr.mode).toBe(SOCIAL_MODE_V0.AWARE);
    expect(r.shouldEmitAmbientPing).toBe(true);
  });
});
