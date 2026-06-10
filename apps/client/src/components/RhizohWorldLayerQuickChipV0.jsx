import React, { memo } from "react";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

const QUICK_LAYERS_V0 = Object.freeze([
  { tool: "streets", code: "CYBER_DARK" },
  { tool: "satellite", code: "ORBIT_SATELLITE" },
  { tool: "city_map", code: "CITY_3D" }
]);

/**
 * Top-left quick layer chips — maps to existing world map tools (not a parallel state).
 */
export const RhizohWorldLayerQuickChipV0 = memo(function RhizohWorldLayerQuickChipV0({
  activeTool = "city_map",
  onSelect,
  uiLocale,
  className = ""
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  if (!onSelect) return null;

  return (
    <div
      className={`pointer-events-auto flex flex-wrap gap-1.5 ${className}`}
      data-rhizoh-world-layer-quick-chip="1"
      role="toolbar"
      aria-label={tr ? "Hızlı katman" : "Quick layer"}
    >
      {QUICK_LAYERS_V0.map((row) => {
        const active = activeTool === row.tool;
        return (
          <button
            key={row.tool}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(row.tool)}
            className={`rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition ${
              active
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                : "border-cyan-500/30 bg-black/80 text-cyan-400/85 hover:border-cyan-400/45 hover:text-cyan-200"
            }`}
          >
            {`// ${row.code}`}
          </button>
        );
      })}
    </div>
  );
});
