import React, { memo, useCallback, useEffect, useState } from "react";
import { COMPANION_OBS_PRESENCE_EVENT_V0 } from "../castleFlight/castleCompanionObservationPresenceV0.js";
import {
  resolveCompanionDormancyOverlayCopyV0,
  shouldShowCompanionDormancyOverlayV0
} from "../castleFlight/companionPresenceStateV0.js";
import { readCastlePweV0 } from "../castleFlight/castlePersistentWorldEntityV0.js";
import { COMPANION_PRESENCE_STATE_LABELS_TR_V0 } from "../castleFlight/companionPresenceStateV0.js";

/**
 * Presentation-only — does not patch PWE presence.state.
 */
export const CompanionDormancyOverlayV0 = memo(function CompanionDormancyOverlayV0({
  className = ""
}) {
  const [snap, setSnap] = useState(() =>
    typeof window !== "undefined" ? window.__RHIZOH_COMPANION_PRESENCE__ : null
  );

  const refresh = useCallback(() => {
    setSnap(window.__RHIZOH_COMPANION_PRESENCE__ || null);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(COMPANION_OBS_PRESENCE_EVENT_V0, refresh);
    const id = window.setInterval(refresh, 800);
    return () => {
      window.removeEventListener(COMPANION_OBS_PRESENCE_EVENT_V0, refresh);
      window.clearInterval(id);
    };
  }, [refresh]);

  const presence = snap?.presence;
  const pwe = readCastlePweV0();
  if (!pwe?.mounted || !presence) return null;
  if (!shouldShowCompanionDormancyOverlayV0(presence.observable, presence.dormancy)) {
    return null;
  }

  const copy = resolveCompanionDormancyOverlayCopyV0(presence);
  const stateLabel =
    COMPANION_PRESENCE_STATE_LABELS_TR_V0[presence.state] || presence.state || "—";

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-[5.5rem] z-[42] -translate-x-1/2 max-w-md px-4 ${className}`}
      data-companion-dormancy-overlay="1"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-xl border border-violet-400/25 bg-[#0a0614]/88 px-3 py-2 text-center backdrop-blur-md normal-case">
        <p className="text-[10px] text-violet-100/90">{copy}</p>
        <p className="mt-1 text-[9px] text-white/45">
          Companion kapalı · state: <span className="font-mono text-violet-200/80">{stateLabel}</span>
          {" "}
          (gözlem kapalı ≠ uyku state)
        </p>
      </div>
    </div>
  );
});
