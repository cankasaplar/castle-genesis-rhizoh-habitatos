import { describe, expect, it, afterEach, vi } from "vitest";
import {
  acquireVoiceStreamLayerLockV1,
  bindVoiceStreamLayerLockSessionV1,
  releaseVoiceStreamLayerLockV1,
  resetVoiceStreamLayerLockForTestV1,
  VOICE_STREAM_ABORT_REASON_V1
} from "../voiceStreamLifecycleControllerV1.js";
import { VOICE_UI_DOMAIN_V0 } from "../../../rhizoh/runtime/rhizohVoiceUiDomainV0.js";

describe("voiceStreamLifecycleControllerV1", () => {
  afterEach(() => {
    resetVoiceStreamLayerLockForTestV1();
    vi.unstubAllEnvs();
  });

  it("acquires lock when layer scope allows stream start", () => {
    const res = acquireVoiceStreamLayerLockV1({ source: "mic_v3" });
    expect(res.acquired).toBe(true);
    expect(res.lock?.lockId).toMatch(/^vsl_/);
    expect(res.gate?.allowExecution).toBe(true);
  });

  it("denies pre-stream lock on cross-domain scope", () => {
    vi.stubEnv("VITE_RHIZOH_SPATIAL_SHELL", "0");
    const res = acquireVoiceStreamLayerLockV1({
      source: "mic_v3",
      uiDomain: VOICE_UI_DOMAIN_V0.SPATIAL_SHELL
    });
    expect(res.acquired).toBe(false);
    expect(res.error).toBe("layer_stream_denied");
  });

  it("binds session id and releases with normalized reason", () => {
    const res = acquireVoiceStreamLayerLockV1({ source: "mic_v3" });
    bindVoiceStreamLayerLockSessionV1("v3_test_session");
    const released = releaseVoiceStreamLayerLockV1(VOICE_STREAM_ABORT_REASON_V1.USER_LOOP_STOP, {
      sessionId: "v3_test_session"
    });
    expect(released.reason).toBe("user_loop_stop");
    expect(released.lockId).toBe(res.lock?.lockId);
  });
});
