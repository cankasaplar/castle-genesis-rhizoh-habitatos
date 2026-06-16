import React, { memo, useEffect, useState } from "react";
import { Compass, Loader2 } from "lucide-react";
import {
  isMapTransitionBusyV0,
  RHIZOH_MAP_TRANSITION_PHASE_EVENT_V0
} from "../rhizoh/runtime/worldMapMeaningfulTransitionV0.js";

/**
 * Transient strip — shows map approach / dwell before pin actions commit.
 */
export const RhizohMapTransitionApproachStripV0 = memo(function RhizohMapTransitionApproachStripV0({
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    const refresh = () => {
      const snap = typeof window !== "undefined" ? window.__rhizoh?.mapTransition : null;
      if (!snap || snap.phase === "idle" || !isMapTransitionBusyV0()) {
        setPhase(null);
        return;
      }
      setPhase(snap);
    };
    const onPhase = (ev) => {
      const snap = ev?.detail;
      if (!snap || snap.phase === "idle") {
        setPhase(null);
        return;
      }
      setPhase(snap);
    };
    window.addEventListener(RHIZOH_MAP_TRANSITION_PHASE_EVENT_V0, onPhase);
    refresh();
    return () => window.removeEventListener(RHIZOH_MAP_TRANSITION_PHASE_EVENT_V0, onPhase);
  }, []);

  if (!phase) return null;

  const label = String(phase.label || phase.nodeId || "");
  const phaseCopy =
    phase.phase === "approach"
      ? tr
        ? "Haritada yaklaşılıyor"
        : "Approaching on map"
      : phase.phase === "dwell"
        ? tr
          ? "Duraklama — ne açılacağını oku"
          : "Pause — read what opens next"
        : phase.phase === "spiral_immersion_pending"
          ? tr
            ? "SpiralMMO yuvası hazırlanıyor"
            : "Preparing SpiralMMO nest"
          : tr
            ? "Geçiş"
            : "Transition";

  return (
    <div
      className="pointer-events-none flex items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-950/50 px-3 py-2 text-[10px] text-cyan-100 shadow-lg backdrop-blur-md"
      data-rhizoh-map-transition-strip="1"
      data-rhizoh-map-transition-phase={phase.phase}
    >
      <Loader2 size={14} className="shrink-0 animate-spin text-cyan-300" />
      <Compass size={14} className="shrink-0 text-cyan-300/80" />
      <div className="min-w-0">
        <p className="font-semibold uppercase tracking-wider">{phaseCopy}</p>
        {label ? <p className="truncate text-[9px] normal-case text-cyan-100/70">{label}</p> : null}
      </div>
    </div>
  );
});
