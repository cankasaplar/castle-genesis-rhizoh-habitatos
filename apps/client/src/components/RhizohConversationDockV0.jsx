import React, { memo } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useRhizohConversationDockV0 } from "../rhizoh/runtime/useRhizohConversationDockV0.js";

const FIELD_LABELS = Object.freeze({
  idle: "Konuşmaya hazır",
  listening: "Dinliyorum…",
  interpreting: "Yorumluyorum…",
  thinking: "Akış devam ediyor…",
  speaking: "Yanıt geliyor…"
});

/**
 * Spatial shell conversation dock — text + optional voice v3.
 * @param {{ firebaseUser?: object | null, className?: string }} props
 */
export const RhizohConversationDockV0 = memo(function RhizohConversationDockV0({ firebaseUser, className = "" }) {
  const dock = useRhizohConversationDockV0({ firebaseUser, conversationPhase: "EXPLORE" });

  return (
    <div
      className={`pointer-events-auto rounded-2xl border border-white/12 bg-black/72 px-3 py-2.5 shadow-lg backdrop-blur-md ${className}`}
      data-rhizoh-conversation-dock="1"
      data-field-state={dock.fieldState}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-violet-200/80">
          {FIELD_LABELS[dock.fieldState] || FIELD_LABELS.idle}
        </span>
        {dock.busy || dock.fieldState === "thinking" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300/90" aria-hidden />
        ) : null}
      </div>

      <div className="flex items-end gap-2">
        <input
          type="text"
          value={dock.draft}
          onChange={(e) => dock.setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void dock.sendText();
            }
          }}
          placeholder="Rhizoh ile konuş…"
          disabled={dock.busy}
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-violet-400/45"
          aria-label="Mesaj"
        />

        {dock.voiceV3Enabled ? (
          <button
            type="button"
            title={dock.micActive ? "Kaydı bitir" : "Mikrofon"}
            onClick={() => void dock.toggleMic()}
            disabled={dock.busy && !dock.micActive}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              dock.micActive
                ? "border-rose-400/50 bg-rose-500/20 text-rose-100"
                : "border-white/15 bg-white/5 text-white/70 hover:border-cyan-400/40 hover:text-cyan-100"
            }`}
          >
            {dock.micActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        ) : null}

        <button
          type="button"
          title="Gönder"
          onClick={() => void dock.sendText()}
          disabled={dock.busy || !String(dock.draft || "").trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {dock.lastError ? (
        <p className="mt-2 text-[9px] text-amber-200/85" role="status">
          {dock.lastError}
        </p>
      ) : null}

      {dock.lastReply && dock.fieldState === "idle" ? (
        <p className="mt-2 line-clamp-2 text-[9px] text-white/55" aria-live="polite">
          {dock.lastReply.slice(0, 160)}
          {dock.lastReply.length > 160 ? "…" : ""}
        </p>
      ) : null}
    </div>
  );
});
