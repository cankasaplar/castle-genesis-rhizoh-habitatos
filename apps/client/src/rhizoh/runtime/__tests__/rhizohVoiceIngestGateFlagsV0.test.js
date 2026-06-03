import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isVoicePreSttGateEnabledV0,
  isVoicePostSttOriginFilterEnabledV0,
  readVoiceIngestGateRolloutV0
} from "../rhizohVoiceIngestGateFlagsV0.js";

describe("rhizohVoiceIngestGateFlagsV0", () => {
  /** @type {Record<string, string | undefined>} */
  let envBackup;

  beforeEach(() => {
    envBackup = { ...import.meta.env };
    import.meta.env.VITE_RHIZOH_VOICE_ENGINE_V3 = "1";
  });

  afterEach(() => {
    Object.assign(import.meta.env, envBackup);
  });

  it("defaults pre-STT on and post-STT off for canary rollout", () => {
    delete import.meta.env.VITE_RHIZOH_VOICE_PRE_STT_GATE;
    delete import.meta.env.VITE_RHIZOH_VOICE_POST_STT_ORIGIN;
    expect(isVoicePreSttGateEnabledV0()).toBe(true);
    expect(isVoicePostSttOriginFilterEnabledV0()).toBe(false);
    expect(readVoiceIngestGateRolloutV0()).toEqual({
      preSttGate: true,
      postSttOrigin: false,
      originRetry: false,
      voiceV3: true
    });
  });
});
