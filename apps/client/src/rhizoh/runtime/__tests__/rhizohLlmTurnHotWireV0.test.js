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

  it("does not use turn.fastAck phrase pool bypass", () => {
    const turn = prepareRhizohLlmTurnV0({
      message: "hello",
      voiceTurn: true,
      speakInstantAck: true,
      fastAck: "Tamam, dinliyorum."
    });
    expect(turn.turn?.fastAck).not.toBe("Tamam, dinliyorum.");
    expect(speakVoiceInstantAckV0).toHaveBeenCalled();
    const phrase = String(vi.mocked(speakVoiceInstantAckV0).mock.calls[0]?.[0] || "");
    expect(phrase).toMatch(/listening|moment|second/i);
    expect(phrase).not.toMatch(/dinliyorum/i);
  });
});
