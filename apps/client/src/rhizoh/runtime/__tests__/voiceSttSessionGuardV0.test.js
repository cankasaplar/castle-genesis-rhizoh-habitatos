import { describe, expect, it, vi, afterEach } from "vitest";
import {
  blockVoiceSttAutoRestartV0,
  canRequestVoiceSttAutoRestartV0,
  classifyEmptySttOnEndV0,
  clearVoiceSttAutoRestartBlockV0,
  isVoiceSttAutoRestartBlockedV0,
  probeVoiceSttStartPreconditionsV0,
  resetVoiceSttSessionGuardForTestV0,
  scoreSilentSttOnEndV0,
  VOICE_STT_SILENT_ABORT_COOLDOWN_MEDIUM_MS,
  VOICE_STT_SILENT_ABORT_COOLDOWN_MS
} from "../voiceSttSessionGuardV0.js";
import { stampVoiceUserGestureV0, resetVoiceUserGestureAnchorForTestV0 } from "../voiceUserGestureAnchorV0.js";

describe("voiceSttSessionGuardV0", () => {
  afterEach(() => {
    resetVoiceUserGestureAnchorForTestV0();
    resetVoiceSttSessionGuardForTestV0();
  });

  it("scores long silent session as high confidence", () => {
    const scored = scoreSilentSttOnEndV0({
      sessionDurationMs: 6000,
      gestureAgeMs: 8000,
      hadInterimActivity: false,
      audioState: "running"
    });
    expect(scored.confidence).toBe("high");
    expect(scored.cooldownMs).toBe(VOICE_STT_SILENT_ABORT_COOLDOWN_MS);
    expect(scored.shouldSoftRestart).toBe(false);
  });

  it("scores short session with interim as low confidence — soft restart", () => {
    const scored = scoreSilentSttOnEndV0({
      sessionDurationMs: 400,
      gestureAgeMs: 500,
      hadInterimActivity: true,
      lastSttError: "network",
      gatewayDegraded: true,
      audioState: "running"
    });
    expect(scored.confidence).toBe("low");
    expect(scored.cooldownMs).toBe(0);
    expect(scored.shouldSoftRestart).toBe(true);
  });

  it("scores medium confidence with short cooldown", () => {
    const scored = scoreSilentSttOnEndV0({
      sessionDurationMs: 2500,
      gestureAgeMs: 4000,
      hadInterimActivity: false,
      audioState: "running"
    });
    expect(scored.confidence).toBe("medium");
    expect(scored.cooldownMs).toBe(VOICE_STT_SILENT_ABORT_COOLDOWN_MEDIUM_MS);
    expect(scored.shouldSoftRestart).toBe(true);
  });

  it("classifies onend without onresult with silentEnd payload", () => {
    stampVoiceUserGestureV0("mic_button");
    const out = classifyEmptySttOnEndV0({
      pending: "",
      gotAnyResult: false,
      keepAlive: true,
      visibility: "visible",
      audioState: "running",
      sessionDurationMs: 6000,
      gestureAgeMs: 3000,
      hadInterimActivity: false
    });
    expect(out.reason).toBe("onend_without_onresult");
    expect(out.silentEnd?.type).toBe("silent_end");
    expect(out.silentEnd?.confidence).toBe("high");
  });

  it("allows onend_ambiguous soft restart context", () => {
    stampVoiceUserGestureV0("mic_button");
    const allowed = canRequestVoiceSttAutoRestartV0({
      context: "onend_ambiguous",
      keepAlive: true,
      lastSessionHadResult: true
    });
    expect(allowed.ok).toBe(true);
    expect(allowed.reason).toBe("onend_ambiguous");
  });

  it("silent abort cooldown blocks STT-context restart until manual clear", () => {
    vi.useFakeTimers();
    blockVoiceSttAutoRestartV0(10_000);
    expect(isVoiceSttAutoRestartBlockedV0()).toBe(true);
    const blocked = canRequestVoiceSttAutoRestartV0({
      context: "after_tts",
      keepAlive: true
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("silent_abort_cooldown");
    vi.advanceTimersByTime(10_001);
    clearVoiceSttAutoRestartBlockV0();
    const allowed = canRequestVoiceSttAutoRestartV0({
      context: "after_tts",
      keepAlive: true
    });
    expect(allowed.ok).toBe(true);
    vi.useRealTimers();
  });

  it("never auto-restarts from bare onend context", () => {
    stampVoiceUserGestureV0("mic_button");
    const out = canRequestVoiceSttAutoRestartV0({
      context: "onend",
      keepAlive: true
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("onend_silent_abort");
  });

  it("allows after_tts soft restart when gesture expired", () => {
    vi.useFakeTimers();
    stampVoiceUserGestureV0("mic_button");
    vi.advanceTimersByTime(31_000);
    const out = canRequestVoiceSttAutoRestartV0({
      context: "after_tts",
      keepAlive: true
    });
    expect(out.ok).toBe(true);
    expect(out.softDegrade).toBe(true);
    expect(out.reason).toBe("after_tts_gesture_soft");
    vi.useRealTimers();
  });

  it("allows v3 empty retry without prior result", () => {
    const out = canRequestVoiceSttAutoRestartV0({
      context: "v3_empty_retry",
      keepAlive: true,
      lastSessionHadResult: false
    });
    expect(out.ok).toBe(true);
    expect(out.reason).toBe("v3_empty_retry");
  });

  it("probe softGesture allows keepAlive restart path", () => {
    vi.useFakeTimers();
    stampVoiceUserGestureV0("mic_button");
    vi.advanceTimersByTime(31_000);
    const out = probeVoiceSttStartPreconditionsV0(null, { softGesture: true });
    expect(out.ok).toBe(true);
    expect(out.softDegrade).toBe(true);
    expect(out.reason).toBe("gesture_soft_degrade");
    vi.useRealTimers();
  });

  it("probe rejects hidden tab", () => {
    const prev = document.visibilityState;
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const out = probeVoiceSttStartPreconditionsV0(null);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: prev });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("tab_hidden");
  });
});
