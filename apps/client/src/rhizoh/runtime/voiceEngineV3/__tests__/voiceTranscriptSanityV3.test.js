import { describe, expect, it, beforeEach } from "vitest";
import {
  sanitizeVoiceTranscriptForDispatchV3,
  isSuspiciousWhisperArtifactV3,
  resetVoiceTranscriptRepeatForTestV3,
  VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3
} from "../voiceTranscriptSanityV3.js";

describe("voiceTranscriptSanityV3", () => {
  beforeEach(() => resetVoiceTranscriptRepeatForTestV3());

  it("accepts short normal phrases with sufficient confidence", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("Hoşçakalın", { confidence: 0.72 });
    expect(out.ok).toBe(true);
  });

  it("rejects recipe outro in suspicious confidence band", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("bir sonraki tarifte görüşürüz, hoşçakalın.", {
      confidence: 0.55
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("whisper_artifact");
  });

  it("accepts recipe-like text when confidence is high", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("bir sonraki tarifte görüşürüz", { confidence: 0.82 });
    expect(out.ok).toBe(true);
  });

  it("rejects izlediğiniz outro with Turkish İ casing", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("İzlediğiniz için teşekkürler, hoşçakalın.", {
      confidence: 0.55,
      strategy: "whisper_only"
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("whisper_artifact");
  });

  it("rejects youtube outro in suspicious confidence band", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("Bu videoyu beğenip paylaşmayı unutmayın. Hoşçakalın", {
      confidence: 0.55,
      strategy: "whisper_only"
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("whisper_artifact");
  });

  it("rejects standalone hoşçakalın at whisper default confidence", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("hoşçakalın", {
      confidence: 0.55,
      strategy: "whisper_only"
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("whisper_artifact");
  });

  it("rejects internal phrase repetition", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3(
      "Şimdi birini de yüzeye çekiyoruz. Şimdi birini de yüzeye çekiyoruz. Şimdi birini de yüzeye çekiyoruz.",
      { confidence: 0.55, strategy: "whisper_only" }
    );
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("internal_repetition");
  });

  it("rejects low confidence", () => {
    const out = sanitizeVoiceTranscriptForDispatchV3("Merhaba", { confidence: 0.2 });
    expect(out.reason).toBe("low_confidence");
  });

  it("rejects repeated identical transcript", () => {
    sanitizeVoiceTranscriptForDispatchV3("Rhizoh nasılsın", { confidence: 0.8 });
    const out = sanitizeVoiceTranscriptForDispatchV3("Rhizoh nasılsın", { confidence: 0.8 });
    expect(out.reason).toBe("repeated_hallucination");
  });

  it("uses 0.62 suspicious threshold", () => {
    expect(VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3).toBe(0.62);
    expect(isSuspiciousWhisperArtifactV3("Altyazı M.K.", 0.55)).toBe(true);
    expect(isSuspiciousWhisperArtifactV3("Altyazı M.K.", 0.9)).toBe(false);
  });
});
