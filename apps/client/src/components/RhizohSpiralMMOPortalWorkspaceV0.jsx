import React, { memo, useEffect, useMemo, useState } from "react";
import { formatRhizohNeonCountdownMsV0 } from "../rhizoh/runtime/rhizohNeonCountdownV0.js";
import {
  resolveRhizohClockThresholdRemainingMsV0,
  resolveRhizohNextClockThresholdV0,
  resolveRhizohRealClockWavePhaseV0,
  resolveRhizohRealClockWaveVisualV0
} from "../rhizoh/runtime/rhizohRealClockThresholdV0.js";
import { resolveSpiralMMOContinentCubeV0 } from "../rhizoh/runtime/spiralMMOContinentCubeV0.js";
import { resolveSpiralMMOContinentDisplayNameV0 } from "../rhizoh/runtime/spiralMMOContinentPinsV0.js";
import { RhizohSpiralMMOCubeV0 } from "./RhizohSpiralMMOCubeV0.jsx";

/**
 * SpiralMMO map pin portal — per-continent cube + real-clock countdown (06:44 / 18:44).
 */
export const RhizohSpiralMMOPortalWorkspaceV0 = memo(function RhizohSpiralMMOPortalWorkspaceV0({
  uiLocale = "en",
  continentId = "europe",
  onClose
}) {
  const tr = uiLocale === "tr";
  const cube = useMemo(() => resolveSpiralMMOContinentCubeV0(continentId), [continentId]);
  const title = useMemo(
    () => resolveSpiralMMOContinentDisplayNameV0(continentId, tr ? "tr" : "en"),
    [continentId, tr]
  );

  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const threshold = useMemo(() => resolveRhizohNextClockThresholdV0(tick), [tick]);
  const remainingMs = resolveRhizohClockThresholdRemainingMsV0(threshold.deadlineMs, tick);
  const phase = resolveRhizohRealClockWavePhaseV0({
    remainingMs,
    thresholdId: threshold.id,
    nowMs: tick
  });
  const visual = resolveRhizohRealClockWaveVisualV0(phase);
  const atThreshold = phase !== "counting";
  const display = atThreshold
    ? threshold.label
    : formatRhizohNeonCountdownMsV0(remainingMs);

  return (
    <div
      className="pointer-events-auto w-full max-w-sm rounded-2xl border p-4 text-white shadow-2xl backdrop-blur-md transition-colors duration-700"
      data-rhizoh-spiral-mmo-portal="1"
      data-rhizoh-spiral-mmo-continent={cube.id}
      data-rhizoh-real-clock-phase={phase}
      style={{
        borderColor: visual.border,
        background: visual.panelBg,
        boxShadow: `0 0 28px ${visual.glow}, inset 0 0 16px ${visual.glow.replace("0.55", "0.1")}`
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[9px] font-black uppercase tracking-[0.22em]"
            style={{ color: visual.accent }}
          >
            {tr ? "SpiralMMO · portal" : "SpiralMMO · portal"}
          </p>
          <h2 className="mt-1 truncate text-sm font-black" style={{ color: visual.accent }}>
            {title}
          </h2>
          <p className="mt-1 text-[10px] text-white/50">
            {tr ? cube.motifTr : cube.motif} · {tr ? "gözlem küpü" : "observation cube"}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
            aria-label={tr ? "Kapat" : "Close"}
          >
            ×
          </button>
        ) : null}
      </div>

      <RhizohSpiralMMOCubeV0 continentId={continentId} accent={visual.accent} />

      <p
        className="mt-2 text-center font-mono text-4xl font-bold tracking-[0.12em] tabular-nums transition-colors duration-700"
        style={{
          color: visual.accent,
          textShadow: `0 0 18px ${visual.glow}`
        }}
        aria-live="polite"
      >
        {display}
      </p>

      <p className="mt-3 text-center text-[9px] uppercase tracking-[0.18em] text-white/45">
        {atThreshold
          ? phase === "dusk"
            ? tr
              ? "REAL LAYER · akşam eşiği 18:44"
              : "REAL LAYER · evening threshold 18:44"
            : tr
              ? "REAL LAYER · sabah eşiği 06:44"
              : "REAL LAYER · morning threshold 06:44"
          : tr
            ? `Sonraki eşik · ${threshold.label}`
            : `Next threshold · ${threshold.label}`}
      </p>
    </div>
  );
});
