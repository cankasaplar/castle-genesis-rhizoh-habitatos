/**
 * Product copy SSOT — Turkish-first labels (first cohort).
 * @see docs/RHIZOH_LOCAL_ACTION_AUTHORITY_V0.md
 */

import {
  formatPlainIntentChosenTrV0,
  formatPlainSurfaceOpenTrV0
} from "./rhizohProductPlainCopyV0.js";

/** @typedef {'world'|'hall'|'greenroom'|'broadcast'|'studio'|'profile'} RhizohProductSurfaceIdV0 */

/** @type {Record<RhizohProductSurfaceIdV0, { shell: string, short: string, pathHint: string }>} */
export const RHIZOH_PRODUCT_SURFACE_COPY_TR_V0 = Object.freeze({
  world: Object.freeze({ shell: "Dünya", short: "Dünya", pathHint: "Ana sahne · ajanlar · konuşma" }),
  hall: Object.freeze({ shell: "Salon", short: "Salon", pathHint: "Kayıt ve gözlem" }),
  greenroom: Object.freeze({ shell: "Hazırlık", short: "Hazırlık", pathHint: "Yayın öncesi oda" }),
  broadcast: Object.freeze({ shell: "Yayın", short: "Yayın", pathHint: "Canlı yayın" }),
  studio: Object.freeze({ shell: "Stüdyo", short: "Stüdyo", pathHint: "Üretim ve oturum" }),
  profile: Object.freeze({ shell: "Profil", short: "Profil", pathHint: "Hesap ve ayarlar" })
});

export const RHIZOH_LOCAL_ACTION_BINDING_V0 =
  "Local Rhizoh acts first — surface, grammar, and continuity without the remote model.";

/**
 * @param {string} surfaceId
 * @returns {string}
 */
export function resolveProductSurfaceLabelTrV0(surfaceId) {
  const row = RHIZOH_PRODUCT_SURFACE_COPY_TR_V0[/** @type {RhizohProductSurfaceIdV0} */ (surfaceId)];
  return row?.shell || "Dünya";
}

/**
 * @param {string} surfaceId
 * @returns {string}
 */
export function formatLocalSurfaceEnterReplyTrV0(surfaceId) {
  return formatPlainSurfaceOpenTrV0(surfaceId);
}

/**
 * @param {string} intentId
 * @returns {string}
 */
export function formatLocalIntentReplyTrV0(intentId) {
  return formatPlainIntentChosenTrV0(intentId);
}
