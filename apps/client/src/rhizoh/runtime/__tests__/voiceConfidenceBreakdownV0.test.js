import { describe, expect, it } from "vitest";
import { buildVoiceConfidenceBreakdownV0 } from "../voiceConfidenceBreakdownV0.js";

describe("voiceConfidenceBreakdownV0", () => {
  it("exposes whisper, semantic, attention, and final confidence", () => {
    const b = buildVoiceConfidenceBreakdownV0(
      { confidence: 0.55, directedScore: 2, ambientScore: 0, band: "directed_candidate" },
      { confidence: 0.55, band: "directed_candidate", reason: "voice_ok" }
    );
    expect(b.whisperConfidence).toBe(0.55);
    expect(b.semanticConfidence).toBeGreaterThan(0.7);
    expect(b.attentionConfidence).toBeGreaterThan(0);
    expect(b.finalConfidence).toBeGreaterThan(0.55);
  });
});
