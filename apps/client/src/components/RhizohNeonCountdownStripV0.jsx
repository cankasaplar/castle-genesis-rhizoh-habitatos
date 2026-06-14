import React, { memo, useEffect, useState } from "react";
import {
  formatRhizohNeonCountdownMsV0,
  isRhizohNeonCountdownCompleteV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "../rhizoh/runtime/rhizohNeonCountdownV0.js";

/**
 * Compact neon countdown for World / Space header (6:44 → color shift on complete).
 */
export const RhizohNeonCountdownStripV0 = memo(function RhizohNeonCountdownStripV0({
  uiLocale = "en",
  className = ""
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
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-center font-mono text-[11px] font-bold tracking-[0.14em] tabular-nums transition-colors duration-500 ${className}`}
      data-rhizoh-neon-countdown="1"
      data-rhizoh-neon-countdown-phase={complete ? "complete" : "active"}
      style={
        complete
          ? {
              color: "#fbbf24",
              borderColor: "rgba(251, 191, 36, 0.45)",
              background: "rgba(120, 53, 15, 0.35)",
              boxShadow: "0 0 14px rgba(251, 191, 36, 0.35), inset 0 0 8px rgba(251, 191, 36, 0.12)"
            }
          : {
              color: "#67e8f9",
              borderColor: "rgba(34, 211, 238, 0.5)",
              background: "rgba(8, 47, 73, 0.55)",
              boxShadow:
                "0 0 16px rgba(34, 211, 238, 0.45), 0 0 32px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(34, 211, 238, 0.15)"
            }
      }
      aria-live="polite"
      aria-label={tr ? `Geri sayım ${display}` : `Countdown ${display}`}
    >
      {display}
    </div>
  );
});
