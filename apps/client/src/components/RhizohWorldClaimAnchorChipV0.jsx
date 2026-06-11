import React, { memo, useCallback, useEffect, useState } from "react";
import {
  readWorldMapClaimModeV0,
  writeWorldMapClaimModeV0,
  WORLD_MAP_CLAIM_MODE_EVENT_V0
} from "../rhizoh/runtime/worldMapClaimModeV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

export const RhizohWorldClaimAnchorChipV0 = memo(function RhizohWorldClaimAnchorChipV0({
  active = false,
  uiLocale,
  className = ""
}) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const [armed, setArmed] = useState(readWorldMapClaimModeV0());

  useEffect(() => {
    const onMode = (e) => setArmed(!!e.detail?.enabled);
    window.addEventListener(WORLD_MAP_CLAIM_MODE_EVENT_V0, onMode);
    return () => window.removeEventListener(WORLD_MAP_CLAIM_MODE_EVENT_V0, onMode);
  }, []);

  const toggle = useCallback(() => {
    setArmed(writeWorldMapClaimModeV0(!readWorldMapClaimModeV0()));
  }, []);

  if (!active) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold normal-case tracking-normal transition ${className} ${
        armed
          ? "border-purple-400/70 bg-purple-500/25 text-purple-100"
          : "border-purple-500/35 bg-black/75 text-purple-300/90 hover:border-purple-400/50"
      }`}
      aria-pressed={armed}
    >
      {armed
        ? tr
          ? "Çapa modu açık — haritaya tıkla"
          : "Anchor mode on — click map"
        : tr
          ? "Konum seç"
          : "Choose place"}
    </button>
  );
});
