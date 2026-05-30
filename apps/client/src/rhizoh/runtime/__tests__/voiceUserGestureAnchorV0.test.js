import { describe, expect, it, vi, afterEach } from "vitest";
import {
  canRestartVoiceSttV0,
  computeVoiceGestureStrengthV0,
  GESTURE_DECAY_FULL_MS,
  GESTURE_DECAY_MANUAL_MS,
  GESTURE_DECAY_PARTIAL_MS,
  getVoiceGestureAdvisoryV0,
  getVoiceGestureTrustV0,
  hasActiveVoiceUserGestureV0,
  stampVoiceUserGestureV0,
  resetVoiceUserGestureAnchorForTestV0
} from "../voiceUserGestureAnchorV0.js";

describe("voiceUserGestureAnchorV0 decay curve", () => {
  afterEach(() => {
    resetVoiceUserGestureAnchorForTestV0();
    vi.useRealTimers();
  });

  it("full trust within 5s", () => {
    vi.useFakeTimers();
    stampVoiceUserGestureV0("mic_button");
    vi.advanceTimersByTime(4000);
    const trust = getVoiceGestureTrustV0();
    expect(trust.level).toBe("full");
    expect(trust.strength).toBe(1);
    expect(hasActiveVoiceUserGestureV0()).toBe(true);
    expect(canRestartVoiceSttV0()).toBe(true);
  });

  it("partial advisory band still has active gesture authority", () => {
    vi.useFakeTimers();
    stampVoiceUserGestureV0("mic_button");
    vi.advanceTimersByTime(10_000);
    const trust = getVoiceGestureTrustV0();
    expect(trust.level).toBe("partial");
    expect(hasActiveVoiceUserGestureV0()).toBe(true);
    expect(canRestartVoiceSttV0()).toBe(true);
    const advisory = getVoiceGestureAdvisoryV0();
    expect(advisory.hintKey).toBe("gesture_soft_rebind");
  });

  it("manual_confirm advisory band still has active gesture authority", () => {
    vi.useFakeTimers();
    stampVoiceUserGestureV0("mic_button");
    vi.advanceTimersByTime(20_000);
    const trust = getVoiceGestureTrustV0();
    expect(trust.level).toBe("manual_confirm");
    expect(trust.needsManualConfirm).toBe(false);
    expect(hasActiveVoiceUserGestureV0()).toBe(true);
    expect(canRestartVoiceSttV0()).toBe(true);
  });

  it("expired after 30s — gesture authority lost", () => {
    vi.useFakeTimers();
    stampVoiceUserGestureV0("mic_button");
    vi.advanceTimersByTime(GESTURE_DECAY_MANUAL_MS + 1);
    const trust = getVoiceGestureTrustV0();
    expect(trust.level).toBe("expired");
    expect(hasActiveVoiceUserGestureV0()).toBe(false);
    expect(canRestartVoiceSttV0()).toBe(false);
    expect(getVoiceGestureAdvisoryV0().hintKey).toBe("gesture_rebind");
  });

  it("strength monotonic decay across bands", () => {
    expect(computeVoiceGestureStrengthV0(0)).toBe(1);
    expect(computeVoiceGestureStrengthV0(GESTURE_DECAY_FULL_MS + 1)).toBeLessThan(1);
    expect(computeVoiceGestureStrengthV0(GESTURE_DECAY_PARTIAL_MS + 1)).toBeLessThan(
      computeVoiceGestureStrengthV0(GESTURE_DECAY_FULL_MS + 1)
    );
    expect(computeVoiceGestureStrengthV0(GESTURE_DECAY_MANUAL_MS)).toBe(0);
  });
});
