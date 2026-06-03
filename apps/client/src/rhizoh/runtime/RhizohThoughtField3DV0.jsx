import React, { useEffect, useMemo } from "react";
import { composeRhizohCognitiveFieldV0 } from "./rhizohVisualCognitiveLanguageV0.js";
import { resolveThinkingExposureV0 } from "./rhizohThinkingModelV0.js";
import { useScrCitizenCollectiveFieldV0 } from "./useScrCitizenCollectiveFieldV0.js";
import { assertScrCollectiveDensityOwnershipV0 } from "./rhizohScrCitizenVisualProjectionV0.js";

/**
 * Opt-in 3D thought field — CSS perspective crystal (Honest Baseline v0).
 */
export function RhizohThoughtField3DV0({
  activeSurface = "world",
  userIntent = null,
  rhizohFieldState = "IDLE",
  /** @deprecated B3 SCR-only */
  collectiveDensity,
  anchorActive = false,
  evolutionTrace = 0,
  expanded = true,
  className = ""
}) {
  useEffect(() => {
    if (collectiveDensity != null) assertScrCollectiveDensityOwnershipV0(collectiveDensity);
  }, [collectiveDensity]);

  const scrField = useScrCitizenCollectiveFieldV0();
  const scrDensity = scrField.density;
  const exposure = useMemo(
    () => resolveThinkingExposureV0(rhizohFieldState),
    [rhizohFieldState]
  );

  const field = useMemo(
    () =>
      composeRhizohCognitiveFieldV0({
        activeSurface,
        userIntent,
        rhizohFieldState,
        collectiveDensity: scrDensity,
        anchorActive,
        evolutionTrace,
        agentActivity: exposure.agentActivity
      }),
    [
      activeSurface,
      userIntent,
      rhizohFieldState,
      scrDensity,
      anchorActive,
      evolutionTrace,
      exposure.agentActivity
    ]
  );

  if (!expanded) return null;

  const { deformation, tension, motion, layers } = field;
  const orbit = exposure.orbitActive && !motion.reduced;

  return (
    <div
      className={`pointer-events-none fixed bottom-[8.5rem] left-1/2 z-[60] -translate-x-1/2 ${className}`}
      data-rhizoh-thought-field-3d="1"
      data-thinking-phase={exposure.phase}
      aria-hidden
      style={{ perspective: "520px" }}
    >
      <div
        className={`relative h-28 w-28 sm:h-32 sm:w-32 ${orbit ? "animate-[thought-orbit_4.2s_linear_infinite]" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          ["--vcl-twist"]: `${deformation.twistDeg}deg`,
          ["--vcl-tension"]: tension
        }}
      >
        <div
          className="absolute inset-0 rounded-[26%] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 via-transparent to-fuchsia-500/15 shadow-[0_0_48px_rgba(34,211,238,0.2)]"
          style={{
            transform: `rotateX(18deg) rotateY(var(--vcl-twist)) scale(${0.9 + tension * 0.15})`,
            opacity: 0.5 + tension * 0.4
          }}
        />
        <div
          className="absolute inset-[12%] rounded-[22%] border border-white/20"
          style={{
            transform: `rotateX(-12deg) rotateZ(calc(var(--vcl-twist) * 0.5)) translateZ(12px)`,
            opacity: layers.system.latticeDensity
          }}
        />
        <div
          className="absolute inset-[6%] rounded-full border border-fuchsia-300/25"
          style={{
            transform: `translateZ(24px) rotateY(calc(var(--vcl-twist) * -0.3))`,
            opacity: layers.agent.lensOpacity
          }}
        />
        <div
          className="absolute inset-0 rounded-[28%] bg-teal-300/10 blur-sm"
          style={{
            transform: `translateZ(8px) scale(${1 + layers.user.distortion * 0.1})`,
            opacity: layers.user.distortion
          }}
        />
        <div
          className="absolute -inset-3 rounded-[30%] bg-amber-100/10 blur-lg"
          style={{ opacity: layers.evolution.traceStrength }}
        />
      </div>
      <style>{`
        @keyframes thought-orbit {
          0% { transform: rotateY(0deg) rotateX(8deg); }
          100% { transform: rotateY(360deg) rotateX(8deg); }
        }
      `}</style>
    </div>
  );
}
