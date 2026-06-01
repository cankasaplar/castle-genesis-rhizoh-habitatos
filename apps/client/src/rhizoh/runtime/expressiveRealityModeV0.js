/**
 * Expressive reality mode — build-time surface row (E2-C observer vs E2-X creative).
 * Experience state label; ceremony runtime: expressiveRealityTransitionV0.js (RTL).
 *
 * @see docs/RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md
 * @see apps/client/docs/DEPLOY_MATRIX_V1.0.md §6–§7
 */

import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";

/** Observer cohort shell — Studio/Map off at deploy row. */
export const EXPRESSIVE_REALITY_MODE_OBSERVER_V0 = "E2-C";

/** Creative surface cohort — frozen intelligence + switchable expressive layer ON. */
export const EXPRESSIVE_REALITY_MODE_CREATIVE_V0 = "E2-X";

/**
 * @returns {typeof EXPRESSIVE_REALITY_MODE_OBSERVER_V0 | typeof EXPRESSIVE_REALITY_MODE_CREATIVE_V0}
 */
export function resolveExpressiveRealityModeV0() {
  return isRhizohCreativeSurfaceEnabledV0()
    ? EXPRESSIVE_REALITY_MODE_CREATIVE_V0
    : EXPRESSIVE_REALITY_MODE_OBSERVER_V0;
}

/**
 * User-facing transition narrative (v0 copy only — no animation yet).
 * @returns {{ mode: string, headline: string, subline: string, transitionGap: true }}
 */
export function readExpressiveRealityModePresentationV0() {
  const mode = resolveExpressiveRealityModeV0();
  if (mode === EXPRESSIVE_REALITY_MODE_CREATIVE_V0) {
    return Object.freeze({
      mode,
      headline: "Dünya katmanı açık",
      subline: "Konuşma, studio ve harita aynı süreklilik üzerinde.",
      transitionGap: false
    });
  }
  return Object.freeze({
    mode,
    headline: "Gözlem modu",
    subline: "Sohbet ve süreklilik açık; studio ve harita bu kohortta kapalı.",
    transitionGap: true
  });
}
