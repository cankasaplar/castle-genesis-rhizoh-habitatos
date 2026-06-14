import React, { memo, useState } from "react";
import { GEMINI_TOWER_DESIGN_V0 } from "../rhizoh/runtime/geminiTowerDesignV0.js";
import { resolveRhizohTowerLabelV0 } from "../rhizoh/runtime/rhizohTowerProviderRegistryV0.js";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";
import { RhizohTowerMediaConnectBarV0 } from "./RhizohTowerMediaConnectBarV0.jsx";
import { RhizohTowerVoiceChatV0 } from "./RhizohTowerVoiceChatV0.jsx";

/**
 * Shared LLM tower workspace — camera/mic + provider chat (all non-Gemini-custom towers).
 */
export const RhizohLlmTowerWorkspaceV0 = memo(function RhizohLlmTowerWorkspaceV0({
  node,
  onClose,
  uiLocale = "en",
  idToken = ""
}) {
  const tr = uiLocale === "tr";
  const towerId = String(node?.id || "tower");
  const label = resolveRhizohTowerLabelV0(towerId, tr);
  const color = node?.color || "#22d3ee";
  const [visionFrame, setVisionFrame] = useState(null);

  return (
    <div
      className="fixed inset-0 z-[320] flex flex-col"
      style={{ background: GEMINI_TOWER_DESIGN_V0.identity.colors.background, color: "#f8fafc" }}
      data-rhizoh-llm-tower-workspace={towerId}
      role="dialog"
      aria-label={label}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h1 className="text-sm font-black tracking-wide" style={{ color }}>
            {label}
          </h1>
          <p className="text-[10px] text-white/50">
            {node?.description ||
              (tr ? "Sohbet, ses ve kamera — gateway üzerinden" : "Chat, voice, and camera — via gateway")}
          </p>
          <div className="mt-1">
            <RhizohTowerLiveStatusBadgeV0 towerId={towerId} uiLocale={uiLocale} compact />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10"
        >
          {tr ? "Kapat" : "Close"}
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <RhizohTowerMediaConnectBarV0
          uiLocale={uiLocale}
          onFrameCapture={setVisionFrame}
          showVisionCapture
        />
        {visionFrame ? (
          <p className="text-[9px] text-emerald-200/80">
            {tr ? "Vision karesi bağlı — sohbet çok modlu gider." : "Vision frame attached — chat is multimodal."}
          </p>
        ) : null}
        <RhizohTowerVoiceChatV0
          towerId={towerId}
          uiLocale={uiLocale}
          surface="tower_workspace"
          visionFrame={visionFrame}
          idToken={idToken}
        />
      </div>
    </div>
  );
});
