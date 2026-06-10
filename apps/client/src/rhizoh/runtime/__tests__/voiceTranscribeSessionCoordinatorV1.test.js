import { describe, expect, it, beforeEach } from "vitest";
import {
  acquireTranscribeSessionV1,
  releaseTranscribeSessionV1,
  noteTranscribeTransportFailureV1,
  coerceTranscribePlanForGatewayV1,
  resetTranscribeCoordinatorForTestV1,
  noteTranscribeGatewayConnectV1
} from "../voiceTranscribeSessionCoordinatorV1.js";
import { planVoiceTranscribePreflightV3 } from "../voiceEngineV3/voiceTranscribePreflightV3.js";

describe("voiceTranscribeSessionCoordinatorV1", () => {
  beforeEach(() => {
    resetTranscribeCoordinatorForTestV1();
  });

  it("rejects overlapping transcribe sessions", () => {
    expect(acquireTranscribeSessionV1("v3_a").ok).toBe(true);
    const second = acquireTranscribeSessionV1("v3_b");
    expect(second.ok).toBe(false);
    expect(second.error).toBe("transcribe_session_overlap");
    releaseTranscribeSessionV1("v3_a");
  });

  it("applies global backoff after transport failure", () => {
    noteTranscribeTransportFailureV1({ error: "transcribe_network" });
    const next = acquireTranscribeSessionV1("v3_c");
    expect(next.ok).toBe(false);
    expect(next.error).toBe("transcribe_global_backoff");
  });

  it("coerces split to direct fast during gateway warmup", () => {
    noteTranscribeGatewayConnectV1(Date.now());
    const plan = planVoiceTranscribePreflightV3({
      bytes: 123_000,
      recordedMs: 9_500,
      chunkCount: 6
    });
    const coerced = coerceTranscribePlanForGatewayV1(plan);
    if (plan.mode === "split") {
      expect(coerced.mode).toBe("direct");
      expect(coerced.path).toBe("fast");
      expect(coerced.reason).toBe("gateway_warmup_direct");
    } else {
      expect(coerced).toBe(plan);
    }
  });
});
