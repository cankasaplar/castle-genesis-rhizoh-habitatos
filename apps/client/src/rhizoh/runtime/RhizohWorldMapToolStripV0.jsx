import React, { memo } from "react";
import { RHIZOH_WORLD_MAP_TOOL_IDS_V0 } from "./rhizohWorldMapToolV0.js";
import { resolveWorldMapToolLabelV0 } from "./rhizohProductCopyI18nV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

/**
 * Compact map layer picker — shown when World panel is open.
 */
export const RhizohWorldMapToolStripV0 = memo(function RhizohWorldMapToolStripV0({
  activeTool = "globe",
  onSelect,
  className = "",
  style,
  uiLocale,
  cesiumReady = false
}) {
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";
  const visibleTools = cesiumReady
    ? RHIZOH_WORLD_MAP_TOOL_IDS_V0
    : RHIZOH_WORLD_MAP_TOOL_IDS_V0.filter((id) =>
        ["city_map", "streets", "satellite", "anchor_map"].includes(id)
      );
  return (
    <div
      className={`pointer-events-auto flex max-w-[min(36rem,96vw)] flex-wrap items-center justify-center gap-1 rounded-2xl border border-cyan-400/20 bg-black/60 px-1.5 py-1.5 backdrop-blur-md ${className}`}
      style={style}
      role="toolbar"
      aria-label={tr ? "Harita katmanı" : "Map layer"}
    >
      {visibleTools.map((id) => {
        const active = activeTool === id;
        const label = resolveWorldMapToolLabelV0(id, locale);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            title={
              active
                ? tr
                  ? `${label} · aktif`
                  : `${label} · active`
                : tr
                  ? `${label} · aç`
                  : `${label} · open`
            }
            onClick={() => onSelect?.(id)}
            className={`touch-manipulation rounded-full px-2.5 py-1 text-[8px] font-bold normal-case tracking-normal transition-colors sm:text-[9px] ${
              active
                ? "bg-cyan-500/30 text-cyan-50 border border-cyan-400/50"
                : "border border-transparent text-white/55 hover:border-white/15 hover:text-white/85"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
});
