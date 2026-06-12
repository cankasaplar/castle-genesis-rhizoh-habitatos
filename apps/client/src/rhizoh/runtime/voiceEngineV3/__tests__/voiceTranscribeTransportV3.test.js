import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isRetryableTranscribeFailureV3,
  resolveTranscribePathStrategyV3,
  queryRhizohVoiceTranscribeResilientV3,
  VOICE_TRANSCRIBE_TRANSPORT_V3
} from "../voiceTranscribeTransportV3.js";
import { planVoiceTranscribePreflightV3 } from "../voiceTranscribePreflightV3.js";
import { noteGatewaySessionHealthOkV1 } from "../../gatewaySessionKeeperV1.js";
import {
  noteTranscribeGatewayConnectV1,
  resetTranscribeCoordinatorForTestV1
} from "../../voiceTranscribeSessionCoordinatorV1.js";
import * as queryModule from "../queryRhizohVoiceTranscribeV3.js";

describe("voiceTranscribeTransportV3", () => {
  beforeEach(() => {
    resetTranscribeCoordinatorForTestV1();
    noteGatewaySessionHealthOkV1({ atMs: Date.now() - 10_000 });
    noteTranscribeGatewayConnectV1(Date.now() - 10_000);
    vi.spyOn(queryModule, "queryRhizohVoiceTranscribeV3");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks network and 5xx as retryable", () => {
    expect(isRetryableTranscribeFailureV3("transcribe_network")).toBe(true);
    expect(isRetryableTranscribeFailureV3("fetch_timeout")).toBe(true);
    expect(isRetryableTranscribeFailureV3("http_503", 503)).toBe(true);
    expect(isRetryableTranscribeFailureV3("no_transcript")).toBe(false);
  });

  it("prefers fast path for large payloads then whisper fallback", () => {
    const large = VOICE_TRANSCRIBE_TRANSPORT_V3.largeAudioBytes + 1;
    expect(resolveTranscribePathStrategyV3(large, 0)).toBe("fast");
    expect(resolveTranscribePathStrategyV3(large, 1)).toBe("accurate");
    expect(resolveTranscribePathStrategyV3(1000, 0)).toBe("both");
    expect(resolveTranscribePathStrategyV3(1000, 1)).toBe("accurate");
  });

  it("emits preflight split plan before uploading large chunked session", async () => {
    queryModule.queryRhizohVoiceTranscribeV3.mockResolvedValue({
      ok: true,
      merged: { text: "parça", confidence: 0.88, strategy: "whisper_only" }
    });

    const header = new Blob([new Uint8Array(8_000)], { type: "audio/webm" });
    const body = new Blob([new Uint8Array(96_000)], { type: "audio/webm" });
    const tail = new Blob([new Uint8Array(92_000)], { type: "audio/webm" });
    const chunks = [header, body, tail];
    const blob = new Blob(chunks, { type: "audio/webm" });

    const plan = planVoiceTranscribePreflightV3({
      bytes: blob.size,
      recordedMs: 12_500,
      chunkCount: chunks.length
    });
    expect(plan.mode).toBe("split");

    const res = await queryRhizohVoiceTranscribeResilientV3(blob, {
      bytes: blob.size,
      recordedMs: 12_500,
      chunks,
      chunkCount: chunks.length,
      mimeType: "audio/webm",
      sessionId: "v3_test_split"
    });

    expect(res.ok).toBe(true);
    expect(res.preflight?.mode).toBe("split");
    expect(queryModule.queryRhizohVoiceTranscribeV3.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("retries transient network failure and recovers on second attempt", async () => {
    vi.spyOn(global, "setTimeout").mockImplementation((fn) => {
      fn();
      return 0;
    });
    queryModule.queryRhizohVoiceTranscribeV3
      .mockResolvedValueOnce({ ok: false, error: "transcribe_network" })
      .mockResolvedValueOnce({
        ok: true,
        merged: { text: "merhaba", confidence: 0.9, strategy: "whisper_only" }
      });

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const res = await queryRhizohVoiceTranscribeResilientV3(blob, {
      bytes: 120_000,
      sessionId: "v3_test_retry"
    });

    expect(res.ok).toBe(true);
    expect(res.transportAttempt).toBe(2);
    expect(queryModule.queryRhizohVoiceTranscribeV3).toHaveBeenCalledTimes(2);
    expect(queryModule.queryRhizohVoiceTranscribeV3.mock.calls[0][1].path).toBe("fast");
    expect(queryModule.queryRhizohVoiceTranscribeV3.mock.calls[1][1].path).toBe("accurate");
  });

  it("does not retry non-retryable ASR errors", async () => {
    queryModule.queryRhizohVoiceTranscribeV3.mockResolvedValueOnce({
      ok: false,
      error: "no_transcript"
    });

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const res = await queryRhizohVoiceTranscribeResilientV3(blob, {
      bytes: 1000,
      sessionId: "v3_test_no_retry"
    });

    expect(res.ok).toBe(false);
    expect(res.error).toBe("no_transcript");
    expect(queryModule.queryRhizohVoiceTranscribeV3).toHaveBeenCalledTimes(1);
  });
});
