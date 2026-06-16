import React, { memo, useEffect, useState } from "react";
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
 * Catch-up cascade overlay — Layer N→M fast-forward (mobile + desktop).
 */
export const RhizohCatchUpCascadeOverlayV0 = memo(function RhizohCatchUpCascadeOverlayV0() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState(null);
  const [plan, setPlan] = useState(null);

  const [phaseV1, setPhaseV1] = useState(null);

  useEffect(() => {
    const onCascade = (ev) => {
      const snap = ev?.detail;
      setActive(snap?.active === true);
      if (snap?.plan) setPlan(snap.plan);
      if (!snap?.active) setPhase(null);
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

  if (!active && !phase && !phaseV1) return null;

  const fromLayer = plan?.fromLayer ?? 0;
  const toLayer = plan?.toLayer ?? phase?.layer ?? fromLayer;
  const progress = phase?.progress ?? 0;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[160] flex flex-col items-center justify-center overflow-hidden bg-black/75"
      data-rhizoh-catch-up-cascade="1"
      aria-live="polite"
    >
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-[#6a9bcc]">
        {phaseV1 ? PHASE_LABELS_V1[phaseV1.phase] || phaseV1.label : "Catch-up Cascade"}
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums text-[#faf9f5]">
        L{fromLayer} → L{phase?.layer ?? toLayer}
      </div>
      <div className="mt-2 font-mono text-xs text-[#b0aea5]">
        seed {phase?.seed ?? plan?.canonicalSeed ?? "—"}
      </div>
      <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[#d97757] transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className="mt-3 font-mono text-[9px] text-[#788c5d]">
        {phase ? `phase ${phase.index + 1}/${phase.total}` : "aligning canonical timeline…"}
      </div>
    </div>
  );
});
