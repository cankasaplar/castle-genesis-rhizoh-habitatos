import React, { memo, useCallback, useEffect, useState } from "react";
import { RealityDirector } from "../reality/realityDirector.js";
import { subscribeRealityTransition } from "../reality/realityEventBus.js";
import { WORLD_MESH_LABELS_V0 } from "../rhizoh/spatial/worldMeshLabelsV0.js";

/**
 * Sol üst — Topology globe / Observation map (eski L2 chrome).
 */
export const RhizohRealityModeChromeV0 = memo(function RhizohRealityModeChromeV0({ className = "" }) {
  const [mode, setMode] = useState("REAL_MAP");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return subscribeRealityTransition((ev) => {
      if (ev?.to) setMode(ev.to);
    });
  }, []);

  const applyCameraForMode = useCallback((next) => {
    const c = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
    if (!c?.ready) return;
    if (next === "GLOBE") c.flyToTopologyGlobe?.();
    else c.flyToBootstrapViewport?.();
  }, []);

  const selectMode = useCallback(
    async (next) => {
      if (busy || next === mode) return;
      setBusy(true);
      try {
        await RealityDirector.setMode(next, { source: "reality_chrome_v0" });
        applyCameraForMode(next);
      } catch (e) {
        console.warn("[RhizohRealityModeChrome]", e);
      } finally {
        setBusy(false);
      }
    },
    [applyCameraForMode, busy, mode]
  );

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-2 ${className}`}
      data-rhizoh-reality-chrome="1"
      data-reality-mode={mode}
    >
      <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/45">
        {WORLD_MESH_LABELS_V0.activeLayerChromeLabel}
      </p>
      <div className="flex flex-wrap gap-1">
        <ModeBtn
          active={mode === "GLOBE"}
          disabled={busy}
          label={WORLD_MESH_LABELS_V0.realityModeGlobeDisplay}
          onClick={() => void selectMode("GLOBE")}
        />
        <ModeBtn
          active={mode === "REAL_MAP"}
          disabled={busy}
          label={WORLD_MESH_LABELS_V0.realityModeRealMapDisplay}
          onClick={() => void selectMode("REAL_MAP")}
        />
      </div>
      <p className="max-w-[14rem] text-[7px] leading-snug text-white/40 normal-case">
        {WORLD_MESH_LABELS_V0.cameraDeckDroneHint}
      </p>
    </div>
  );
});

/** @param {{ active: boolean, label: string, onClick: () => void, disabled?: boolean }} props */
function ModeBtn({ active, label, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-wide transition ${
        active
          ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
          : "border-white/15 bg-black/55 text-white/55 hover:border-white/25 hover:text-white/80"
      } disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
