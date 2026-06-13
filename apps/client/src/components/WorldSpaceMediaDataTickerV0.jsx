import React, { memo, useEffect, useState } from "react";
import { refreshMediaTubeTickerPayloadV0 } from "../rhizoh/runtime/worldSpaceMediaDataTickerV0.js";
import { startWorldMapLiveFeedPollingV0 } from "../rhizoh/runtime/worldMapLiveFeedV0.js";

/**
 * Scrolling real-data ticker — Open-Meteo weather + gateway sports/news when configured.
 */
export const WorldSpaceMediaDataTickerV0 = memo(function WorldSpaceMediaDataTickerV0({
  active = true,
  uiLocale = "tr"
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    const refresh = () => {
      void refreshMediaTubeTickerPayloadV0({ locale: uiLocale }).then((payload) => {
        if (!cancelled) setText(payload.text || "");
      });
    };

    refresh();
    const stopFeed = startWorldMapLiveFeedPollingV0({
      locale: uiLocale,
      intervalMs: 5 * 60 * 1000,
      onUpdate: () => refresh()
    });
    const id = window.setInterval(refresh, 4 * 60 * 1000);

    return () => {
      cancelled = true;
      stopFeed();
      window.clearInterval(id);
    };
  }, [active, uiLocale]);

  if (!active) return null;

  const display = text || (uiLocale === "tr" ? "Canlı veri yükleniyor…" : "Loading live data…");
  const loop = `${display}   ◆   ${display}`;

  return (
    <div
      className="relative overflow-hidden border-t border-cyan-500/25 bg-black/90 py-2"
      data-rhizoh-world-space-media-ticker="1"
      aria-live="polite"
    >
      <div className="pointer-events-none flex whitespace-nowrap">
        <div
          className="min-w-full shrink-0 animate-[rhizoh-ticker_48s_linear_infinite] px-4 font-mono text-[10px] tracking-wide text-cyan-100/85"
        >
          {loop}
        </div>
      </div>
      <style>{`
        @keyframes rhizoh-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
});
