import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import {
  prepareRhizohLlmTurnV0,
  buildRhizohLlmContextPatchFromPrepV0
} from "../rhizohLlmTurnHotWireV0.js";
import * as voiceInstantAck from "../voiceInstantAckV0.js";

describe("rhizohLlmTurnHotWireV0", () => {
  beforeEach(() => {
    resetClagGraphV0();
    vi.restoreAllMocks();
  });

  it("prepareRhizohLlmTurnV0 publishes speech-first expression", () => {
    const spy = vi.spyOn(voiceInstantAck, "speakVoiceInstantAckV0").mockReturnValue(true);
    const prep = prepareRhizohLlmTurnV0({
      traceId: "TRC-HW-1",
      message: "Merhaba",
      speakInstantAck: true
    });
    expect(prep.scheduling).toBe("speech_first");
    expect(prep.turn.expression.scheduling).toBe("speech_first");
    expect(window.__CASTLE_RHIZOH_HOT_SPEECH__).toBeTruthy();
    expect(spy).toHaveBeenCalled();
    const patch = buildRhizohLlmContextPatchFromPrepV0(prep);
    expect(patch.fastPath).toBe(true);
    expect(patch.speechSkeleton?.preCommit).toBe(true);
  });

  it("skips instant ack when speakInstantAck false", () => {
    const spy = vi.spyOn(voiceInstantAck, "speakVoiceInstantAckV0").mockReturnValue(true);
    prepareRhizohLlmTurnV0({
      message: "Kısa soru",
      speakInstantAck: false
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
