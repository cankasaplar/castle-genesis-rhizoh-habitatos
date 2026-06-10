import React, { memo, useCallback } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import { dispatchLocalCommandHandlerV0 } from "../rhizoh/runtime/rhizohLocalCommandHandlersV0.js";
import { routeCesiumCommandV0 } from "../castleFlight/cesiumCommandRouterV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

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
    routeCesiumCommandV0({
      op: "calibration_root",
      source: "world_map_controls",
      meta: Object.freeze({ ingress: "RhizohWorldMapControlsV0" })
    });
  }, []);

  if (!active) return null;

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-1.5 rounded-2xl border border-cyan-400/25 bg-[#030711]/88 p-1.5 shadow-lg backdrop-blur-md ${className}`}
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
