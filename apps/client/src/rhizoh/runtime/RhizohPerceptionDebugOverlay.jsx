import React, { useEffect, useState } from "react";
import { getPerceptionDebugSnapshotV0 } from "../spatial/perceptionDebugStoreV0.js";
import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";

const ON = isCastleDebugGranularFlagEnabled("VITE_RHIZOH_PERCEPTION_DEBUG");

/**
 * B2 — Salt gözlem overlay (drift / anchor alanı / sis uyumsuzluğu). worldPresence **yok**; runtime karar **yok**.
 */
export function RhizohPerceptionDebugOverlay() {
  const [snap, setSnap] = useState(/** @type {ReturnType<typeof getPerceptionDebugSnapshotV0>} */ (null));

  useEffect(() => {
    if (!ON) return undefined;
    const id = setInterval(() => {
      setSnap(getPerceptionDebugSnapshotV0());
    }, 450);
    return () => clearInterval(id);
  }, []);

  if (!ON || !snap) return null;
  return (
    <div className="pointer-events-none fixed bottom-2 right-2 z-[201] max-w-[12rem] rounded border border-cyan-500/25 bg-black/80 px-2 py-1 font-mono text-[8px] leading-snug normal-case text-cyan-100/90">
      <div className="text-[7px] uppercase tracking-wide text-cyan-400/80">perception (debug)</div>
      <div>drift: {snap.cameraDriftFromOrigin.toFixed(2)}</div>
      <div>field: {snap.anchorFieldDistortion.toFixed(2)}</div>
      <div>fogΔ: {snap.fogMismatchDelta.toFixed(2)}</div>
    </div>
  );
}
