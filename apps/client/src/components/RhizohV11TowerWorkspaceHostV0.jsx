import React, { memo } from "react";
import { GeminiTowerWorkspaceV0 } from "./GeminiTowerWorkspaceV0.jsx";
import { GEMINI_TOWER_DESIGN_V0 } from "../rhizoh/runtime/geminiTowerDesignV0.js";

/**
 * Routes V11 tower node clicks to the correct workspace surface.
 */
export const RhizohV11TowerWorkspaceHostV0 = memo(function RhizohV11TowerWorkspaceHostV0({
  workspaceDetail,
  onClose,
  uiLocale = "en"
}) {
  if (!workspaceDetail?.node) return null;

  const nodeId = String(workspaceDetail.node.id || "");
  const tr = uiLocale === "tr";

  if (nodeId === "gemini_tower") {
    return <GeminiTowerWorkspaceV0 open onClose={onClose} uiLocale={uiLocale} />;
  }

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-rhizoh-v11-generic-workspace="1"
    >
      <div
        className="w-full max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-md"
        style={{
          borderColor: `${workspaceDetail.node.color || "#22d3ee"}66`,
          background: GEMINI_TOWER_DESIGN_V0.identity.colors.background
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
              {tr ? "Tower workspace" : "Tower workspace"}
            </p>
            <h2 className="mt-1 text-sm font-black" style={{ color: workspaceDetail.node.color || "#22d3ee" }}>
              {workspaceDetail.node.label || nodeId}
            </h2>
            <p className="mt-1 text-[10px] text-white/55">
              {workspaceDetail.runtime?.workspaceId || `${nodeId}_workspace_v1`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/65">
          {tr
            ? "Bu tower için özel workspace henüz bağlanmadı. Gemini tower referans tasarımı kullanılabilir."
            : "Dedicated workspace for this tower is not wired yet. Use Gemini tower as the reference design."}
        </p>
      </div>
    </div>
  );
});
