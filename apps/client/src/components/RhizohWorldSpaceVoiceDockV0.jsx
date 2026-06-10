import React, { memo } from "react";
import { Loader2, Mic, MicOff, Send } from "lucide-react";
import { useRhizohConversationDockV0 } from "../rhizoh/runtime/useRhizohConversationDockV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { resolveChatPlaceholderV0 } from "../rhizoh/runtime/rhizohProductCopyI18nV0.js";

/**
 * Map-stage voice dock — mic + text only. No fox / Octo / cube stage.
 */
export const RhizohWorldSpaceVoiceDockV0 = memo(function RhizohWorldSpaceVoiceDockV0({
  firebaseUser,
  uiLocale,
  className = ""
}) {
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";
  const dock = useRhizohConversationDockV0({ firebaseUser, conversationPhase: "EXPLORE_MAP" });

  const statusLine =
    dock.fieldState === "listening"
      ? tr
        ? "Dinliyorum…"
        : "Listening…"
      : dock.fieldState === "thinking"
        ? tr
          ? "Yanıt hazırlanıyor…"
          : "Thinking…"
        : dock.fieldState === "speaking"
          ? tr
            ? "Konuşuyor…"
            : "Speaking…"
          : tr
            ? "Hazır · yaz veya mikrofona dokun"
            : "Ready · type or tap mic";

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#030711]/92 shadow-lg backdrop-blur-md ${className}`}
      data-rhizoh-world-space-voice-dock="1"
      data-field-state={dock.fieldState}
    >
      {dock.lastReply ? (
        <div className="border-b border-white/8 px-3 py-2 text-[11px] leading-snug text-white/88 normal-case">
          {dock.lastReply.slice(0, 280)}
          {dock.lastReply.length > 280 ? "…" : ""}
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 px-2 py-2">
        {dock.voiceV3Enabled ? (
          <button
            type="button"
            onClick={() => void dock.toggleMic()}
            disabled={dock.busy && !dock.micActive}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              dock.micActive
                ? "border-rose-400/50 bg-rose-500/20 text-rose-100"
                : "border-white/15 bg-white/5 text-white/75 hover:border-cyan-400/40"
            }`}
            aria-label={dock.micActive ? (tr ? "Mikrofonu kapat" : "Stop mic") : tr ? "Mikrofon" : "Mic"}
            aria-pressed={dock.micActive}
          >
            {dock.micActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        ) : null}

        <input
          value={dock.draft}
          onChange={(e) => dock.setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !dock.busy) {
              e.preventDefault();
              void dock.sendText();
            }
          }}
          disabled={dock.busy}
          placeholder={resolveChatPlaceholderV0(locale)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none normal-case placeholder:text-white/40"
          aria-label={tr ? "Rhizoh mesajı" : "Message Rhizoh"}
        />

        <button
          type="button"
          onClick={() => void dock.sendText()}
          disabled={dock.busy || !String(dock.draft || "").trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/90 text-black disabled:opacity-40"
          aria-label={tr ? "Gönder" : "Send"}
        >
          {dock.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      <p className="px-3 pb-2 text-[9px] text-cyan-200/65 normal-case">{statusLine}</p>
      {dock.lastError ? (
        <p className="px-3 pb-2 text-[9px] text-rose-300/80 normal-case">{dock.lastError}</p>
      ) : null}
    </div>
  );
});
