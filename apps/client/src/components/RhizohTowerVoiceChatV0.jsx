import React, { memo, useCallback, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { postRhizohTowerLlmTurnV0 } from "../rhizoh/runtime/rhizohTowerLlmSessionV0.js";
import { speakRhizohReplyChunkedV0 } from "../rhizoh/runtime/rhizohSpeechChunkTtsV0.js";
import { resolveOutputLanguageCodeV0 } from "../rhizoh/runtime/rhizohOutputLanguagePolicyV0.js";
import { createVoiceEngineV3TurnBridgeV0 } from "../rhizoh/runtime/voiceEngineV3/index.js";
import { isVoiceEngineV3EnabledV0 } from "../rhizoh/runtime/voiceEngineV3/isVoiceEngineV3EnabledV0.js";
import { stampVoiceUserGestureV0 } from "../rhizoh/runtime/voiceUserGestureAnchorV0.js";

/**
 * Compact tower chat — text + optional voice STT, routes to tower provider on gateway.
 */
export const RhizohTowerVoiceChatV0 = memo(function RhizohTowerVoiceChatV0({
  towerId,
  uiLocale = "en",
  surface = "tower_chat",
  visionFrame = null,
  idToken = ""
}) {
  const tr = uiLocale === "tr";
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() => []);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const visionRef = useRef(visionFrame);
  visionRef.current = visionFrame;

  const sendMessage = useCallback(
    async (text) => {
      const msg = String(text || "").trim();
      if (!msg || busy) return;
      setBusy(true);
      setMessages((prev) => [...prev, { role: "user", text: msg }]);
      try {
        const turn = await postRhizohTowerLlmTurnV0({
          towerId,
          message: msg,
          surface,
          imageDataUrl: visionRef.current,
          idToken
        });
        const errCode = String(turn?.gatewayError || turn?.error || "");
        const reply = turn?.ok
          ? String(turn.reply || "").trim()
          : errCode.includes("missing_api_key") || errCode.includes("server_llm_key_missing")
            ? tr
              ? "Bu kule için API anahtarı henüz gateway'de tanımlı değil — ileride eklenecek."
              : "API key for this tower is not configured on the gateway yet."
            : tr
              ? "Kule yanıt veremedi — gateway bağlantısını kontrol et."
              : "Tower could not reply — check gateway connection.";
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        void speakRhizohReplyChunkedV0(reply, {
          smoothAfterAck: false,
          language: resolveOutputLanguageCodeV0()
        });
      } finally {
        setBusy(false);
        setDraft("");
      }
    },
    [busy, idToken, surface, towerId, tr]
  );

  const voiceRefs = useRef({
    voiceEngineV3: { current: null },
    voiceSttStartInFlight: { current: false },
    voiceSttMaxRecordTimer: { current: 0 },
    voiceSttGotAnyResult: { current: false }
  });

  const handleVoiceTranscriptRef = useRef(async (text) => {
    await sendMessage(text);
    setListening(false);
  });

  const voiceBridgeRef = useRef(
    createVoiceEngineV3TurnBridgeV0({
      refs: voiceRefs.current,
      callbacks: {
        setRhizohFieldState: (s) => setListening(s === "LISTENING" || s === "INTERPRETING"),
        setMicListening: () => {},
        handleVoiceTranscriptRef,
        scheduleVoiceMicRestart: () => {},
        maybeWarnVoiceSilentStop: () => {}
      }
    })
  );

  const onMic = useCallback(async () => {
    if (!isVoiceEngineV3EnabledV0()) return;
    stampVoiceUserGestureV0("tower_voice_chat");
    const bridge = voiceBridgeRef.current;
    if (listening) {
      await bridge.finishTurn(false);
      setListening(false);
      return;
    }
    setListening(true);
    await bridge.startTurn(false);
  }, [listening]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-black/35">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-[10px] text-white/45">
            {tr
              ? "Sohbet veya sesli komut — kule sağlayıcısı gateway üzerinden yanıtlar."
              : "Chat or voice — tower provider replies via gateway."}
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${i}_${m.role}`}
            className={`rounded-lg px-2 py-1.5 text-[11px] leading-relaxed ${
              m.role === "user"
                ? "ml-6 border border-cyan-400/20 bg-cyan-500/10 text-cyan-50"
                : "mr-6 border border-white/10 bg-white/5 text-white/85"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2 border-t border-white/10 p-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={tr ? "Kuleye yaz…" : "Message tower…"}
          className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-white/15 bg-black/50 p-2 text-[11px] text-white outline-none focus:border-cyan-400/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage(draft);
            }
          }}
        />
        {isVoiceEngineV3EnabledV0() ? (
          <button
            type="button"
            onClick={onMic}
            className={`rounded-lg border p-2 ${
              listening
                ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100"
                : "border-white/20 text-white/70 hover:text-white"
            }`}
            aria-label={tr ? "Sesli komut" : "Voice command"}
          >
            <Mic className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void sendMessage(draft)}
          className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 p-2 text-cyan-100 disabled:opacity-40"
          aria-label={tr ? "Gönder" : "Send"}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
