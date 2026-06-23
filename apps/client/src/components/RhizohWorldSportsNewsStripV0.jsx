import React, { memo, useEffect, useMemo, useState } from "react";
import {
  buildWorldMapNewsLinesV0,
  buildWorldMapSportsLinesV0,
  buildWorldMapSportsNewsLinesV0,
  getWorldMapLiveFeedSnapshotV0,
  startWorldMapLiveFeedPollingV0
} from "../rhizoh/runtime/worldMapLiveFeedV0.js";

/**
 * Live sports scores/fixtures and/or news headlines (gateway-cached API-Sports + NewsData/Guardian).
 * @param {'sports'|'news'|'both'} [mode]
 */
export const RhizohWorldSportsNewsStripV0 = memo(function RhizohWorldSportsNewsStripV0({
  active = true,
  uiLocale = "tr",
  mode = "both",
  className = ""
}) {
  const tr = String(uiLocale).toLowerCase().startsWith("tr");
  const showSports = mode === "sports" || mode === "both";
  const showNews = mode === "news" || mode === "both";
  const [feed, setFeed] = useState(() => getWorldMapLiveFeedSnapshotV0());

  useEffect(() => {
    if (!active) return undefined;
    setFeed(getWorldMapLiveFeedSnapshotV0());
    const stop = startWorldMapLiveFeedPollingV0({ locale: uiLocale, onUpdate: setFeed });
    return stop;
  }, [active, uiLocale]);

  const lines = useMemo(() => {
    if (mode === "sports") return buildWorldMapSportsLinesV0(feed, uiLocale);
    if (mode === "news") return buildWorldMapNewsLinesV0(feed, uiLocale);
    return buildWorldMapSportsNewsLinesV0(feed, uiLocale);
  }, [feed, mode, uiLocale]);

  if (!active) return null;

  return (
    <div
      className={`space-y-1.5 rounded-xl border border-white/10 bg-[#030711]/88 px-2.5 py-2 text-[9px] text-white/80 ${className}`}
      data-rhizoh-world-sports-news-strip="1"
      data-rhizoh-world-feed-mode={mode}
      aria-live="polite"
    >
      {showSports ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[8px] uppercase tracking-wider text-cyan-200/70">
              {tr ? "Canlı spor" : "Live sports"}
            </p>
            <p className="font-mono text-[7px] text-white/35">{lines.sportsSource}</p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {lines.hasSports ? (
              lines.sportChips.map((chip, idx) => (
                <span
                  key={`${chip}-${idx}`}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[8px] text-white/85"
                >
                  {chip}
                </span>
              ))
            ) : (
              <span className="text-white/40">{lines.emptySportsLabel}</span>
            )}
          </div>
        </>
      ) : null}

      {showNews ? (
        <div className={showSports ? "border-t border-white/8 pt-1.5" : ""}>
          <p className="mb-1 font-mono text-[8px] uppercase tracking-wider text-amber-200/70">
            {tr ? "Haberler" : "Headlines"}
            {lines.newsProvider !== "none" ? (
              <span className="ml-1 text-white/35">· {lines.newsProvider}</span>
            ) : null}
          </p>
          <p className="line-clamp-3 text-[9px] leading-snug text-white/75">
            {lines.hasNews ? lines.newsLine : lines.emptyNewsLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
});
