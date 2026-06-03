import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateVoiceGatewayTranscribeGuardV0,
  evaluateVoiceTranscriptAcceptGuardV0,
  isGatewayPhaseOfflineV0
} from "../rhizohVoiceGatewayAcceptGuardV0.js";
import {
  noteGatewayPhaseTransitionV1,
  noteGatewaySessionHealthOkV1,
  resetGatewaySessionKeeperForTestV1
} from "../gatewaySessionKeeperV1.js";
import {
  acquireTranscribeSessionV1,
  releaseTranscribeSessionV1,
  resetTranscribeCoordinatorForTestV1
} from "../voiceTranscribeSessionCoordinatorV1.js";

describe("rhizohVoiceGatewayAcceptGuardV0", () => {
  beforeEach(() => {
    resetGatewaySessionKeeperForTestV1();
    resetTranscribeCoordinatorForTestV1();
  });

  it("detects offline gateway phase", () => {
    expect(isGatewayPhaseOfflineV0("offline")).toBe(true);
    expect(isGatewayPhaseOfflineV0("connected")).toBe(false);
  });

  it("blocks transcribe when gateway offline", () => {
    noteGatewayPhaseTransitionV1("offline");
    const v = evaluateVoiceGatewayTranscribeGuardV0({ gatewayPhase: "offline" });
    expect(v.allowTranscribe).toBe(false);
    expect(v.reason).toBe("gateway_offline");
  });

  it("allows transcribe when gateway stable", () => {
    noteGatewaySessionHealthOkV1({ atMs: Date.now() });
    noteGatewayPhaseTransitionV1("connected");
    const v = evaluateVoiceGatewayTranscribeGuardV0({ gatewayPhase: "connected" });
    expect(v.allowTranscribe).toBe(true);
  });

  it("blocks accept on session mismatch", () => {
    noteGatewaySessionHealthOkV1({ atMs: Date.now() });
    acquireTranscribeSessionV1("voice_a");
    const v = evaluateVoiceTranscriptAcceptGuardV0({ sessionId: "voice_b", gatewayPhase: "connected" });
    expect(v.allowAccept).toBe(false);
    expect(v.reason).toBe("session_mismatch");
    releaseTranscribeSessionV1("voice_a");
  });
});
