import React, { memo } from "react";
import {
  fractureAtmosphereToCssVarsV0,
  resolveFractureLayerStyleV0
} from "../castleFlight/perceptionFractureAtmosphereV0.js";

const FRACTURE_KEYFRAMES_V0 = `
@keyframes rhizoh-fracture-phase {
  0%, 100% { opacity: var(--rhizoh-fracture-octo-opacity, 1); }
  50% { opacity: calc(var(--rhizoh-fracture-octo-opacity, 1) * 0.93); }
}
@keyframes rhizoh-fracture-habitat-phase {
  0%, 100% { opacity: var(--rhizoh-fracture-habitat-opacity, 1); }
  50% { opacity: calc(var(--rhizoh-fracture-habitat-opacity, 1) * 0.91); }
}
@keyframes rhizoh-fracture-wheel-phase {
  0%, 100% {
    opacity: calc(var(--rhizoh-fracture-wheel-opacity, 1) * 1);
    transform: scale(1);
  }
  50% {
    opacity: calc(var(--rhizoh-fracture-wheel-opacity, 1) * 0.9);
    transform: scale(0.992);
  }
}
`;

let fractureKeyframesInjectedV0 = false;

function ensureFractureKeyframesV0() {
  if (fractureKeyframesInjectedV0 || typeof document === "undefined") return;
  const id = "rhizoh-fracture-phase-keyframes-v0";
  if (document.getElementById(id)) {
    fractureKeyframesInjectedV0 = true;
    return;
  }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = FRACTURE_KEYFRAMES_V0;
  document.head.appendChild(style);
  fractureKeyframesInjectedV0 = true;
}

/**
 * Perception fracture surface — texture only, no text, no control.
 * @param {{
 *   atmosphere: object | null | undefined,
 *   layer?: "octo" | "habitat" | "spatial" | "shell" | "chatDock" | "wheel",
 *   className?: string,
 *   style?: object,
 *   children?: React.ReactNode
 * }} props
 */
export const PerceptionFractureLayerV0 = memo(function PerceptionFractureLayerV0({
  atmosphere,
  layer = "shell",
  className = "",
  style = {},
  children
}) {
  if (!atmosphere) {
    return children ?? null;
  }

  if (
    (layer === "octo" && atmosphere.octo?.phaseMs > 0) ||
    (layer === "chatDock" && atmosphere.habitat?.phaseMs > 0) ||
    (layer === "habitat" && atmosphere.habitat?.phaseMs > 0) ||
    (layer === "wheel" && atmosphere.wheel?.phaseMs > 0)
  ) {
    ensureFractureKeyframesV0();
  }

  const cssVars = fractureAtmosphereToCssVarsV0(atmosphere);
  const layerStyle = resolveFractureLayerStyleV0(atmosphere, layer);
  const shimmer = layer === "spatial" && atmosphere.spatial?.shimmer > 0;

  return (
    <div
      className={layer === "spatial" ? className : `relative ${className}`}
      style={{ ...cssVars, ...layerStyle, ...style }}
      data-rhizoh-fracture-layer={layer}
      data-rhizoh-fracture-shimmer={shimmer ? "1" : "0"}
      data-rhizoh-fracture-parallax-freeze={
        atmosphere.spatial?.parallaxFreeze > 0 ? "1" : "0"
      }
      aria-hidden={layer !== "shell" ? true : undefined}
    >
      {shimmer ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[var(--rhizoh-fracture-spatial-shimmer)] mix-blend-soft-light"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(120,180,255,0.14), transparent 70%)",
            animation: "pulse 3.2s ease-in-out infinite"
          }}
          aria-hidden
        />
      ) : null}
      <div
        className={
          layer === "spatial"
            ? "absolute inset-0 min-h-0"
            : shimmer
              ? "relative z-[2]"
              : "relative"
        }
      >
        {children}
      </div>
    </div>
  );
});
