import React, { memo, useCallback, useEffect, useState } from "react";
import {
  readWorldMapMarkerLayerStateV0,
  writeWorldMapMarkerLayerStateV0,
  WORLD_MAP_MARKER_LAYER_EVENT_V0
} from "../rhizoh/runtime/worldMapMarkerLayerStateV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

const ROWS_V0 = Object.freeze([
  { key: "systemAnchors", tr: "Sistem çapaları", en: "System anchors" },
  { key: "ecosystemNodes", tr: "Ekosistem düğümleri", en: "Ecosystem nodes" },
  { key: "userCastle", tr: "Kalem", en: "My castle" },
  { key: "ghostCastles", tr: "Hayalet kaleler", en: "Ghost castles" },
  { key: "coPresence", tr: "Canlı tanıklar", en: "Live witnesses" },
  { key: "epistemicPoi", tr: "POI (yakın)", en: "POI (nearby)" }
]);

export const RhizohWorldMarkerLayerFilterV0 = memo(function RhizohWorldMarkerLayerFilterV0({
  uiLocale
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const [state, setState] = useState(readWorldMapMarkerLayerStateV0());

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
      {ROWS_V0.map((row) => (
        <label key={row.key} className="inline-flex cursor-pointer items-center gap-1">
          <input
            type="checkbox"
            checked={state[row.key] !== false}
            onChange={() => toggle(row.key)}
            className="h-3 w-3 accent-cyan-400"
          />
          <span>{tr ? row.tr : row.en}</span>
        </label>
      ))}
    </div>
  );
});
