import React, { memo, useEffect, useState } from "react";
import {
  RHIZOH_OFFLINE_VOID_EVENT_V0,
  publishOfflineVoidStateV0
} from "../core/offlineVoidGateV0.js";

/**
 * Void overlay — frozen dissonance at 00:00 when offline (awaiting canonical tick).
 */
export const RhizohOfflineVoidOverlayV0 = memo(function RhizohOfflineVoidOverlayV0() {
  const [voidState, setVoidState] = useState(() =>
    typeof window !== "undefined" ? window.__rhizoh?.offlineVoid : null
  );

  useEffect(() => {
    const onVoid = (ev) => setVoidState(ev?.detail || null);
    window.addEventListener(RHIZOH_OFFLINE_VOID_EVENT_V0, onVoid);
    return () => {
      window.removeEventListener(RHIZOH_OFFLINE_VOID_EVENT_V0, onVoid);
      publishOfflineVoidStateV0(false);
    };
  }, []);

  if (!voidState?.active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/80"
      data-rhizoh-offline-void="1"
      aria-live="polite"
    >
      <div className="animate-pulse font-mono text-sm font-bold tracking-widest text-[#d97757]">
        {voidState.message || "AWAITING CANONICAL TICK..."}
      </div>
      <div className="mt-2 font-mono text-[10px] tracking-wide text-[#b0aea5]">
        {voidState.subMessage || "REALITY NOT RESOLVED"}
      </div>
    </div>
  );
});
