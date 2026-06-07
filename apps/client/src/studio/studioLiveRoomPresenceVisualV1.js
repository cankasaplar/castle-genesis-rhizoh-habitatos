import { COMPANION_PRESENCE_STATE_V0 } from "../castleFlight/companionPresenceStateV0.js";

/** Studio-facing presence modes (voice + PWE projection). */
export const STUDIO_VISUAL_PRESENCE_V1 = Object.freeze({
  OBSERVING: "observing",
  THINKING: "thinking",
  SPEAKING: "speaking",
  LISTENING: "listening"
});

/**
 * @typedef {{
 *   emissive: number,
 *   bloom: number,
 *   rotSpeed: number,
 *   pulse: number
 * }} StudioPresenceVisualParamsV1
 */

/** @type {Record<string, StudioPresenceVisualParamsV1>} */
export const STUDIO_PRESENCE_VISUAL_MAP_V1 = Object.freeze({
  observing: Object.freeze({ emissive: 0.22, bloom: 0, rotSpeed: 0, pulse: 0.15 }),
  thinking: Object.freeze({ emissive: 0.38, bloom: 1, rotSpeed: 0.02, pulse: 0.45 }),
  speaking: Object.freeze({ emissive: 0.92, bloom: 0.35, rotSpeed: 0, pulse: 0.75 }),
  listening: Object.freeze({ emissive: 0.48, bloom: 0.12, rotSpeed: 0.08, pulse: 0.3 })
});

/**
 * PWE companion state → studio visual presence.
 * @param {string} pweState
 * @returns {string}
 */
export function mapPweStateToStudioVisualV1(pweState) {
  const s = String(pweState || "").toLowerCase();
  switch (s) {
    case COMPANION_PRESENCE_STATE_V0.FOLLOWING:
      return STUDIO_VISUAL_PRESENCE_V1.LISTENING;
    case COMPANION_PRESENCE_STATE_V0.EXPLORING:
    case COMPANION_PRESENCE_STATE_V0.TRAINING:
      return STUDIO_VISUAL_PRESENCE_V1.THINKING;
    case "speaking":
    case "reacting":
      return STUDIO_VISUAL_PRESENCE_V1.SPEAKING;
    default:
      return STUDIO_VISUAL_PRESENCE_V1.OBSERVING;
  }
}

/**
 * @param {string} studioPresence
 * @returns {StudioPresenceVisualParamsV1}
 */
export function resolveStudioPresenceVisualV1(studioPresence) {
  const key = String(studioPresence || STUDIO_VISUAL_PRESENCE_V1.OBSERVING).toLowerCase();
  return STUDIO_PRESENCE_VISUAL_MAP_V1[key] || STUDIO_PRESENCE_VISUAL_MAP_V1.observing;
}

/**
 * @param {string} rhizohFieldState
 */
export function mapRhizohFieldToStudioVisualV1(rhizohFieldState) {
  const s = String(rhizohFieldState || "IDLE").toUpperCase();
  if (s === "SPEAKING" || s === "EXECUTING") return STUDIO_VISUAL_PRESENCE_V1.SPEAKING;
  if (s === "LISTENING" || s === "INTERPRETING") return STUDIO_VISUAL_PRESENCE_V1.LISTENING;
  if (s === "GENERATING") return STUDIO_VISUAL_PRESENCE_V1.THINKING;
  return STUDIO_VISUAL_PRESENCE_V1.OBSERVING;
}

/**
 * Apply emissive / pulse hints to a loaded GLB root (stage entities).
 * @param {THREE.Object3D | undefined} root
 * @param {string} studioPresence
 * @param {number} [t]
 */
export function applyStudioPresenceVisualToRootV1(root, studioPresence, t = 0) {
  if (!root) return;
  const v = resolveStudioPresenceVisualV1(studioPresence);
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat.emissive) continue;
      const pulse = v.pulse * (0.85 + 0.15 * Math.sin(t * 4.2));
      mat.emissiveIntensity = v.emissive * (studioPresence === "speaking" ? pulse : 1);
    }
  });
  root.userData.studioPresence = studioPresence;
  root.userData.studioBloom = v.bloom;
  root.userData.studioRotSpeed = v.rotSpeed;
}
