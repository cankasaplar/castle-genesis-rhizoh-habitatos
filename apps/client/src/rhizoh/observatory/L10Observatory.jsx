import { memo, useMemo, useRef } from "react";
import VitalStrip from "./VitalStrip.jsx";
import GreenroomOrbit from "./GreenroomOrbit.jsx";
import InspectorPanel from "./InspectorPanel.jsx";
import KernelSealBadge from "./KernelSealBadge.jsx";
import { buildL10Diagnostics } from "./buildL10Diagnostics.js";
import { useL10SlowTruthSnapshot } from "./useL10SlowTruthSnapshot.js";
import { useL10MorphologyRaf } from "./useL10MorphologyRaf.js";
import { createMorphologyRuntimeState } from "./l10MorphologyLerp.js";
import { computeAdaptiveTruthIntervalMs } from "./computeAdaptiveTruthIntervalMs.js";
import "./l10ObservatoryMorph.css";

/**
 * Truth layer (slow, React): diagnostics @ ~2–4 Hz.
 * Phenomenology layer (fast): mutable CSS vars on .l10-morph-root via rAF — no per-frame React.
 *
 * @param {{
 *   socialRegistry?: Record<string, unknown> | null,
 *   diagnostics?: Record<string, unknown> | null,
 *   truthIntervalMs?: number,
 *   adaptiveTruthCadence?: boolean,
 *   userAgentSubjectThreadId?: string | null,
 *   mode?: string
 * }} props
 */
const L10Observatory = memo(function L10Observatory({
  socialRegistry = null,
  diagnostics: diagnosticsProp = null,
  truthIntervalMs = 320,
  adaptiveTruthCadence = true,
  userAgentSubjectThreadId = null,
  mode = "greenroom"
}) {
  const label = String(mode || "greenroom");

  const latestDiagnostics = useMemo(() => {
    if (diagnosticsProp != null) return diagnosticsProp;
    return buildL10Diagnostics(socialRegistry, {
      userAgentSubjectThreadId
    });
  }, [diagnosticsProp, socialRegistry, userAgentSubjectThreadId]);

  const appliedTruthMsRef = useRef(truthIntervalMs);

  const truthMs = useMemo(() => {
    if (!adaptiveTruthCadence) {
      appliedTruthMsRef.current = truthIntervalMs;
      return truthIntervalMs;
    }
    const next = computeAdaptiveTruthIntervalMs(latestDiagnostics, {
      base: truthIntervalMs,
      previousIntervalMs: appliedTruthMsRef.current,
      hysteresisMs: 40
    });
    appliedTruthMsRef.current = next;
    return next;
  }, [adaptiveTruthCadence, latestDiagnostics, truthIntervalMs]);

  const slowTruth = useL10SlowTruthSnapshot(latestDiagnostics, truthMs);
  const morphRootRef = useRef(null);
  const morphRef = useRef(createMorphologyRuntimeState());
  useL10MorphologyRaf(slowTruth, morphRootRef, morphRef);

  return (
    <section
      ref={morphRootRef}
      className="l10-morph-root rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-[#04120c]/95 to-black/80 p-3 shadow-[0_0_32px_rgba(16,185,129,0.08)]"
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[9px] tracking-[0.32em] text-emerald-200/90">L10 OBSERVATORY</div>
          <div className="mt-0.5 text-[10px] text-white/55 normal-case">{`Expansion era · slow truth ~${Math.round(1000 / truthMs)} Hz${adaptiveTruthCadence ? " · adaptive cadence" : ""} · morph rAF`}</div>
          <div className="text-[9px] text-white/40 normal-case">{label}</div>
        </div>
        <KernelSealBadge kernelSeal={slowTruth?.kernelSeal} />
      </div>
      <div className="space-y-3">
        <VitalStrip diagnostics={slowTruth} />
        <GreenroomOrbit diagnostics={slowTruth} />
        <InspectorPanel diagnostics={slowTruth} />
      </div>
    </section>
  );
});

L10Observatory.displayName = "L10Observatory";
export default L10Observatory;
