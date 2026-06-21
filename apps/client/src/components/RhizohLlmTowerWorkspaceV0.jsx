import React, { memo, useMemo, useState } from "react";
import {
  resolveLlmTowerDesignV0,
  resolveLlmTowerProviderRowV0
} from "../rhizoh/runtime/llmTowerDesignV0.js";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";
import { RhizohTowerMediaConnectBarV0 } from "./RhizohTowerMediaConnectBarV0.jsx";
import { RhizohTowerVoiceChatV0 } from "./RhizohTowerVoiceChatV0.jsx";

/**
 * Provider-branded LLM tower workspace — unique design per tower + real gateway model.
 */
export const RhizohLlmTowerWorkspaceV0 = memo(function RhizohLlmTowerWorkspaceV0({
  node,
  onClose,
  uiLocale = "en",
  idToken = ""
}) {
  const tr = uiLocale === "tr";
  const towerId = String(node?.id || "tower");
  const design = useMemo(() => resolveLlmTowerDesignV0(towerId), [towerId]);
  const providerRow = useMemo(() => resolveLlmTowerProviderRowV0(towerId), [towerId]);
  const [visionFrame, setVisionFrame] = useState(null);
  const [activeRoom, setActiveRoom] = useState("voice");

  const title = tr ? design.nameTr : design.name;
  const tagline = tr ? design.taglineTr : design.tagline;
  const C = design.colors;
  const pinDescription = String(node?.description || "").trim();

  return (
    <div
      className="fixed inset-0 z-[450] flex flex-col"
      data-rhizoh-v11-surface-modal="1"
      style={{ background: C.background, color: C.text }}
      data-rhizoh-llm-tower-workspace={towerId}
      role="dialog"
      aria-label={title}
    >
      <header
        className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur-md"
        style={{ background: `${C.background}cc` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{design.icon}</span>
            <h1 className="truncate text-sm font-black tracking-wide" style={{ color: C.primary }}>
              {title}
            </h1>
          </div>
          <p className="mt-0.5 text-[10px] text-white/55">{tagline}</p>
          <p className="mt-1 text-[9px] font-mono text-white/40">
            {providerRow.provider} · {providerRow.model}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <RhizohTowerLiveStatusBadgeV0 towerId={towerId} uiLocale={uiLocale} />
            {(providerRow.capabilities || []).map((cap) => (
              <span
                key={cap}
                className="rounded-full border border-white/15 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/50"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10"
        >
          {tr ? "Kapat" : "Close"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-16 shrink-0 flex-col gap-1 border-r border-white/10 p-2 sm:w-20">
          {design.rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              title={room.name}
              onClick={() => setActiveRoom(room.id)}
              className={`rounded-lg px-1 py-2 text-center text-lg transition ${
                activeRoom === room.id
                  ? "border border-white/25 bg-white/10"
                  : "border border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {room.icon}
            </button>
          ))}
        </nav>

        <main className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          {pinDescription ? (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/70">
              {pinDescription}
            </p>
          ) : null}

          {activeRoom === "voice" || !design.rooms.some((r) => r.id === activeRoom) ? (
            <>
              <RhizohTowerMediaConnectBarV0
                uiLocale={uiLocale}
                previewSize="square"
                showMedusa={false}
                onFrameCapture={setVisionFrame}
              />
              {visionFrame && providerRow.provider === "gemini" ? (
                <p className="text-[9px] text-emerald-200/80">
                  {tr ? "Vision karesi bağlı." : "Vision frame attached."}
                </p>
              ) : null}
              <RhizohTowerVoiceChatV0
                towerId={towerId}
                uiLocale={uiLocale}
                surface={`${towerId}_workspace`}
                visionFrame={providerRow.provider === "gemini" ? visionFrame : null}
                idToken={idToken}
              />
              <p className="text-[9px] text-white/35">
                {tr
                  ? `Kule modeli: ${providerRow.model}`
                  : `Tower model: ${providerRow.model}`}
              </p>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 p-6 text-center">
              <span className="text-4xl">
                {design.rooms.find((r) => r.id === activeRoom)?.icon || design.icon}
              </span>
              <h3 className="mt-3 text-sm font-bold text-white">
                {design.rooms.find((r) => r.id === activeRoom)?.name || activeRoom}
              </h3>
              <p className="mt-2 max-w-md text-[11px] leading-relaxed text-white/60">
                {design.rooms.find((r) => r.id === activeRoom)?.description || ""}
              </p>
              <button
                type="button"
                onClick={() => setActiveRoom("voice")}
                className="mt-4 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: C.gradient }}
              >
                {tr ? "Voice Link'e geç" : "Open Voice Link"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
});
