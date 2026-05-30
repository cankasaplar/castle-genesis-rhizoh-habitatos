/**
 * Conversation dock hook — text + voice v3 bridge for spatial shell.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createVoiceEngineV3TurnBridgeV0, isVoiceEngineV3EnabledV0 } from "./voiceEngineV3/index.js";
import { handleRhizohVoiceTranscriptV0 } from "./rhizohVoiceLlmDispatchV0.js";
import { postRhizohLlmTurnV0 } from "./rhizohLlmTurnClientV0.js";
import { buildConversationContinuityGlueV0 } from "./rhizohConversationContinuityGlueV0.js";
import { speakRhizohReplyChunkedV0 } from "./rhizohSpeechChunkTtsV0.js";
import { stampVoiceUserGestureV0 } from "./voiceUserGestureAnchorV0.js";

/** @typedef {"idle" | "listening" | "interpreting" | "thinking" | "speaking"} RhizohConversationFieldState */

/**
 * @param {{ idToken?: string, firebaseUser?: { getIdToken?: () => Promise<string> } | null, userTurnCount?: number, conversationPhase?: string }} [opts]
 */
export function useRhizohConversationDockV0(opts = {}) {
  const [fieldState, setFieldState] = useState(/** @type {RhizohConversationFieldState} */ ("idle"));
  const [lastReply, setLastReply] = useState("");
  const [lastError, setLastError] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const userTurnRef = useRef(Number(opts.userTurnCount) || 0);
  const [idToken, setIdToken] = useState(String(opts.idToken || ""));

  useEffect(() => {
    let cancelled = false;
    const u = opts.firebaseUser;
    if (!u?.getIdToken) {
      setIdToken(String(opts.idToken || ""));
      return undefined;
    }
    u.getIdToken()
      .then((t) => {
        if (!cancelled) setIdToken(String(t || ""));
      })
      .catch(() => {
        if (!cancelled) setIdToken("");
      });
    return () => {
      cancelled = true;
    };
  }, [opts.firebaseUser, opts.idToken]);

  const voiceRefs = useRef({
    voiceEngineV3: { current: null },
    voiceSttStartInFlight: { current: false },
    voiceSttMaxRecordTimer: { current: 0 },
    voiceSttGotAnyResult: { current: false }
  });

  const handleVoiceTranscriptRef = useRef(
    /** @type {(text: string, o: object) => Promise<void>} */ (async (text, o) => {
      setFieldState("thinking");
      const t0 = Date.now();
      const out = await handleRhizohVoiceTranscriptV0(text, {
        ...o,
        idToken,
        userTurnCount: userTurnRef.current,
        conversationPhase: opts.conversationPhase
      });
      const glue = buildConversationContinuityGlueV0({
        prep: out.prep,
        llmWaitMs: Date.now() - t0
      });
      if (out.ok && out.reply) {
        setLastReply(out.reply);
        setFieldState("speaking");
        await handoffHotSpeechToLlmReplyV0(glue, () => {
          void speakRhizohReplyChunkedV0(out.reply, { smoothAfterAck: false, glue });
        });
      } else if (!out.ok) {
        setLastError(String(out.error || "dispatch_failed"));
      }
      setFieldState("idle");
      userTurnRef.current += 1;
    })
  );

  const voiceBridgeRef = useRef(
    createVoiceEngineV3TurnBridgeV0({
      refs: voiceRefs.current,
      callbacks: {
        setRhizohFieldState: (s) => {
          const map = {
            LISTENING: "listening",
            INTERPRETING: "interpreting",
            IDLE: "idle"
          };
          setFieldState(/** @type {RhizohConversationFieldState} */ (map[s] || "idle"));
        },
        setMicListening: () => {},
        handleVoiceTranscriptRef,
        scheduleVoiceMicRestart: () => {},
        maybeWarnVoiceSilentStop: () => {}
      }
    })
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.conversationDock = Object.freeze({
        fieldState,
        voiceV3: isVoiceEngineV3EnabledV0()
      });
    }
  }, [fieldState]);

  const sendText = useCallback(async () => {
    const msg = String(draft || "").trim();
    if (!msg || busy) return;
    setBusy(true);
    setLastError("");
    setFieldState("thinking");
    const t0 = Date.now();
    try {
      const out = await postRhizohLlmTurnV0({
        message: msg,
        speakInstantAck: true,
        userTurnCount: userTurnRef.current,
        conversationPhase: opts.conversationPhase,
        idToken,
        sourcePath: "conversation_dock_text"
      });
      if (out.ok && out.reply) {
        setLastReply(out.reply);
        setDraft("");
        setFieldState("speaking");
        const glue = buildConversationContinuityGlueV0({ prep: out.prep, llmWaitMs: Date.now() - t0 });
        await speakRhizohReplyChunkedV0(out.reply, { smoothAfterAck: true, glue });
      } else {
        setLastError(String(out.error || "llm_failed"));
      }
    } finally {
      setFieldState("idle");
      setBusy(false);
      userTurnRef.current += 1;
    }
  }, [draft, busy, opts.conversationPhase, idToken]);

  const toggleMic = useCallback(async () => {
    if (!isVoiceEngineV3EnabledV0()) return;
    stampVoiceUserGestureV0("conversation_dock_mic");
    const bridge = voiceBridgeRef.current;
    if (fieldState === "listening") {
      await bridge.finishTurn(false);
      return;
    }
    setBusy(true);
    try {
      await bridge.startTurn(false);
    } finally {
      setBusy(false);
    }
  }, [fieldState]);

  return Object.freeze({
    fieldState,
    draft,
    setDraft,
    busy,
    lastReply,
    lastError,
    sendText,
    toggleMic,
    voiceV3Enabled: isVoiceEngineV3EnabledV0(),
    micActive: fieldState === "listening" || fieldState === "interpreting"
  });
}
