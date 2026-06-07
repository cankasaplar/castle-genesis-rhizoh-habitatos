import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CASTLE_PWE_EVENT_V0, readCastlePweV0 } from "../castleFlight/castlePersistentWorldEntityV0.js";
import { buildCompanionTimelineV0 } from "../castleFlight/companionTimelineV0.js";

const KIND_LABELS = Object.freeze({
  observation: "Gözlem",
  conversation: "Konuşma",
  training: "Eğitim",
  exploration: "Keşif",
  presence: "Presence",
  castle: "Castle",
  studio: "Studio"
});

function formatAtMs(atMs) {
  try {
    return new Date(atMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

export const CompanionTimelinePanelV0 = memo(function CompanionTimelinePanelV0() {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    window.addEventListener(CASTLE_PWE_EVENT_V0, bump);
    return () => window.removeEventListener(CASTLE_PWE_EVENT_V0, bump);
  }, [bump]);

  void tick;
  const pwe = readCastlePweV0();
  const timeline = useMemo(() => buildCompanionTimelineV0(pwe, { limit: 10 }), [pwe, tick]);

  if (!pwe?.mounted) return null;

  return (
    <section
      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 space-y-2 normal-case"
      data-companion-timeline="1"
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-white/70">Companion timeline</p>
      {timeline.rows.length === 0 ? (
        <p className="text-[9px] text-white/45">Henüz kayıt yok — gözlem ve studio olayları burada birikecek.</p>
      ) : (
        <ul className="space-y-1.5 max-h-36 overflow-y-auto">
          {timeline.rows.map((row) => (
            <li
              key={`${row.atMs}-${row.action}-${row.label}`}
              className="flex gap-2 text-[9px] text-white/75 border-b border-white/5 pb-1"
            >
              <span className="shrink-0 w-14 text-violet-300/80 uppercase text-[8px]">
                {KIND_LABELS[row.kind] || row.kind}
              </span>
              <span className="flex-1">{row.label}</span>
              <time className="shrink-0 text-white/40 font-mono text-[8px]">{formatAtMs(row.atMs)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
