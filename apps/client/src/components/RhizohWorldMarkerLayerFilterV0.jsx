import React, { memo, useCallback, useEffect, useState } from "react";
import {
  listVisibleWorldMapMarkerLayerRowsV0,
  readWorldMapMarkerLayerStateV0,
  writeWorldMapMarkerLayerStateV0,
  WORLD_MAP_MARKER_LAYER_EVENT_V0
} from "../rhizoh/runtime/worldMapMarkerLayerStateV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

export const RhizohWorldMarkerLayerFilterV0 = memo(function RhizohWorldMarkerLayerFilterV0({
  uiLocale
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const [state, setState] = useState(readWorldMapMarkerLayerStateV0());
  const rows = listVisibleWorldMapMarkerLayerRowsV0();

  useEffect(() => {
    const onChange = (e) => {
      if (e.detail?.state) setState(e.detail.state);
      else setState(readWorldMapMarkerLayerStateV0());
    };
    window.addEventListener(WORLD_MAP_MARKER_LAYER_EVENT_V0, onChange);
    return () => window.removeEventListener(WORLD_MAP_MARKER_LAYER_EVENT_V0, onChange);
  }, []);

  const toggle = useCallback((key) => {
    setState(writeWorldMapMarkerLayerStateV0({ [key]: !state[key] }));
  }, [state]);

  return (
    <div className="flex flex-wrap gap-2 text-[8px] text-white/70">
      {rows.map((row) => (
        <label key={row.key} className="inline-flex cursor-pointer items-center gap-1" title={row.tier}>
          <input
            type="checkbox"
            checked={state[row.key] !== false}
            onChange={() => toggle(row.key)}
            className="h-3 w-3 accent-cyan-400"
          />
          <span>{tr ? row.tr : row.en}</span>
        </label>
      ))}
      <span className="text-white/35">
        {tr ? "Placeholder ve witness marker'ları gizli." : "Placeholder and witness markers are hidden."}
      </span>
    </div>
  );
});
