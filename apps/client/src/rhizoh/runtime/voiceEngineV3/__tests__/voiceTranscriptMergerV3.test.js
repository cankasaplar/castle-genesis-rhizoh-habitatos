import { describe, expect, it } from "vitest";
import { resolveVoiceTranscriptV3 } from "../voiceTranscriptMergerV3.js";

describe("resolveVoiceTranscriptV3", () => {
  it("prefers high-confidence google", () => {
    const m = resolveVoiceTranscriptV3(
      { text: "Merhaba", confidence: 0.9 },
      { text: "Meraba", confidence: 0.8 }
    );
    expect(m.text).toBe("Merhaba");
    expect(m.strategy).toBe("google_high_confidence");
  });

  it("uses whisper when google confidence low", () => {
    const m = resolveVoiceTranscriptV3(
      { text: "meraba", confidence: 0.4 },
      { text: "Merhaba", confidence: 0.88 }
    );
    expect(m.text).toBe("Merhaba");
    expect(m.source).toBe("whisper");
  });

  it("returns empty when both missing", () => {
    const m = resolveVoiceTranscriptV3(null, null);
    expect(m.text).toBe("");
    expect(m.strategy).toBe("empty");
  });
});
