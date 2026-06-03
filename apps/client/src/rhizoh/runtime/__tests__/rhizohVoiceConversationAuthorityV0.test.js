import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isVoiceIngestStrictV0,
  resolveConversationAuthorityV0,
  shouldSuppressShadowObservationAckV0,
  shouldSuppressUxFallbackV0,
  VOICE_CONVERSATION_AUTHORITY_PATH_V0
} from "../rhizohVoiceConversationAuthorityV0.js";
import {
  VOICE_EXEC_MODE_V0,
  VOICE_SPEAK_MODE_V0
} from "../rhizohVoiceDualPathRouterV0.js";

describe("rhizohVoiceConversationAuthorityV0", () => {
  /** @type {Record<string, string | undefined>} */
  let envBackup;

  beforeEach(() => {
    envBackup = { ...import.meta.env };
    import.meta.env.VITE_RHIZOH_VOICE_ENGINE_V3 = "1";
    import.meta.env.VITE_RHIZOH_VOICE_INGEST_STRICT = "1";
  });

  afterEach(() => {
    Object.assign(import.meta.env, envBackup);
  });

  it("strict ingest defaults on when voice v3 enabled", () => {
    expect(isVoiceIngestStrictV0()).toBe(true);
    expect(shouldSuppressShadowObservationAckV0()).toBe(true);
    expect(shouldSuppressUxFallbackV0()).toBe(true);
  });

  it("strict ingest can opt out", () => {
    import.meta.env.VITE_RHIZOH_VOICE_INGEST_STRICT = "0";
    expect(isVoiceIngestStrictV0()).toBe(false);
    expect(shouldSuppressShadowObservationAckV0()).toBe(false);
  });

  it("hold becomes silent authority in strict mode", () => {
    const authority = resolveConversationAuthorityV0({
      decision: {
        speakMode: VOICE_SPEAK_MODE_V0.HOLD,
        execMode: null,
        reason: "uncertainty_hold"
      }
    });
    expect(authority.maySpeak).toBe(false);
    expect(authority.path).toBe(VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE);
    expect(authority.reason).toBe("strict_hold_suppressed");
  });

  it("fast reflex and slow llm pass authority in strict mode", () => {
    const fast = resolveConversationAuthorityV0({
      decision: {
        speakMode: VOICE_SPEAK_MODE_V0.SPEAK,
        execMode: VOICE_EXEC_MODE_V0.FAST_REFLEX,
        reason: "hearing_check"
      }
    });
    expect(fast.maySpeak).toBe(true);
    expect(fast.path).toBe(VOICE_CONVERSATION_AUTHORITY_PATH_V0.FAST_REFLEX);

    const slow = resolveConversationAuthorityV0({
      decision: {
        speakMode: VOICE_SPEAK_MODE_V0.SPEAK,
        execMode: VOICE_EXEC_MODE_V0.SLOW_LLM,
        guards: { allowSlow: true },
        reason: "intent_override_slow"
      }
    });
    expect(slow.maySpeak).toBe(true);
    expect(slow.path).toBe(VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM);
  });

  it("legacy mode allows hold speak path", () => {
    import.meta.env.VITE_RHIZOH_VOICE_INGEST_STRICT = "0";
    const authority = resolveConversationAuthorityV0({
      decision: {
        speakMode: VOICE_SPEAK_MODE_V0.HOLD,
        execMode: null
      }
    });
    expect(authority.maySpeak).toBe(true);
    expect(authority.path).toBe(VOICE_CONVERSATION_AUTHORITY_PATH_V0.HOLD);
    expect(authority.strict).toBe(false);
  });
});
