import React, { memo, useCallback, useSyncExternalStore } from "react";
import {
  RHIZOH_WORLD_SYSTEM_MODE_V0,
  readRhizohWorldSystemModeV0,
  subscribeRhizohWorldSystemModeV0,
  writeRhizohWorldSystemModeV0
} from "../rhizoh/runtime/rhizohWorldSystemModeV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

const MODE_ITEMS_V0 = Object.freeze([
  {
    id: RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS,
    titleTr: "Robotics",
    titleEn: "Robotics",
    blurbTr: "Ajan davranışı · otonomi · görev yönlendirme",
    blurbEn: "Agent behavior · autonomy · task routing"
  },
  {
    id: RHIZOH_WORLD_SYSTEM_MODE_V0.SPIRAL,
    titleTr: "Spiral MMO",
    titleEn: "Spiral MMO",
    blurbTr: "Oyun-zaman simülasyonu · olay tetikleme",
    blurbEn: "Game-time simulation · event triggers"
  },
  {
    id: RHIZOH_WORLD_SYSTEM_MODE_V0.DREAM,
    titleTr: "Dream",
    titleEn: "Dream",
    blurbTr: "Anlatı · görsel distorsiyon · yaratım",
    blurbEn: "Narrative · visual distortion · creation"
  },
  {
    id: RHIZOH_WORLD_SYSTEM_MODE_V0.SIMULATION,
    titleTr: "Simulation",
    titleEn: "Simulation",
    blurbTr: "Ghost katman · replay · kural setleri",
    blurbEn: "Ghost layer · replay · rule sets"
  }
]);

/**
 * World drawer · Modes tab — system behavior (not space, not social).
 */
export const RhizohWorldModesPanelV0 = memo(function RhizohWorldModesPanelV0({
  uiLocale,
  onModeSelect
}) {
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";

  const activeMode = useSyncExternalStore(
    subscribeRhizohWorldSystemModeV0,
    readRhizohWorldSystemModeV0,
    readRhizohWorldSystemModeV0
  );

  const selectMode = useCallback(
    (id) => {
      writeRhizohWorldSystemModeV0(id);
      onModeSelect?.(id);
    },
    [onModeSelect]
  );

  return (
    <div className="space-y-3 normal-case" data-rhizoh-world-modes-panel="1">
      <p className="text-[10px] leading-relaxed text-white/60">
        {tr
          ? "Davranış katmanı — dünyanın üçüncü boyutu. Harita ve sosyalden ayrıdır."
          : "Behavior layer — the world's third dimension. Separate from map and social."}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {MODE_ITEMS_V0.map((item) => {
          const active = activeMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectMode(item.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-violet-400/45 bg-violet-950/30 shadow-[0_0_16px_rgba(139,92,246,0.12)]"
                  : "border-white/15 bg-black/20 hover:border-violet-400/30"
              }`}
              data-rhizoh-system-mode={item.id}
              aria-pressed={active}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-violet-200/95">
                {tr ? item.titleTr : item.titleEn}
              </p>
              <p className="mt-1 text-[9px] text-white/45">{tr ? item.blurbTr : item.blurbEn}</p>
            </button>
          );
        })}
      </div>
      <p className="text-[8px] text-white/35">
        {tr
          ? "Sağ üstteki wheel aktif moda göre değişir — Academy ve Observe burada değil (Profile/Studio)."
          : "Top-right wheel changes with active mode — Academy and Observe live under Profile/Studio."}
      </p>
    </div>
  );
});
