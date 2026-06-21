import React, { memo, useCallback } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import { dispatchLocalCommandHandlerV0 } from "../rhizoh/runtime/rhizohLocalCommandHandlersV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { readCastleNexusGeoV0 } from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import { dispatchSovereignVoiceWarpV0 } from "../rhizoh/runtime/sovereignWorldMapNodesV0.js";

/**
 * Minimal map navigation — zoom + recenter (World · Space only).
 */
export const RhizohWorldMapControlsV0 = memo(function RhizohWorldMapControlsV0({
  active = false,
  uiLocale,
  className = ""
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";

  const zoomIn = useCallback(() => {
    dispatchLocalCommandHandlerV0("map_zoom_in", { traceId: `world-map-ui-${Date.now()}` });
  }, []);

  const zoomOut = useCallback(() => {
    dispatchLocalCommandHandlerV0("map_zoom_out", { traceId: `world-map-ui-${Date.now()}` });
  }, []);

  const recenter = useCallback(() => {
    const nexus = readCastleNexusGeoV0();
    if (nexus) {
      dispatchSovereignVoiceWarpV0(
        { lat: nexus.lat, lon: nexus.lon, name: nexus.label || "My Castle", zoom: 16 },
        "world_map_controls"
      );
      return;
    }
    dispatchLocalCommandHandlerV0("map_recenter", { traceId: `world-map-ui-${Date.now()}` });
  }, []);

  if (!active) return null;

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-1.5 rounded-2xl border border-cyan-400/30 bg-[#050812] p-1.5 shadow-lg ${className}`}
      data-rhizoh-world-map-controls="1"
      aria-label={tr ? "Harita kontrolleri" : "Map controls"}
    >
      <button
        type="button"
        onClick={zoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 text-cyan-100/90 hover:border-cyan-400/40 hover:bg-cyan-500/10"
        title={tr ? "Yakınlaştır" : "Zoom in"}
        aria-label={tr ? "Yakınlaştır" : "Zoom in"}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={zoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 text-cyan-100/90 hover:border-cyan-400/40 hover:bg-cyan-500/10"
        title={tr ? "Uzaklaştır" : "Zoom out"}
        aria-label={tr ? "Uzaklaştır" : "Zoom out"}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={recenter}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 text-cyan-100/90 hover:border-cyan-400/40 hover:bg-cyan-500/10"
        title={tr ? "Merkeze dön" : "Recenter"}
        aria-label={tr ? "Merkeze dön" : "Recenter"}
      >
        <Crosshair className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
});
