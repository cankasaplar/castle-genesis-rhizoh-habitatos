import React, { useMemo } from "react";
import { resolveThinkingExposureV0 } from "./rhizohThinkingModelV0.js";

/**
 * Viewport ambient — light/color shift by thinking phase (Honest Baseline v0).
 */
export function RhizohHonestCognitionAmbientV0({
  rhizohFieldState = "IDLE",
  enabled = true,
  ambientOpacityScale = 1,
  className = ""
}) {
  const exposure = useMemo(
    () => resolveThinkingExposureV0(rhizohFieldState),
    [rhizohFieldState]
  );

  if (!enabled) return null;

  const { ambient } = exposure;
  const scale = Math.max(0.35, Math.min(1, Number(ambientOpacityScale) || 1));
  const o1 = ambient.opacity * scale;
  const bg = `radial-gradient(ellipse 120% 80% at 50% 100%, hsla(${ambient.hue}, ${ambient.sat}%, ${ambient.light}%, ${o1}) 0%, transparent 62%),
    radial-gradient(ellipse 90% 60% at 12% 18%, hsla(${ambient.hue + 40}, ${ambient.sat * 0.7}%, ${ambient.light + 4}%, ${o1 * 0.55}) 0%, transparent 50%),
    radial-gradient(ellipse 70% 50% at 88% 22%, hsla(${ambient.hue - 25}, ${ambient.sat * 0.6}%, ${ambient.light + 2}%, ${o1 * 0.4}) 0%, transparent 48%)`;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[2] transition-[opacity] duration-700 ease-out ${className}`}
      data-rhizoh-honest-ambient="1"
      data-thinking-phase={exposure.phase}
      data-ambient-scale={scale}
      aria-hidden
      style={{
        background: bg,
        opacity: scale
      }}
    />
  );
}
