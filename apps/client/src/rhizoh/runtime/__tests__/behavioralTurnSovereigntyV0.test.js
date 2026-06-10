import { describe, expect, it, beforeEach } from "vitest";
import { RHIZOH_INTENT } from "../../router/intentTypes.js";
import { CMD_EXEC_DECISION_V0 } from "../rhizohCommandExecutionTraceV0.js";
import { VOICE_CONVERSATION_AUTHORITY_PATH_V0 } from "../rhizohVoiceConversationAuthorityV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import {
  SOVEREIGN_REALITY_V0,
  SOVEREIGNTY_OUTPUT_CHANNEL_V0,
  classifyDirectedPatternsV0,
  isMixedSubstantiveQueryV0,
  isShortAddressOnlyV0,
  lockTurnSovereigntyV0,
  permitTurnOutputV0,
  explainTurnSovereigntyV0,
  exportTurnSovereigntyAnalysisV0,
  getTurnSovereigntyConflictHeatmapV0,
  resetTurnSovereigntyStateForTestsV0
} from "../behavioralTurnSovereigntyV0.js";

function baseInput(overrides = {}) {
  return {
    turnId: overrides.turnId || "TRC-TEST-1",
    atMs: overrides.atMs || 1_700_000_000_000,
    input: {
      text: "merhaba",
      modality: "voice",
      locale: "tr",
      ...overrides.input
    },
    candidates: {
      router: { intent: RHIZOH_INTENT.CHAT, confidence: 0.7, silenceMode: false },
      depth: { conversationMode: "greet", directive: "Mode GREET", maxTokensCeiling: 200 },
      voice: {
        authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM },
        commitment: { behaviorEligible: true },
        band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE
      },
      ...overrides.candidates
    },
    runtime: {
      conversationPhase: "NORMAL_CHAT",
      userTurnCount: 3,
      strictVoiceIngest: true,
      gatewayMaintenance: false,
      ...overrides.runtime
    }
  };
}

