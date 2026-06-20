import React, { memo, useEffect, useState } from "react";
import { Clock, Scale, Tv } from "lucide-react";
import {
  readCityMapLegalGateSnapshotV0,
  RHIZOH_CITY_MAP_LEGAL_GATE_TICK_EVENT_V0
} from "../rhizoh/runtime/cityMapLegalCountdownMediaGateV0.js";
import {
  labelCastleMediaEventStateV0,
  CASTLE_MEDIA_EVENT_STATE_V0
} from "../rhizoh/runtime/castleArchiveMediaMetaV0.js";

function formatCountdownMsV0(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSec = Math.floor(safe / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * City map legal-hold strip — countdown + YouTube Castle Genesis until legal ack.
 */
export const RhizohCityMapLegalCountdownStripV0 = memo(function RhizohCityMapLegalCountdownStripV0({
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [snap, setSnap] = useState(() => readCityMapLegalGateSnapshotV0());

  useEffect(() => {
    const refresh = () => setSnap(readCityMapLegalGateSnapshotV0());
    const onTick = (ev) => setSnap(ev?.detail || readCityMapLegalGateSnapshotV0());
    window.addEventListener(RHIZOH_CITY_MAP_LEGAL_GATE_TICK_EVENT_V0, onTick);
    const id = window.setInterval(refresh, 1000);
    return () => {
      window.removeEventListener(RHIZOH_CITY_MAP_LEGAL_GATE_TICK_EVENT_V0, onTick);
      window.clearInterval(id);
    };
  }, []);

  if (!snap.legalHold && snap.legalAcked) return null;

  return (
    <div
      className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-950/40 px-3 py-2 text-[10px] text-amber-100 shadow-lg backdrop-blur-md"
      data-rhizoh-city-map-legal-gate="1"
      data-rhizoh-world-space-chrome="1"
      data-rhizoh-legal-hold={snap.legalHold ? "1" : "0"}
    >
      <Scale size={14} className="shrink-0 text-amber-300" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold uppercase tracking-wider">
          {tr ? "Yasal onay · City Map" : "Legal hold · City Map"}
        </p>
        <p className="text-[9px] normal-case text-amber-100/70">
          {tr
            ? "V11 harita açık — Castle Genesis yayını ve topluluk verisi toplanıyor"
            : "V11 map open — Castle Genesis broadcast + community data ingest"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono tabular-nums">
          <Clock size={11} />
          {formatCountdownMsV0(snap.countdownRemainingMs)}
        </span>
        <span className="flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1">
          <Tv size={11} />
          {labelCastleMediaEventStateV0(
            snap.eventState || CASTLE_MEDIA_EVENT_STATE_V0.COUNTDOWN,
            tr
          )}
        </span>
      </div>
    </div>
  );
});
