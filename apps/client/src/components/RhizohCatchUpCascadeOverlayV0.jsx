import React, { memo, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  RHIZOH_CATCH_UP_CASCADE_EVENT_V0,
  RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0
} from "../core/cascadeReplayRendererV0.js";
import { RHIZOH_CASCADE_PHASE_V1 } from "../core/cascadeReconciliationKernelV1.js";

const PHASE_LABELS_V1 = Object.freeze({
  [RHIZOH_CASCADE_PHASE_V1.VOID_FILL]: "VOID → FILL",
  [RHIZOH_CASCADE_PHASE_V1.LAYER_REPLAY]: "REPLAY",
  [RHIZOH_CASCADE_PHASE_V1.STATE_ALIGN]: "ALIGN"
});

/**
 * Catch-up cascade — compact corner chip (map stays usable; no fullscreen blackout).
 */
export const RhizohCatchUpCascadeOverlayV0 = memo(function RhizohCatchUpCascadeOverlayV0() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState(null);
  const [plan, setPlan] = useState(null);
  const [phaseV1, setPhaseV1] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onCascade = (ev) => {
      const snap = ev?.detail;
      setActive(snap?.active === true);
      if (snap?.plan) setPlan(snap.plan);
      if (!snap?.active) {
        setPhase(null);
        setDismissed(false);
      }
    };
    const onPhase = (ev) => setPhase(ev?.detail || null);
    const onPhaseV1 = (ev) => setPhaseV1(ev?.detail || null);

    window.addEventListener(RHIZOH_CATCH_UP_CASCADE_EVENT_V0, onCascade);
    window.addEventListener(RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0, onPhase);
    window.addEventListener("rhizoh:cascade-phase-v1", onPhaseV1);
    return () => {
      window.removeEventListener(RHIZOH_CATCH_UP_CASCADE_EVENT_V0, onCascade);
      window.removeEventListener(RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0, onPhase);
      window.removeEventListener("rhizoh:cascade-phase-v1", onPhaseV1);
    };
  }, []);

  if (dismissed || (!active && !phase && !phaseV1)) return null;

  const fromLayer = plan?.fromLayer ?? 0;
  const toLayer = plan?.toLayer ?? phase?.layer ?? fromLayer;
  const progress = phase?.progress ?? 0;
  const fastUi = Boolean(plan?.fastUi || phase?.fastUi);

  return (
    <div
      className="pointer-events-none absolute right-3 top-24 z-[160] max-w-[12rem] sm:max-w-[14rem]"
      data-rhizoh-catch-up-cascade="1"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-xl border border-cyan-400/30 bg-black/80 px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-cyan-200/80">
            {phaseV1 ? PHASE_LABELS_V1[phaseV1.phase] || phaseV1.label : "Catch-up"}
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded border border-white/10 p-0.5 text-white/45 hover:text-white"
            aria-label="Dismiss cascade chip"
          >
            <X size={10} />
          </button>
        </div>
        <p className="font-mono text-sm font-bold tabular-nums text-white/90">
          L{fromLayer} → L{phase?.layer ?? toLayer}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-cyan-400/80 transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-[8px] text-white/45">
          {fastUi
            ? "fast sync · map usable"
            : phase
              ? `phase ${phase.index + 1}/${phase.total}`
              : "aligning timeline…"}
        </p>
      </div>
    </div>
  );
});
