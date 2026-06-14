import React, { memo, useEffect, useState } from "react";
import {
  formatRhizohNeonCountdownMsV0,
  isRhizohNeonCountdownCompleteV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "../rhizoh/runtime/rhizohNeonCountdownV0.js";

/**
 * Map-anchored neon countdown panel (SpiralMMO pins — 6:44).
 */
export const RhizohNeonCountdownPanelV0 = memo(function RhizohNeonCountdownPanelV0({
  uiLocale = "en",
  title = "",
  subtitle = "",
  onClose
}) {
  const tr = uiLocale === "tr";
  const [remainingMs, setRemainingMs] = useState(() =>
    resolveRhizohNeonCountdownRemainingMsV0(readRhizohNeonCountdownDeadlineMsV0())
  );

  useEffect(() => {
    const deadlineMs = readRhizohNeonCountdownDeadlineMsV0();
    const tick = () => setRemainingMs(resolveRhizohNeonCountdownRemainingMsV0(deadlineMs));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  const complete = isRhizohNeonCountdownCompleteV0(remainingMs);
  const display = complete
    ? tr
      ? "Süre doldu"
      : "Time up"
    : formatRhizohNeonCountdownMsV0(remainingMs);

  return (
    <div
      className="pointer-events-auto w-full max-w-xs rounded-2xl border p-4 text-white shadow-2xl backdrop-blur-md transition-colors duration-500"
      data-rhizoh-neon-countdown-panel="1"
      data-rhizoh-neon-countdown-phase={complete ? "complete" : "active"}
      style={
        complete
          ? {
              borderColor: "rgba(251, 191, 36, 0.5)",
              background: "rgba(18, 10, 4, 0.92)",
              boxShadow: "0 0 28px rgba(251, 191, 36, 0.28), inset 0 0 16px rgba(251, 191, 36, 0.08)"
            }
          : {
              borderColor: "rgba(34, 211, 238, 0.45)",
              background: "rgba(3, 12, 22, 0.92)",
              boxShadow:
                "0 0 28px rgba(34, 211, 238, 0.35), 0 0 48px rgba(56, 189, 248, 0.15), inset 0 0 18px rgba(34, 211, 238, 0.1)"
            }
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[9px] font-black uppercase tracking-[0.22em]"
            style={{ color: complete ? "rgba(251, 191, 36, 0.75)" : "rgba(103, 232, 249, 0.8)" }}
          >
            {tr ? "SpiralMMO · geri sayım" : "SpiralMMO · countdown"}
          </p>
          {title ? (
            <h2
              className="mt-1 truncate text-sm font-black"
              style={{ color: complete ? "#fbbf24" : "#a5f3fc" }}
            >
              {title}
            </h2>
          ) : null}
          {subtitle ? <p className="mt-1 text-[10px] text-white/50">{subtitle}</p> : null}
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

      <p
        className="mt-4 text-center font-mono text-4xl font-bold tracking-[0.12em] tabular-nums"
        style={{
          color: complete ? "#fbbf24" : "#67e8f9",
          textShadow: complete
            ? "0 0 18px rgba(251, 191, 36, 0.55)"
            : "0 0 20px rgba(34, 211, 238, 0.55), 0 0 36px rgba(56, 189, 248, 0.25)"
        }}
        aria-live="polite"
      >
        {display}
      </p>

      <p className="mt-3 text-center text-[9px] uppercase tracking-[0.18em] text-white/40">
        {complete
          ? tr
            ? "REAL LAYER · sabah eşiği"
            : "REAL LAYER · morning threshold"
          : tr
            ? "REAL LAYER · 06:44"
            : "REAL LAYER · 06:44"}
      </p>
    </div>
  );
});
