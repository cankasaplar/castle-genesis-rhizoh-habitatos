/**
 * Perception fracture atmosphere — read-only texture tokens from alignment contract.
 * No prod text, no scores, no causality rendering.
 * @see docs/PERCEPTUAL_ALIGNMENT_RENDERING_V1.md Step 3.1
 */

export const PERCEPTION_FRACTURE_ATMOSPHERE_SCHEMA_V0 = "castle.perception_fracture_atmosphere.v0";

const NEUTRAL_OCTO_V0 = Object.freeze({ opacity: 1, phaseMs: 0 });
const NEUTRAL_HABITAT_V0 = Object.freeze({ opacity: 1, floatPx: 0, phaseMs: 0 });
const NEUTRAL_SPATIAL_V0 = Object.freeze({ opacity: 1, parallaxFreeze: 0, shimmer: 0 });
const NEUTRAL_WHEEL_V0 = Object.freeze({ opacity: 1, phaseMs: 0 });
const NEUTRAL_COPRESENCE_V0 = Object.freeze({ depthSeparation: 0 });

/**
 * @param {readonly { code?: string }[]} explanations
 * @param {string} code
 */
function hasDriftCodeV0(explanations, code) {
  return Array.isArray(explanations) && explanations.some((row) => row?.code === code);
}

/**
 * Deterministic fracture tokens — same snapshot → same atmosphere.
 * @param {ReturnType<typeof import("./perceptionAlignmentSnapshotV0.js").readPerceptionAlignmentFromRuntimeV0> | null | undefined} snapshot
 */
export function buildPerceptionFractureAtmosphereV0(snapshot) {
  const contract = snapshot?.contract;
  const alignment = contract?.alignment;
  if (!alignment) {
    return Object.freeze({
      schema: PERCEPTION_FRACTURE_ATMOSPHERE_SCHEMA_V0,
      readOnly: true,
      atMs: 0,
      octo: NEUTRAL_OCTO_V0,
      habitat: NEUTRAL_HABITAT_V0,
      spatial: NEUTRAL_SPATIAL_V0,
      wheel: NEUTRAL_WHEEL_V0,
      coPresence: NEUTRAL_COPRESENCE_V0
    });
  }

  const explanations = alignment.explanations || [];
  let octo = { ...NEUTRAL_OCTO_V0 };
  let habitat = { ...NEUTRAL_HABITAT_V0 };
  let spatial = { ...NEUTRAL_SPATIAL_V0 };
  let wheel = { ...NEUTRAL_WHEEL_V0 };
  let coPresence = { ...NEUTRAL_COPRESENCE_V0 };

  if (
    alignment.blockFalseCorrelation === true ||
    hasDriftCodeV0(explanations, "P2_FALSE_CORRELATION_SPATIAL_UNDER_CONVERSATION")
  ) {
    spatial = { opacity: 0.78, parallaxFreeze: 1, shimmer: 0.12 };
    habitat = { opacity: 0.92, floatPx: 0, phaseMs: 0 };
  }

  if (hasDriftCodeV0(explanations, "P2_PRESENTATION_AHEAD_OF_SPATIAL")) {
    habitat = {
      opacity: Math.min(habitat.opacity, 0.88),
      floatPx: Math.max(habitat.floatPx, 6),
      phaseMs: habitat.phaseMs ?? 0
    };
    spatial = {
      ...spatial,
      shimmer: Math.max(spatial.shimmer, 0.18)
    };
  }

  if (hasDriftCodeV0(explanations, "P2_TIME_SKEW_HIGH")) {
    octo = { opacity: 0.94, phaseMs: 120 };
    habitat = { ...habitat, opacity: Math.min(habitat.opacity, 0.9), phaseMs: habitat.phaseMs ?? 0 };
  } else if (hasDriftCodeV0(explanations, "P2_TIME_SKEW_WARN")) {
    octo = { opacity: 0.97, phaseMs: 60 };
  }

  if (hasDriftCodeV0(explanations, "P2_OCTO_MOUNT_FRAGMENTATION")) {
    coPresence = { depthSeparation: 1 };
    octo = { ...octo, opacity: Math.min(octo.opacity, 0.86) };
  }

  if (hasDriftCodeV0(explanations, "P2_SPATIAL_STALE_AFTER_ZOOM")) {
    spatial = {
      ...spatial,
      shimmer: Math.max(spatial.shimmer, 0.22)
    };
  }

  if (hasDriftCodeV0(explanations, "P2_PERCEPTION_FIELD_EMOTION_MISMATCH")) {
    octo = { ...octo, phaseMs: Math.max(octo.phaseMs, 80) };
  }

  if (habitat.phaseMs === 0 && (octo.phaseMs > 0 || habitat.opacity < 1)) {
    habitat = {
      ...habitat,
      phaseMs: Math.round(octo.phaseMs * 0.85) || (habitat.opacity < 1 ? 40 : 0)
    };
  }

  if (octo.phaseMs > 0 || habitat.phaseMs > 0 || alignment.guardrailActive === true) {
    wheel = {
      opacity: Math.min(habitat.opacity, octo.opacity),
      phaseMs: Math.max(habitat.phaseMs, Math.round(octo.phaseMs * 0.65))
    };
  }

  return Object.freeze({
    schema: PERCEPTION_FRACTURE_ATMOSPHERE_SCHEMA_V0,
    readOnly: true,
    atMs: contract.atMs ?? 0,
    octo: Object.freeze(octo),
    habitat: Object.freeze(habitat),
    spatial: Object.freeze(spatial),
    wheel: Object.freeze(wheel),
    coPresence: Object.freeze(coPresence)
  });
}

