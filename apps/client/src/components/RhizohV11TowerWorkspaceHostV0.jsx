import React, { memo, useEffect, useState } from "react";
import { useCastleAuth } from "../firebase/useCastleAuth.js";
import { GeminiTowerWorkspaceV0 } from "./GeminiTowerWorkspaceV0.jsx";
import { RhizohLlmTowerWorkspaceV0 } from "./RhizohLlmTowerWorkspaceV0.jsx";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";

/**
 * Routes V11 tower node clicks to the correct workspace surface.
 */
export const RhizohV11TowerWorkspaceHostV0 = memo(function RhizohV11TowerWorkspaceHostV0({
  workspaceDetail,
  onClose,
  uiLocale = "en"
}) {
  const castleAuth = useCastleAuth();
  const [idToken, setIdToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    const user = castleAuth?.user;
    if (!user?.getIdToken) {
      setIdToken("");
      return undefined;
    }
    void user.getIdToken().then((token) => {
      if (!cancelled) setIdToken(String(token || ""));
    });
    return () => {
      cancelled = true;
    };
  }, [castleAuth?.user]);

  if (!workspaceDetail?.node) return null;

  const node = workspaceDetail.node;
  const nodeId = String(node.id || "");
  const tr = uiLocale === "tr";

  if (nodeId === "gemini_tower") {
    return <GeminiTowerWorkspaceV0 open onClose={onClose} uiLocale={uiLocale} />;
  }

  if (node.type === "tower" || nodeId.endsWith("_tower")) {
    return (
      <RhizohLlmTowerWorkspaceV0
        node={node}
        onClose={onClose}
        uiLocale={uiLocale}
        idToken={idToken}
      />
    );
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
          background: "#0c1222"
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
            <div className="mt-1">
              <RhizohTowerLiveStatusBadgeV0 towerId={nodeId} uiLocale={uiLocale} compact />
            </div>
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
            ? "Bu düğüm için özel workspace henüz yok."
            : "No dedicated workspace for this node yet."}
        </p>
      </div>
    </div>
  );
});
