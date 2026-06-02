import { describe, expect, it, vi, beforeEach } from "vitest";
import { prepareRhizohLlmTurnV0 } from "../rhizohLlmTurnHotWireV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

vi.mock("../voiceInstantAckV0.js", () => ({
  markVoiceTurnDispatchV0: vi.fn(),
  speakVoiceInstantAckV0: vi.fn()
}));

import { speakVoiceInstantAckV0 } from "../voiceInstantAckV0.js";

describe("rhizohLlmTurnHotWireV0 fast-path ack", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
    vi.mocked(speakVoiceInstantAckV0).mockClear();
  });

  it("does not speak instant ack by default (quiet presence)", () => {
    const turn = prepareRhizohLlmTurnV0({
      message: "hello",
      voiceTurn: true,
      fastAck: "Tamam, dinliyorum."
    });
    expect(turn.turn?.fastAck).not.toBe("Tamam, dinliyorum.");
    expect(speakVoiceInstantAckV0).not.toHaveBeenCalled();
    expect(turn.ackSpoken).toBe(false);
  });

  it("speaks instant ack when explicitly requested", () => {
    vi.stubEnv("VITE_RHIZOH_SPOKEN_INSTANT_ACK", "1");
    prepareRhizohLlmTurnV0({
      message: "hello",
      voiceTurn: true,
      speakInstantAck: true
    });
    expect(speakVoiceInstantAckV0).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