/**
 * CSS custom properties for fracture layer hosts (no user-facing copy).
 * @param {ReturnType<typeof buildPerceptionFractureAtmosphereV0>} atmosphere
 */
export function fractureAtmosphereToCssVarsV0(atmosphere) {
  if (!atmosphere) return {};
  return {
    "--rhizoh-fracture-octo-opacity": String(atmosphere.octo.opacity),
    "--rhizoh-fracture-octo-phase-ms": String(atmosphere.octo.phaseMs),
    "--rhizoh-fracture-habitat-opacity": String(atmosphere.habitat.opacity),
    "--rhizoh-fracture-habitat-float-px": `${atmosphere.habitat.floatPx}px`,
    "--rhizoh-fracture-habitat-phase-ms": String(atmosphere.habitat.phaseMs ?? 0),
    "--rhizoh-fracture-wheel-opacity": String(atmosphere.wheel?.opacity ?? 1),
    "--rhizoh-fracture-wheel-phase-ms": String(atmosphere.wheel?.phaseMs ?? 0),
    "--rhizoh-fracture-spatial-opacity": String(atmosphere.spatial.opacity),
    "--rhizoh-fracture-spatial-parallax-freeze": String(atmosphere.spatial.parallaxFreeze),
    "--rhizoh-fracture-spatial-shimmer": String(atmosphere.spatial.shimmer),
    "--rhizoh-fracture-copresence-depth": String(atmosphere.coPresence.depthSeparation)
  };
}

/**
 * Direct layer style for a lens host (opacity / transform / transition only).
 * @param {ReturnType<typeof buildPerceptionFractureAtmosphereV0>} atmosphere
 * @param {"octo" | "habitat" | "spatial" | "shell" | "chatDock" | "wheel"} layer
 */
export function resolveFractureLayerStyleV0(atmosphere, layer) {
  if (!atmosphere) return {};

  if (layer === "chatDock") {
    const phaseMs = atmosphere.habitat?.phaseMs ?? 0;
    return {
      opacity: atmosphere.habitat.opacity,
      transition: "opacity 1s ease",
      animation:
        phaseMs > 0
          ? `rhizoh-fracture-habitat-phase 2.8s ease-in-out ${phaseMs}ms infinite`
          : undefined
    };
  }

  if (layer === "wheel") {
    const phaseMs = atmosphere.wheel?.phaseMs ?? 0;
    return {
      opacity: atmosphere.wheel?.opacity ?? 1,
      transition: "opacity 1.1s ease, transform 1.1s ease",
      animation:
        phaseMs > 0
          ? `rhizoh-fracture-wheel-phase 3.4s ease-in-out ${phaseMs}ms infinite`
          : undefined,
      transformOrigin: "top right"
    };
  }

  if (layer === "octo") {
    const phaseMs = atmosphere.octo.phaseMs;
    return {
      opacity: atmosphere.octo.opacity,
      transform: atmosphere.coPresence.depthSeparation
        ? "translateZ(-6px) scale(0.985)"
        : undefined,
      transition: "opacity 1.1s ease, transform 1.1s ease",
      animation:
        phaseMs > 0
          ? `rhizoh-fracture-phase 2.6s ease-in-out ${phaseMs}ms infinite`
          : undefined
    };
  }

  if (layer === "habitat") {
    const floatPx = atmosphere.habitat.floatPx;
    const phaseMs = atmosphere.habitat.phaseMs ?? 0;
    return {
      opacity: atmosphere.habitat.opacity,
      transform: floatPx > 0 ? `translateY(-${floatPx}px)` : undefined,
      transition: "opacity 1s ease, transform 1.4s ease",
      animation:
        phaseMs > 0 && floatPx === 0
          ? `rhizoh-fracture-habitat-phase 2.8s ease-in-out ${phaseMs}ms infinite`
          : undefined
    };
  }

  if (layer === "spatial") {
    const freeze = atmosphere.spatial.parallaxFreeze > 0;
    return {
      opacity: atmosphere.spatial.opacity,
      transform: freeze ? "scale(1.002)" : undefined,
      transition: freeze ? "transform 0.05s linear, opacity 1s ease" : "opacity 1s ease",
      willChange: freeze ? "transform" : undefined
    };
  }

  return {};
}
