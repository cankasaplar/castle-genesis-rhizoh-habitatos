import { describe, expect, it, beforeEach } from "vitest";
import {
  matchesRecentRhizohTtsEchoV0,
  noteRecentRhizohTtsEchoV0,
  resetVoiceTtsEchoGuardForTestsV0
} from "../voiceTtsEchoGuardV0.js";
import { isSttPhantomPoliteClosureV0 } from "../voiceSttContaminationGuardV0.js";

describe("voiceTtsEchoGuardV0", () => {
  beforeEach(() => {
    resetVoiceTtsEchoGuardForTestsV0();
  });

  it("blocks STT that matches recent assistant TTS", () => {
    noteRecentRhizohTtsEchoV0("Merhaba. Buradayım.");
    expect(matchesRecentRhizohTtsEchoV0("Merhaba. Buradayım.").echo).toBe(true);
  });

  it("blocks partial echo overlap", () => {
    noteRecentRhizohTtsEchoV0("Duyamadım, mikrofonu biraz daha yakın konuşun.");
    expect(
      matchesRecentRhizohTtsEchoV0("Bir kusur duyamadım. Mikrofonu biraz daha yakın konuşun.").echo
    ).toBe(true);
  });

  it("allows unrelated user speech", () => {
    noteRecentRhizohTtsEchoV0("Merhaba.");
    expect(matchesRecentRhizohTtsEchoV0("Rhizoh trafik nasıl?").echo).toBe(false);
  });
});

describe("phantom polite with directed speech", () => {
  it("allows teşekkür ederim when mic energy indicates real speech", () => {
    expect(isSttPhantomPoliteClosureV0("Teşekkür ederim.", { maxRms: 0.18, speechMs: 500 })).toBe(
      false
    );
    expect(isSttPhantomPoliteClosureV0("Teşekkür ederim.", { maxRms: 0.04, speechMs: 200 })).toBe(
      true
    );
  });
});
