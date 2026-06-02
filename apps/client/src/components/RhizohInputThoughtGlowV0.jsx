import React, { useMemo } from "react";
import { resolveThinkingExposureV0 } from "../rhizoh/runtime/rhizohThinkingModelV0.js";

/**
 * Inline thought signal — lives inside the unified chat input (not a separate viewport layer).
 */
export function RhizohInputThoughtGlowV0({
  fieldState = "IDLE",
  collectiveDensity = 0.4,
  className = ""
}) {
  const exposure = useMemo(
    () => resolveThinkingExposureV0(fieldState),
    [fieldState]
  );
  const active = fieldState !== "IDLE" && fieldState !== "DEGRADED";
  const { ambient } = exposure;
  const warmth = 0.28 + collectiveDensity * 0.22 + (active ? exposure.fieldIntensity * 0.35 : 0);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
      data-rhizoh-input-thought-glow="1"
      data-thinking-phase={exposure.phase}
      aria-hidden
    >
      <div
        className={`absolute -left-6 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full blur-xl transition-opacity duration-500 ${
          active ? "animate-pulse" : ""
        }`}
        style={{
          background: `radial-gradient(circle, hsla(${ambient.hue}, ${ambient.sat}%, ${ambient.light + 22}%, 0.85) 0%, transparent 68%)`,
          opacity: warmth
        }}
      />
      <div
        className="absolute inset-y-2 left-[3.25rem] right-12 rounded-lg border border-cyan-400/10"
        style={{
          background: `linear-gradient(90deg, hsla(${ambient.hue}, ${ambient.sat * 0.6}%, ${ambient.light + 6}%, ${active ? 0.12 : 0.04}) 0%, transparent 55%)`,
          opacity: 0.55 + (active ? 0.35 : 0)
        }}
      />
      {active ? (
        <div
          className="absolute right-14 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border border-cyan-300/45 bg-cyan-400/25 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
          style={{ opacity: 0.5 + exposure.fieldIntensity * 0.5 }}
        />
      ) : (
        <div className="absolute right-14 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-cyan-300/35" />
      )}
    </div>
  );
}