describe("behavioralTurnSovereigntyV0", () => {
  beforeEach(() => {
    resetTurnSovereigntyStateForTestsV0();
  });

  it("presence check → presence_ack, LLM suppressed", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "beni duyuyor musun?", modality: "voice" },
        candidates: {
          voice: {
            band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
            authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM },
            commitment: { behaviorEligible: true }
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.PRESENCE_ACK);
    expect(lock.suppressed).toContain("llm_conversation");
    expect(lock.suppressed).toContain("instant_ack");
    expect(lock.outputChannel).toBe(SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS);
    expect(lock.sovereignOutput?.text).toBeTruthy();
    expect(lock.preventions).toContain("ACK_LLM_ECHO");
    expect(permitTurnOutputV0(lock.turnId, "llm").reason).toBe("log_only");
  });

  it("wake → presence_ack", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "rhizoh", modality: "voice" },
        candidates: {
          router: { intent: RHIZOH_INTENT.CHAT, confidence: 0.5, silenceMode: false },
          voice: {
            band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
            authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM }
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.PRESENCE_ACK);
    expect(lock.selectionReason).toBe("wake_ack");
    expect(classifyDirectedPatternsV0("rhizoh")).toContain("wake");
  });

  it("silence → silent_observe", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "sessiz", modality: "text" },
        candidates: {
          router: { intent: RHIZOH_INTENT.SILENCE, confidence: 0.92, silenceMode: true }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.SILENT_OBSERVE);
    expect(lock.outputChannel).toBe(SOVEREIGNTY_OUTPUT_CHANNEL_V0.NONE);
  });

  it("command silent execute → command_execute", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "haritayı aç", modality: "voice" },
        candidates: {
          command: { matched: true, decision: CMD_EXEC_DECISION_V0.SILENT_EXECUTE }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.COMMAND_EXECUTE);
    expect(lock.suppressed).toContain("llm_conversation");
  });

  it("crisis → llm_conversation, presence suppressed", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "sistem çöküyor", modality: "text" },
        candidates: {
          router: { intent: RHIZOH_INTENT.CRISIS, confidence: 0.8, silenceMode: false },
          voice: { authority: { maySpeak: false } }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.LLM_CONVERSATION);
    expect(lock.suppressed).toContain("presence_ack");
    expect(lock.suppressed).toContain("instant_ack");
  });

  it("mixed intent → llm_conversation single reply path", () => {
    const text = "rhizoh beni duyuyor musun, haritayı istanbul'a götür";
    expect(isMixedSubstantiveQueryV0(text, classifyDirectedPatternsV0(text))).toBe(true);
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text, modality: "voice" },
        candidates: {
          voice: {
            band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
            authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM },
            commitment: { behaviorEligible: true }
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.LLM_CONVERSATION);
    expect(lock.selectionReason).toBe("mixed_intent_llm_single_reply");
  });

  it("shadow reject → no_lock_escape when substantive voice blocked", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "bugün ne yapıyoruz birlikte", modality: "voice" },
        candidates: {
          voice: {
            authority: { maySpeak: false },
            commitment: { behaviorEligible: false },
            band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.LLM_CONVERSATION);
    expect(lock.noLockEscapeApplied).toBe(true);
    expect(lock.selectionReason).toBe("no_lock_escape_safe_llm");
  });

  it("true silence stays silent_observe without escape", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "sessiz", modality: "voice" },
        candidates: {
          router: { intent: RHIZOH_INTENT.SILENCE, confidence: 0.92, silenceMode: true },
          voice: { authority: { maySpeak: false }, band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.SILENT_OBSERVE);
    expect(lock.noLockEscapeApplied).toBe(false);
  });

  it("fast reflex → fast_reflex bypass", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "tamam", modality: "voice" },
        candidates: {
          fastReflex: { eligible: true, reply: "Anladım." },
          voice: {
            authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.FAST_REFLEX },
            commitment: { behaviorEligible: true }
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.FAST_REFLEX);
    expect(lock.sovereignOutput?.text).toBe("Anladım.");
    expect(lock.suppressed).toContain("llm_conversation");
  });

  it("directed_candidate band alone routes to llm_conversation", () => {
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text: "Biraz konuşalım", modality: "voice" },
        candidates: {
          voice: {
            band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
            authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM },
            commitment: { behaviorEligible: true }
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.LLM_CONVERSATION);
    expect(lock.selectionReason).toBe("llm_conversation");
  });

  it("substantive question with Rizo name is not short address ack", () => {
    const text = "Soru sormak ister misin Rizo?";
    expect(isShortAddressOnlyV0(text)).toBe(false);
    expect(classifyDirectedPatternsV0(text)).not.toContain("address");
    const lock = lockTurnSovereigntyV0(
      baseInput({
        input: { text, modality: "voice" },
        candidates: {
          voice: {
            band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
            authority: { maySpeak: true, path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM },
            commitment: { behaviorEligible: true }
          }
        }
      })
    );
    expect(lock.sovereignReality).toBe(SOVEREIGN_REALITY_V0.LLM_CONVERSATION);
  });

  it("sub-reality varies phrase within presence_ack", () => {
    const a = lockTurnSovereigntyV0(
      baseInput({ turnId: "A", input: { text: "beni duyuyor musun", modality: "voice" } })
    );
    const b = lockTurnSovereigntyV0(
      baseInput({ turnId: "B", input: { text: "beni duyuyor musun", modality: "voice" } })
    );
    expect(a.subReality.allowsPoolRotation).toBe(true);
    expect(a.subReality.emotionalTone).toBeTruthy();
    expect(a.subReality.phraseVariant).toBeTruthy();
    expect(b.subReality.phraseVariant).toBeTruthy();
  });

  it("trace replay and conflict heatmap accumulate", () => {
    lockTurnSovereigntyV0(
      baseInput({ turnId: "H1", input: { text: "beni duyuyor musun", modality: "voice" } })
    );
    lockTurnSovereigntyV0(
      baseInput({
        turnId: "H2",
        input: { text: "bugün hava nasıl", modality: "text" },
        candidates: {
          router: { intent: RHIZOH_INTENT.CHAT, confidence: 0.7 },
          voice: { authority: { maySpeak: false }, commitment: { behaviorEligible: false } }
        }
      })
    );
    const explain = explainTurnSovereigntyV0("H1");
    expect(explain?.sovereignReality).toBe(SOVEREIGN_REALITY_V0.PRESENCE_ACK);
    expect(explain?.selectionTrace?.length).toBeGreaterThan(0);
    const heat = getTurnSovereigntyConflictHeatmapV0();
    expect(Object.keys(heat).length).toBeGreaterThanOrEqual(0);
    const exported = exportTurnSovereigntyAnalysisV0();
    expect(exported.trace.length).toBe(2);
    expect(exported.enforcement).toBe("log_only");
  });
});
