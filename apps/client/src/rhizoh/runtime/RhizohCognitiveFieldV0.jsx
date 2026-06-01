import React, { useMemo } from "react";
import { composeRhizohCognitiveFieldV0 } from "./rhizohVisualCognitiveLanguageV0.js";

/**
 * Ambient liquid-crystal cognition field — field response, not hover UI.
 * @param {{
 *   activeSurface?: string,
 *   userIntent?: string | null,
 *   rhizohFieldState?: string,
 *   collectiveDensity?: number,
 *   anchorActive?: boolean,
 *   evolutionTrace?: number,
 *   agentActivity?: number,
 *   className?: string
 * }} props
 */
export function RhizohCognitiveFieldV0({
  activeSurface = "world",
  userIntent = null,
  rhizohFieldState = "IDLE",
  collectiveDensity = 0.4,
  anchorActive = false,
  evolutionTrace = 0,
  agentActivity,
  className = ""
}) {
  const field = useMemo(
    () =>
      composeRhizohCognitiveFieldV0({
        activeSurface,
        userIntent,
        rhizohFieldState,
        collectiveDensity,
        anchorActive,
        evolutionTrace,
        agentActivity
      }),
    [
      activeSurface,
      userIntent,
      rhizohFieldState,
      collectiveDensity,
      anchorActive,
      evolutionTrace,
      agentActivity
    ]
  );

  const { deformation, tension, motion, layers } = field;
  const breathMs = motion.breathMs;
  const reduced = motion.reduced;

  return (
    <div
      className={`pointer-events-none fixed bottom-[7.5rem] left-1/2 z-[59] -translate-x-1/2 ${className}`}
      data-rhizoh-cognitive-field="1"
      data-vcl-intent={field.intent}
      aria-hidden
      title={field.context_strip}
      style={{
        ["--vcl-tension"]: tension,
        ["--vcl-twist"]: `${deformation.twistDeg}deg`,
        ["--vcl-facets"]: deformation.facets,
        ["--vcl-breath-ms"]: `${breathMs}ms`,
        ["--vcl-agent-opacity"]: layers.agent.lensOpacity,
        ["--vcl-user-distort"]: layers.user.distortion,
        ["--vcl-evolution"]: layers.evolution.traceStrength
      }}
    >
      <div
        className={`relative h-10 w-10 sm:h-12 sm:w-12 ${reduced ? "" : "animate-[vcl-breath_var(--vcl-breath-ms)_ease-in-out_infinite]"}`}
      >
        <div
          className="absolute inset-0 rounded-[28%] border border-cyan-300/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10 backdrop-blur-[2px]"
          style={{
            transform: `rotate(var(--vcl-twist)) scale(${0.92 + tension * 0.12})`,
            opacity: 0.55 + tension * 0.35
          }}
        />
        <div
          className="absolute inset-[18%] rounded-[22%] border border-white/15"
          style={{
            transform: `rotate(calc(var(--vcl-twist) * -0.6))`,
            opacity: layers.system.latticeDensity
          }}
        />
        <div
          className="absolute inset-[8%] rounded-full border border-fuchsia-300/20"
          style={{ opacity: "var(--vcl-agent-opacity)" }}
        />
        <div
          className="absolute inset-0 rounded-[30%] bg-teal-400/5"
          style={{
            transform: `scale(${1 + Number(layers.user.distortion) * 0.08})`,
            opacity: layers.user.distortion
          }}
        />
        <div
          className="absolute -inset-1 rounded-[32%] bg-amber-200/5 blur-md"
          style={{ opacity: "var(--vcl-evolution)" }}
        />
      </div>
      <style>{`
        @keyframes vcl-breath {
          0%, 100% { transform: scale(0.96) rotate(0deg); }
          50% { transform: scale(1.04) rotate(calc(var(--vcl-twist) * 0.15)); }
        }
      `}</style>
    </div>
  );
}
