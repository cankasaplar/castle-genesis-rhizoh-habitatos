import React, { memo, useEffect, useState } from "react";
import {
  formatRhizohNeonCountdownMsV0,
  isRhizohNeonCountdownCompleteV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resetRhizohNeonCountdownDeadlineV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "../rhizoh/runtime/rhizohNeonCountdownV0.js";

/**
 * SpiralMMO pin click — minimal 6:44 countdown only (restarts on zero).
 */
export const RhizohSpiralMMOPortalWorkspaceV0 = memo(function RhizohSpiralMMOPortalWorkspaceV0({
  uiLocale = "en",
  onClose
}) {
  const tr = uiLocale === "tr";
  const [deadlineMs, setDeadlineMs] = useState(() => readRhizohNeonCountdownDeadlineMsV0());
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = resolveRhizohNeonCountdownRemainingMsV0(deadlineMs, tick);
  const complete = isRhizohNeonCountdownCompleteV0(remainingMs);

  useEffect(() => {
    if (!complete) return;
    const next = resetRhizohNeonCountdownDeadlineV0();
    setDeadlineMs(next);
  }, [complete]);

  const display = complete
    ? tr
      ? "Süre doldu"
      : "Time up"
    : formatRhizohNeonCountdownMsV0(remainingMs);

  return (
    <div
      className="pointer-events-auto rounded-xl border px-4 py-3 text-white shadow-2xl backdrop-blur-md transition-colors duration-500"
      data-rhizoh-spiral-mmo-portal="1"
      data-rhizoh-neon-countdown-phase={complete ? "complete" : "active"}
      style={
        complete
          ? {
              borderColor: "rgba(255, 170, 0, 0.55)",
              background: "rgba(18, 10, 4, 0.94)",
              boxShadow: "0 0 20px rgba(255, 170, 0, 0.35)"
            }
          : {
              borderColor: "rgba(255, 204, 0, 0.45)",
              background: "rgba(10, 8, 2, 0.92)",
              boxShadow: "0 0 20px rgba(255, 204, 0, 0.28)"
            }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="font-mono text-2xl font-bold tabular-nums tracking-wider"
          style={{ color: complete ? "#ffaa00" : "#ffcc00", textShadow: `0 0 12px ${complete ? "#ffaa00" : "#ffcc00"}` }}
          aria-live="polite"
        >
          {display}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:text-white"
            aria-label={tr ? "Kapat" : "Close"}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
});
