import { describe, expect, it, afterEach } from "vitest";
import {
  noteVoiceTranscriptDispatchedV0,
  probeVoiceTranscriptDispatchV0,
  resetVoiceTranscriptDispatchDedupForTestV0,
  VOICE_DISPATCH_DEDUP_WINDOW_MS
} from "../voiceTranscriptDispatchDedupV0.js";

describe("voiceTranscriptDispatchDedupV0", () => {
  afterEach(() => {
    resetVoiceTranscriptDispatchDedupForTestV0();
  });

  it("allows first dispatch", () => {
    const out = probeVoiceTranscriptDispatchV0("Merhaba Rhizoh");
    expect(out.ok).toBe(true);
  });

  it("blocks duplicate within window", () => {
    noteVoiceTranscriptDispatchedV0("bir sonraki tarifte görüşürüz", 1000);
    const out = probeVoiceTranscriptDispatchV0("Bir sonraki tarifte görüşürüz.", 5000);
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("duplicate_dispatch");
  });

  it("allows same text after window", () => {
    noteVoiceTranscriptDispatchedV0("tekrar dene", 0);
    const out = probeVoiceTranscriptDispatchV0("tekrar dene", VOICE_DISPATCH_DEDUP_WINDOW_MS + 1);
    expect(out.ok).toBe(true);
  });
});
