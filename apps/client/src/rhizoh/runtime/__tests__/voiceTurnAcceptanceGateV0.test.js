import { describe, expect, it } from "vitest";
import { evaluateVoiceTurnAcceptanceV0 } from "../voiceTurnAcceptanceGateV0.js";

describe("voiceTurnAcceptanceGateV0", () => {
  it("accepts text input path", () => {
    const out = evaluateVoiceTurnAcceptanceV0({ source: "text", text: "Merhaba" });
    expect(out.accepted).toBe(true);
    expect(out.reason).toBe("non_voice");
  });

  it("rejects whisper outro for mic_v3", () => {
    const out = evaluateVoiceTurnAcceptanceV0({
      source: "mic_v3",
      text: "İzlediğiniz için teşekkürler, hoşçakalın.",
      confidence: 0.55,
      strategy: "whisper_only"
    });
    expect(out.accepted).toBe(false);
    expect(out.reason).toBe("whisper_artifact");
  });

  it("accepts high confidence voice turn", () => {
    const out = evaluateVoiceTurnAcceptanceV0({
      source: "mic_v3",
      text: "Rhizoh bugün hava nasıl?",
      confidence: 0.78,
      strategy: "whisper_only",
      maxRms: 0.04
    });
    expect(out.accepted).toBe(true);
  });

  it("rejects barge_in artifact band", () => {
    const out = evaluateVoiceTurnAcceptanceV0({
      source: "barge_in",
      text: "bir sonraki tarifte",
      confidence: 0.5
    });
    expect(out.accepted).toBe(false);
  });
});
