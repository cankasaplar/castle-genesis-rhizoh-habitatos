import React, { useEffect, useState } from "react";
import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import { isExpressiveRealityBootCompleteV0, readEmotionalAnchorV0 } from "./expressiveRealityMicroTransitionV0.js";
import { isRhizohT0FirstMatchIdentityV0 } from "./rhizohT0FirstMatchIdentityV0.js";
import { resolveT0AnchorStripCopyV0 } from "./rhizohProductPlainCopyV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";
import { isRhizohWorldSpaceMapStageV0 } from "./rhizohWorldSurfacePolicyV0.js";

/**
 * Persistent anchor strip — only user-visible continuity cue on seamless entry ("Continued").
 */
export function ExpressiveRealityEmotionalAnchorStripV0({ pulse = false, continued = false }) {
  const [anchor, setAnchor] = useState(() => readEmotionalAnchorV0());
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!isRhizohCreativeSurfaceEnabledV0()) return undefined;

    const refresh = () => setAnchor(readEmotionalAnchorV0());
    refresh();

    const onAnchor = () => refresh();
    window.addEventListener("rhizoh:emotional-anchor", onAnchor);
    window.addEventListener("rhizoh:memory-anchor", onAnchor);
    return () => {
      window.removeEventListener("rhizoh:emotional-anchor", onAnchor);
      window.removeEventListener("rhizoh:memory-anchor", onAnchor);
    };
  }, []);

  useEffect(() => {
    if (!pulse && !continued) return undefined;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), continued ? 480 : 400);
    return () => window.clearTimeout(t);
  }, [pulse, continued]);

  const ready = isExpressiveRealityBootCompleteV0() || continued;
  if (!isRhizohCreativeSurfaceEnabledV0() || !ready) return null;

  const pathname = typeof window !== "undefined" ? String(window.location.pathname || "") : "";
  if (isRhizohWorldSpaceMapStageV0({ pathname })) return null;

  const localeTr = readUiLocaleV0() === "tr";
  const firstMatch = isRhizohT0FirstMatchIdentityV0();
  const stripCopy = resolveT0AnchorStripCopyV0(anchor, localeTr);
  const primary = continued
    ? String(anchor?.primary_label || anchor?.label || "").trim()
    : stripCopy.primary;

  if (!continued && !primary) return null;

  return (
    <div
      className={`pointer-events-none fixed left-4 z-[198] max-w-[min(14rem,58vw)] rounded-xl border px-3 py-2 backdrop-blur-md transition-all duration-300 ${
        firstMatch ? "top-[calc(max(1rem,env(safe-area-inset-top))+2.85rem)]" : "top-4"
      } ${
        flash
          ? "border-amber-300/50 bg-amber-950/55 shadow-[0_0_24px_rgba(251,191,36,0.25)]"
          : "border-white/12 bg-black/55"
      }`}
      data-rhizoh-emotional-anchor="1"
      data-rhizoh-continued={continued ? "1" : undefined}
      aria-live="polite"
    >
      {continued ? (
        <>
          <p className="text-[8px] font-black uppercase tracking-[0.28em] text-teal-200/90">Continued</p>
          {primary ? (
            <p className="mt-0.5 text-[11px] font-semibold text-white/92 normal-case">{primary}</p>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-amber-200/80">
            {stripCopy.kicker}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-white/92 normal-case">{primary}</p>
        </>
      )}
      {!continued && stripCopy.showSecondary && stripCopy.secondary ? (
        <p className="mt-0.5 text-[9px] text-white/55 normal-case leading-snug">{stripCopy.secondary}</p>
      ) : null}
      {!continued && !firstMatch && anchor?.last_event ? (
        <p className="mt-0.5 font-mono text-[9px] text-white/45">{String(anchor.last_event)}</p>
      ) : null}
    </div>
  );
}
