import React, { useEffect, useState } from "react";
import {
  RTL_PHASE_COMPLETE_V0,
  RTL_PHASE_ENTRY_V0,
  RTL_PHASE_PAL_ANCHOR_V0
} from "./expressiveRealityTransitionV0.js";

/**
 * Reality Transition Layer overlay — calm ceremony, not debug chrome.
 * @param {{
 *   active: boolean,
 *   phase: { id?: string, variant?: string, headline?: string, lines?: string[] } | null,
 *   experienceState?: string
 * }} props
 */
export function ExpressiveRealityTransitionOverlayV0({ active, phase, experienceState = "E2-X" }) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    setVisible(active);
  }, [active]);

  if (!visible || !phase) return null;

  const isMicro = phase.variant === "micro" || phase.variant === "compression";
  const isEntry = phase.id === RTL_PHASE_ENTRY_V0;
  const isAnchor = phase.id === RTL_PHASE_PAL_ANCHOR_V0;
  const isComplete = phase.id === RTL_PHASE_COMPLETE_V0;

  if (isMicro) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[200] flex items-end justify-end p-4 sm:p-6"
        aria-live="polite"
        data-rhizoh-rtl-overlay="micro"
        data-rtl-kind={phase.id || ""}
      >
        <div className="w-full max-w-xs animate-pulse rounded-xl border border-amber-400/40 bg-amber-950/75 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-200/90">
            Re-entry · {experienceState}
          </p>
          <p className="mt-1 text-[12px] font-semibold text-white/95 normal-case">{phase.headline}</p>
          {(phase.lines || []).slice(0, 2).map((line, i) => (
            <p key={i} className="mt-1 font-mono text-[10px] text-white/70 normal-case">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-[#04060c]/88 backdrop-blur-md"
      role="dialog"
      aria-live="polite"
      aria-label="Reality transition"
      data-rhizoh-rtl-overlay="1"
      data-rtl-phase={phase.id || ""}
    >
      <div
        className={`mx-4 w-full max-w-md rounded-2xl border px-6 py-8 text-center shadow-2xl ${
          isEntry
            ? "border-teal-400/35 bg-gradient-to-b from-teal-950/50 to-black/60"
            : isAnchor
              ? "border-amber-400/30 bg-gradient-to-b from-amber-950/40 to-black/60"
              : "border-white/15 bg-black/70"
        }`}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.32em] text-white/45">
          {experienceState} · experience state
        </p>
        <h2 className="mt-3 text-lg font-semibold text-white/95 normal-case">{phase.headline}</h2>
        <ul className="mt-5 space-y-2 text-left">
          {(phase.lines || []).map((line, i) => (
            <li
              key={`${phase.id}-${i}`}
              className={`rounded-lg px-3 py-2 font-mono text-[11px] leading-relaxed ${
                isEntry ? "bg-teal-500/10 text-teal-100/90" : "bg-white/[0.04] text-white/75"
              }`}
            >
              {line}
            </li>
          ))}
        </ul>
        {!isComplete ? (
          <p className="mt-6 text-[10px] text-white/40 normal-case">Sistem kısa bir an duraklıyor…</p>
        ) : null}
      </div>
    </div>
  );
}
