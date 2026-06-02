import { describe, expect, it, afterEach } from "vitest";
import {
  __resetRhizohReplyRhythmDiagnosticForTestV0,
  compareRhizohReplyRhythmV0,
  recordRhizohReplySurfaceV0
} from "../rhizohReplyRhythmDiagnosticV0.js";

describe("rhizohReplyRhythmDiagnosticV0", () => {
  afterEach(() => {
    __resetRhizohReplyRhythmDiagnosticForTestV0();
  });

  it("detects aligned chat and tts", () => {
    recordRhizohReplySurfaceV0({ channel: "chat_ui", text: "Merhaba Rhizoh", traceId: "T1" });
    recordRhizohReplySurfaceV0({ channel: "tts", text: "Merhaba Rhizoh", traceId: "T1" });
    const snap = compareRhizohReplyRhythmV0();
    expect(snap.verdict).toBe("aligned");
  });

  it("detects tts truncation vs chat", () => {
    const long = "A".repeat(400);
    recordRhizohReplySurfaceV0({ channel: "chat_ui", text: long, traceId: "T2" });
    recordRhizohReplySurfaceV0({ channel: "tts", text: long.slice(0, 180), traceId: "T2" });
    const snap = compareRhizohReplyRhythmV0();
    expect(snap.verdict).toBe("tts_truncated");
    expect(snap.charDelta).toBeGreaterThan(0);
  });
});
