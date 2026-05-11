import { useEffect, useState } from "react";
import { CASTLE_RHIZOH_EPISTEMIC_SURFACE_EVENT } from "./buildEpistemicOrbSurfaceV529.js";

/**
 * Orb + HUD için ortak kaynak: disk hydrate + epistemic surface olayı.
 * @param {() => { epistemic?: object, modelRoute?: object, source?: string, router?: object } | null | undefined} hydrateFromDisk
 */
export function useRhizohEpistemicSurface(hydrateFromDisk) {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (typeof hydrateFromDisk === "function") {
      try {
        const h = hydrateFromDisk();
        if (h?.epistemic) setSnapshot(h);
      } catch {
        /* noop */
      }
    }
    const onSurf = (ev) => {
      const d = ev?.detail;
      if (d?.epistemic && typeof d.epistemic === "object") setSnapshot(d);
    };
    const onLedger = (ev) => {
      const d = ev?.detail;
      if (!d?.latest || typeof d.latest !== "object") return;
      setSnapshot((prev) => {
        const prevTimeline = Array.isArray(prev?.ledgerTimeline) ? prev.ledgerTimeline : [];
        const nextTimeline = [d.latest, ...prevTimeline].slice(0, 8);
        return { ...(prev || {}), ledger: d.latest, ledgerTimeline: nextTimeline };
      });
    };
    window.addEventListener(CASTLE_RHIZOH_EPISTEMIC_SURFACE_EVENT, onSurf);
    window.addEventListener("castle-rhizoh-epistemic-ledger", onLedger);
    return () => {
      window.removeEventListener(CASTLE_RHIZOH_EPISTEMIC_SURFACE_EVENT, onSurf);
      window.removeEventListener("castle-rhizoh-epistemic-ledger", onLedger);
    };
  }, [hydrateFromDisk]);

  return snapshot;
}
