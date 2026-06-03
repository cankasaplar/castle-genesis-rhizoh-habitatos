import { describe, expect, it } from "vitest";
import {
  planVoiceTranscribePreflightV3,
  resolveTranscribeRetryPathV3,
  VOICE_TRANSCRIBE_PREFLIGHT_V3
} from "../voiceTranscribePreflightV3.js";
import { buildWebmSegmentBlobsV3, mergeSegmentTranscriptsV3 } from "../voiceWebmSegmentSplitV3.js";

describe("voiceTranscribePreflightV3", () => {
  it("uses single pass for takes under 12s", () => {
    const plan = planVoiceTranscribePreflightV3({
      bytes: 123_873,
      recordedMs: 9_595,
      chunkCount: 7
    });
    expect(plan.mode).toBe("direct");
    expect(plan.segmentCount).toBe(1);
  });

  it("routes very long sessions to split", () => {
    const plan = planVoiceTranscribePreflightV3({
      bytes: 200_000,
      recordedMs: 13_500,
      chunkCount: 7
    });
    expect(plan.mode).toBe("split");
    expect(plan.path).toBe("accurate");
  });

  it("uses fast direct route for large payload without chunk metadata", () => {
    const plan = planVoiceTranscribePreflightV3({
      bytes: 123_873,
      recordedMs: 9_595,
      chunkCount: 0
    });
    expect(plan.mode).toBe("direct");
    expect(plan.path).toBe("fast");
    expect(plan.reason).toBe("payload_medium_no_split");
  });

  it("uses hybrid path for small takes", () => {
    const plan = planVoiceTranscribePreflightV3({
      bytes: 40_000,
      recordedMs: 3_200,
      chunkCount: 3
    });
    expect(plan.mode).toBe("direct");
    expect(plan.path).toBe("both");
  });

  it("retry path defers to preflight first attempt", () => {
    const plan = planVoiceTranscribePreflightV3({
      bytes: 200_000,
      recordedMs: 13_500,
      chunkCount: 7
    });
    expect(resolveTranscribeRetryPathV3(plan, 0)).toBe("accurate");
    expect(resolveTranscribeRetryPathV3(plan, 1)).toBe("fast");
  });
});

describe("voiceWebmSegmentSplitV3", () => {
  it("builds multiple upload segments from recorder chunks", () => {
    const header = new Blob([new Uint8Array(8_000)], { type: "audio/webm" });
    const body = new Blob([new Uint8Array(60_000)], { type: "audio/webm" });
    const tail = new Blob([new Uint8Array(55_000)], { type: "audio/webm" });
    const segments = buildWebmSegmentBlobsV3(
      [header, body, tail],
      "audio/webm",
      VOICE_TRANSCRIBE_PREFLIGHT_V3.maxSegmentBytes
    );
    expect(segments).not.toBeNull();
    expect(segments?.length).toBe(2);
  });

  it("merges segment transcripts in order", () => {
    const merged = mergeSegmentTranscriptsV3([
      { text: "merhaba", confidence: 0.9 },
      { text: "dünya", confidence: 0.85 }
    ]);
    expect(merged.text).toBe("merhaba dünya");
    expect(merged.strategy).toBe("split_merged");
  });
});
