/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, { trust?: number, familiarity?: number, stage?: string }>} relationships
 */
export function computeTrustFlow(relationships) {
  const rel = relationships && typeof relationships === "object" ? relationships : {};
  const rows = Object.values(rel);
  if (!rows.length) {
    return { trustMean: 0, familiarityMean: 0, flux: 0, regime: "observe-only" };
  }
  const trustMean = rows.reduce((a, r) => a + (Number(r?.trust) || 0), 0) / rows.length;
  const familiarityMean = rows.reduce((a, r) => a + (Number(r?.familiarity) || 0), 0) / rows.length;
  const trustedN = rows.filter((r) => String(r?.stage) === "trusted" || String(r?.stage) === "bonded").length;
  const flux = clamp01(trustedN / rows.length);
  let regime = "observe-only";
  if (trustMean > 0.2) regime = "limited-response";
  if (trustMean > 0.38) regime = "normal-interaction";
  if (trustMean > 0.58) regime = "memory-write-enabled";
  if (trustMean > 0.76 && familiarityMean > 0.62) regime = "verified";
  return {
    trustMean: Math.round(trustMean * 1000) / 1000,
    familiarityMean: Math.round(familiarityMean * 1000) / 1000,
    flux: Math.round(flux * 1000) / 1000,
    regime
  };
}

