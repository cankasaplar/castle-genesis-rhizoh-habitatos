import React, { memo, useCallback, useEffect, useState } from "react";
import {
  focusSpiralMapLayerV0,
  listSpiralMapLayerFilterRowsV0,
  readSpiralMapLayerFilterStateV0,
  SPIRAL_MAP_LAYER_FILTER_EVENT_V0,
  writeSpiralMapLayerFilterStateV0
} from "../rhizoh/runtime/spiralMapLayerFilterStateV0.js";
import { SPIRAL_MAP_LAYER_V0 } from "../rhizoh/runtime/spatialDistributionLayerV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

function readArenaPopulationCountsV0() {
  if (typeof window === "undefined") return null;
  try {
    const byLayer = window.__rhizoh?.arenaPopulationByLayer?.();
    if (!byLayer) return null;
    return {
      explorer: byLayer[SPIRAL_MAP_LAYER_V0.EXPLORER]?.length ?? 0,
      castle: byLayer[SPIRAL_MAP_LAYER_V0.CASTLE]?.length ?? 0,
      economy: byLayer[SPIRAL_MAP_LAYER_V0.ECONOMY]?.length ?? 0,
      seasonal: byLayer[SPIRAL_MAP_LAYER_V0.SEASONAL]?.length ?? 0
    };
  } catch {
    return null;
  }
}

export const RhizohSpiralMapLayerFilterV0 = memo(function RhizohSpiralMapLayerFilterV0({
  uiLocale
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const [state, setState] = useState(readSpiralMapLayerFilterStateV0());
  const [counts, setCounts] = useState(readArenaPopulationCountsV0);
  const rows = listSpiralMapLayerFilterRowsV0();

  useEffect(() => {
    const refresh = () => {
      setState(readSpiralMapLayerFilterStateV0());
      setCounts(readArenaPopulationCountsV0());
    };
    const onFilter = (e) => {
      if (e.detail?.state) setState(e.detail.state);
      else refresh();
    };
    window.addEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, onFilter);
    window.addEventListener("rhizoh:arena-population-v0", refresh);
    window.addEventListener("rhizoh:prism-cube-map-pins-v0", refresh);
    return () => {
      window.removeEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, onFilter);
      window.removeEventListener("rhizoh:arena-population-v0", refresh);
      window.removeEventListener("rhizoh:prism-cube-map-pins-v0", refresh);
    };
  }, []);

  const toggle = useCallback(
    (key) => {
      setState(
        writeSpiralMapLayerFilterStateV0({
          [key]: !state[key],
          realityMode: null
        })
      );
    },
    [state]
  );

  const focusLayer = useCallback((key) => {
    setState(focusSpiralMapLayerV0(key));
  }, []);

  const toggleDormant = useCallback(() => {
    setState(writeSpiralMapLayerFilterStateV0({ includeDormant: !state.includeDormant }));
  }, [state.includeDormant]);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {rows.map((row) => {
          const active = state[row.key] === true;
          const count = counts?.[row.key];
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => toggle(row.key)}
              onDoubleClick={() => focusLayer(row.key)}
              title={tr ? row.descriptionTr : row.descriptionEn}
              className={`rounded-lg border px-2 py-1 text-[8px] font-semibold uppercase tracking-wide transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/12 bg-white/5 text-white/45 hover:border-white/25"
              }`}
            >
              {tr ? row.tr : row.en}
              {typeof count === "number" ? ` · ${count}` : ""}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[8px] text-white/45">
        <label className="inline-flex cursor-pointer items-center gap-1">
          <input
            type="checkbox"
            checked={state.includeDormant === true}
            onChange={toggleDormant}
            className="h-3 w-3 accent-violet-400"
          />
          <span>{tr ? "Dormant seed pinleri göster" : "Show dormant seed pins"}</span>
        </label>
        <span className="text-white/30">
          {tr ? "Çift tık = tek katman odak" : "Double-click = single-layer focus"}
        </span>
      </div>
    </div>
  );
});
