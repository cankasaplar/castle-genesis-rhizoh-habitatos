import React, { memo, useCallback, useEffect, useState } from "react";
import {
  applySpiralMapRealityModeV0,
  listRealityModeRowsV0,
  readSpiralMapRealityModeV0,
  SPIRAL_MAP_REALITY_MODE_EVENT_V0
} from "../rhizoh/runtime/spiralMapRealityModeV0.js";
import {
  readSpiralMapLayerFilterStateV0,
  SPIRAL_MAP_LAYER_FILTER_EVENT_V0
} from "../rhizoh/runtime/spiralMapLayerFilterStateV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

export const RhizohWorldRealityModeSwitcherV0 = memo(function RhizohWorldRealityModeSwitcherV0({
  uiLocale,
  className = ""
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const [mode, setMode] = useState(() => readSpiralMapRealityModeV0());
  const rows = listRealityModeRowsV0();

  useEffect(() => {
    const refresh = () => setMode(readSpiralMapRealityModeV0(readSpiralMapLayerFilterStateV0()));
    window.addEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, refresh);
    window.addEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, refresh);
    return () => {
      window.removeEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, refresh);
      window.removeEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, refresh);
    };
  }, []);

  const selectMode = useCallback((modeId) => {
    applySpiralMapRealityModeV0(modeId);
    setMode(readSpiralMapRealityModeV0());
  }, []);

  return (
    <div
      className={`pointer-events-auto rounded-xl border border-violet-400/25 bg-[#030711]/92 px-2 py-1.5 backdrop-blur-md ${className}`.trim()}
      data-rhizoh-world-reality-mode-switcher="1"
    >
      <p className="mb-1 text-[7px] font-black uppercase tracking-[0.18em] text-violet-200/75">
        {tr ? "Reality Mode" : "Reality Mode"}
      </p>
      <div className="flex flex-wrap gap-1">
        {rows.map((row) => {
          const active = mode === row.id;
          return (
            <button
              key={row.id}
              type="button"
              title={tr ? row.hintTr : row.hintEn}
              onClick={() => selectMode(row.id)}
              className={`rounded-lg border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide transition ${
                active
                  ? row.id === "full_world"
                    ? "border-amber-400/55 bg-amber-500/20 text-amber-100"
                    : "border-violet-400/55 bg-violet-500/20 text-violet-100"
                  : "border-white/12 bg-white/5 text-white/45 hover:border-white/25 hover:text-white/80"
              }`}
            >
              {tr ? row.tr : row.en}
            </button>
          );
        })}
      </div>
    </div>
  );
});
