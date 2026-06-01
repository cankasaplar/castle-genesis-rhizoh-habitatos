/**
 * Product copy SSOT — Turkish-first labels (first cohort).
 * @see docs/RHIZOH_LOCAL_ACTION_AUTHORITY_V0.md
 */

/** @typedef {'world'|'hall'|'greenroom'|'broadcast'|'studio'|'profile'} RhizohProductSurfaceIdV0 */

/** @type {Record<RhizohProductSurfaceIdV0, { shell: string, short: string, pathHint: string }>} */
export const RHIZOH_PRODUCT_SURFACE_COPY_TR_V0 = Object.freeze({
  world: Object.freeze({ shell: "Dünya", short: "Dünya", pathHint: "Harita ve çekirdek" }),
  hall: Object.freeze({ shell: "Salon", short: "Salon", pathHint: "/hall/main" }),
  greenroom: Object.freeze({ shell: "Green Room", short: "Green", pathHint: "Green Room" }),
  broadcast: Object.freeze({ shell: "Yayın", short: "Yayın", pathHint: "Canlı yayın" }),
  studio: Object.freeze({ shell: "Stüdyo", short: "Stüdyo", pathHint: "/studio" }),
  profile: Object.freeze({ shell: "Profil", short: "Profil", pathHint: "Ayarlar ve kimlik" })
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
  return `${resolveProductSurfaceLabelTrV0(surfaceId)} açıldı.`;
}

/**
 * @param {string} intentId
 * @returns {string}
 */
export function formatLocalIntentReplyTrV0(intentId) {
  const map = Object.freeze({
    explore: "Keşif modu seçildi.",
    produce: "Üretim modu seçildi.",
    observe: "İzleme modu seçildi.",
    connect: "Bağlantı modu seçildi."
  });
  return map[String(intentId || "")] || "Niyet güncellendi.";
}
