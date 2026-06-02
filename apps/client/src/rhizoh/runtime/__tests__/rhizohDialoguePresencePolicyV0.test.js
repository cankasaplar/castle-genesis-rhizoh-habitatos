import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  isQuietDialoguePresenceV0,
  isSpokenInstantAckEnabledV0,
  isSpokenShadowObservationAckEnabledV0,
  shouldSpeakInstantAckForTurnV0,
  shouldSpeakLocalCommandFeedbackV0
} from "../rhizohDialoguePresencePolicyV0.js";

describe("rhizohDialoguePresencePolicyV0", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to quiet (no spoken instant ack)", () => {
    expect(isSpokenInstantAckEnabledV0()).toBe(false);
    expect(isQuietDialoguePresenceV0()).toBe(true);
    expect(shouldSpeakInstantAckForTurnV0({})).toBe(false);
    expect(shouldSpeakInstantAckForTurnV0({ speakInstantAck: false })).toBe(false);
  });

  it("honors explicit speakInstantAck true", () => {
    expect(shouldSpeakInstantAckForTurnV0({ speakInstantAck: true })).toBe(true);
  });

  it("env can re-enable legacy spoken ack", () => {
    vi.stubEnv("VITE_RHIZOH_SPOKEN_INSTANT_ACK", "1");
    expect(isSpokenInstantAckEnabledV0()).toBe(true);
    expect(shouldSpeakInstantAckForTurnV0({})).toBe(true);
  });

  it("shadow observation ack is off unless env set", () => {
    expect(isSpokenShadowObservationAckEnabledV0()).toBe(false);
    vi.stubEnv("VITE_RHIZOH_VOICE_SHADOW_OBS_ACK", "true");
    expect(isSpokenShadowObservationAckEnabledV0()).toBe(true);
  });

  it("never speaks instant ack for COMMAND class", () => {
    expect(shouldSpeakInstantAckForTurnV0({ inputClass: "COMMAND" })).toBe(false);
  });

  it("local command speech is off unless env set", () => {
    expect(shouldSpeakLocalCommandFeedbackV0()).toBe(false);
    vi.stubEnv("VITE_RHIZOH_COMMAND_SPEECH", "1");
    expect(shouldSpeakLocalCommandFeedbackV0()).toBe(true);
    vi.unstubAllEnvs();
  });
});
