/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Trust / familiarity as scalar density samples over relationship nodes.
 * @param {Record<string, unknown>} relationships
 * @param {number} [maxNodes]
 */
export function computeTrustScalarDensity(relationships, maxNodes = 12) {
  const rel = relationships && typeof relationships === "object" ? relationships : {};
  const ids = Object.keys(rel);
  let sum = 0;
  const samples = [];
  for (const id of ids) {
    const row = rel[id];
    if (!row || typeof row !== "object") continue;
    const t = clamp01(row.trust);
    const f = clamp01(row.familiarity);
    const rho = clamp01(0.45 * t + 0.55 * f);
    samples.push({
      entityId: id,
      rho: Math.round(rho * 1000) / 1000,
      trust: Math.round(t * 1000) / 1000,
      familiarity: Math.round(f * 1000) / 1000
    });
    sum += rho;
  }
  samples.sort((a, b) => b.rho - a.rho);
  const top = samples.slice(0, maxNodes);
  const n = Math.max(1, samples.length);
  const meanRho = sum / n;
  const totalMass = Math.round(sum * 1000) / 1000;
  return {
    meanRho: Math.round(meanRho * 1000) / 1000,
    totalMass,
    samples: top
  };
}
