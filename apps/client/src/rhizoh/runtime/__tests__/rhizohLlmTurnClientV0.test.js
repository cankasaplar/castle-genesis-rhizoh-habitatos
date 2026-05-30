import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { postRhizohLlmTurnV0 } from "../rhizohLlmTurnClientV0.js";
import * as voiceInstantAck from "../voiceInstantAckV0.js";

describe("rhizohLlmTurnClientV0", () => {
  beforeEach(() => {
    resetClagGraphV0();
    vi.restoreAllMocks();
    vi.spyOn(voiceInstantAck, "speakVoiceInstantAckV0").mockReturnValue(true);
  });

  it("returns empty_message when text blank", async () => {
    const out = await postRhizohLlmTurnV0({ message: "   ", speakInstantAck: false });
    expect(out.ok).toBe(false);
    expect(out.error).toBe("empty_message");
  });

  it("attaches fast speech patch in POST body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Tamam.", traceId: "TRC-1" })
    });
    vi.stubEnv("VITE_GATEWAY_HTTP", "http://localhost:8090/rhizoh/llm");

    const out = await postRhizohLlmTurnV0({
      message: "Merhaba",
      fetchImpl: fetchMock,
      speakInstantAck: false
    });

    expect(out.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.context.continuity.runtime.rhizohFastSpeech.scheduling).toBe("speech_first");
    expect(body.context.rhizohExpression.scheduling).toBe("speech_first");
  });
});
