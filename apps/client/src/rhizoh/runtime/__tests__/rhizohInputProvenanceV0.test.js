import { describe, expect, it } from "vitest";
import {
  buildInputProvenanceEnvelopeV0,
  isMicDerivedSourceV0,
  RHIZOH_INPUT_SOURCE_V0,
  validateMicIntentProvenanceV0
} from "../rhizohInputProvenanceV0.js";

describe("rhizohInputProvenanceV0", () => {
  it("builds stable origin hash for mic STT input", () => {
    const a = buildInputProvenanceEnvelopeV0({
      text: "merhaba",
      source: RHIZOH_INPUT_SOURCE_V0.MIC_V3,
      modality: "stt",
      confidence: 0.72
    });
    const b = buildInputProvenanceEnvelopeV0({
      text: "merhaba",
      source: RHIZOH_INPUT_SOURCE_V0.MIC_V3,
      modality: "stt",
      confidence: 0.72
    });
    expect(a.originHash).toMatch(/^h[0-9a-f]{8}$/);
    expect(a.originHash).toBe(b.originHash);
  });

  it("rejects UI text in STT intent pipeline", () => {
    const env = buildInputProvenanceEnvelopeV0({
      text: "Kanalıma abone olduğunuz için teşekkür ederim",
      source: RHIZOH_INPUT_SOURCE_V0.UI_TEXT,
      modality: "text"
    });
    const gate = validateMicIntentProvenanceV0(env);
    expect(gate.ok).toBe(false);
    expect(gate.error).toBe("ui_text_stt_pipeline_forbidden");
  });

  it("accepts explicit mic_v3 STT provenance", () => {
    const env = buildInputProvenanceEnvelopeV0({
      text: "Rhizoh beni duyuyor musun?",
      source: RHIZOH_INPUT_SOURCE_V0.MIC_V3,
      modality: "stt",
      confidence: 0.68,
      band: "directed_candidate"
    });
    expect(isMicDerivedSourceV0(env.source)).toBe(true);
    expect(validateMicIntentProvenanceV0(env).ok).toBe(true);
  });
});
