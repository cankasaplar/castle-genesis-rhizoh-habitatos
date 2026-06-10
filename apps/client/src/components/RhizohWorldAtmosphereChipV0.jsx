import React, { memo, useEffect, useState } from "react";
import {
  getWorldMapLiveContextSnapshotV0,
  refreshWorldMapTrafficFeedIfStaleV0,
  startWorldMapLiveContextPollingV0
} from "../rhizoh/runtime/worldMapLiveContextV0.js";
import { refreshWeatherAtmosphereFeedIfStaleV0 } from "../rhizoh/runtime/worldPresenceStoreV0.js";
import { WORLD_MAP_GEO_REQUEST_EVENT_V0 } from "../rhizoh/runtime/worldMapGeoRequestV0.js";

/**
 * Live clock + weather + traffic chip for World · Space map layers.
 */
export const RhizohWorldAtmosphereChipV0 = memo(function RhizohWorldAtmosphereChipV0({
  active = true,
  uiLocale = "tr",
  className = ""
}) {
  const tr = String(uiLocale).toLowerCase().startsWith("tr");
  const [snap, setSnap] = useState(() => getWorldMapLiveContextSnapshotV0(uiLocale));

  useEffect(() => {
    if (!active) return undefined;
    setSnap(getWorldMapLiveContextSnapshotV0(uiLocale));
    const stop = startWorldMapLiveContextPollingV0({
      locale: uiLocale,
      onUpdate: setSnap
    });
    const onGeo = () => {
      void refreshWeatherAtmosphereFeedIfStaleV0({ force: true }).then(() =>
        setSnap(getWorldMapLiveContextSnapshotV0(uiLocale))
      );
      void refreshWorldMapTrafficFeedIfStaleV0({ force: true }).then(() =>
        setSnap(getWorldMapLiveContextSnapshotV0(uiLocale))
      );
    };
    window.addEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    return () => {
      stop();
      window.removeEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    };
  }, [active, uiLocale]);

  if (!active) return null;

  const hasWeather = Boolean(snap.weatherLine);
  const hasTraffic = Boolean(snap.trafficLine);

  return (
    <div
      className={`rounded-xl border border-cyan-400/25 bg-[#030711]/92 px-2.5 py-1.5 text-[9px] leading-snug text-white/85 backdrop-blur-md ${className}`}
      data-rhizoh-world-atmosphere-chip="1"
      aria-live="polite"
    >
      <p className="font-mono text-[10px] font-semibold tracking-wide text-cyan-100/95">
        {snap.timeLabel}
        <span className="ml-1.5 font-sans text-[8px] uppercase tracking-wider text-white/45">
          {tr ? "yerel" : "local"}
        </span>
      </p>
      {hasWeather ? (
        <p className="mt-0.5 text-white/75">{snap.weatherLine}</p>
      ) : (
        <p className="mt-0.5 text-white/40">{tr ? "hava yükleniyor…" : "loading weather…"}</p>
      )}
      {hasTraffic ? (
        <p className="mt-0.5 font-mono text-[8px] uppercase tracking-wide text-amber-200/80">
          {snap.trafficLine}
        </p>
      ) : null}
    </div>
  );
});
