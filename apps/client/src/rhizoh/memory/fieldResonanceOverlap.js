/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Post-retrieval physics alignment: imprint (frozen field) vs current CSPE (+ optional field theory).
 * Returns ∈ (0,1] — not a pre-filter; multiplies semantic score at collapse time.
 * @param {Record<string, unknown> | null | undefined} imprint
 * @param {Record<string, unknown> | null | undefined} currentPhysics
 * @param {Record<string, unknown> | null | undefined} currentFieldTheory
 */
export function computeFieldResonanceOverlap(imprint, currentPhysics, currentFieldTheory) {
  if (!imprint || typeof imprint !== "object") return 0.88;
  const cur = currentPhysics && typeof currentPhysics === "object" ? currentPhysics : {};
  const cft = currentFieldTheory && typeof currentFieldTheory === "object" ? currentFieldTheory : {};
  const dStab = Math.abs(clamp01(imprint.stability) - clamp01(cur.stabilityScore));
  const dDrift = Math.abs(clamp01(imprint.drift) - clamp01(cur.driftScore));
  const phaseMatch = String(imprint.phase || "") === String(cur.phase || "") ? 1 : 0.58;
  const coI = clamp01(imprint.coPresenceMomentum);
  const coC = clamp01(cur.coPresenceMomentum);
  const ixI = clamp01(imprint.interactionMomentum);
  const ixC = clamp01(cur.interactionMomentum);
  const momentumAlign = clamp01(0.32 + Math.sqrt(coI * coC) * 0.38 + Math.sqrt(ixI * ixC) * 0.35);
  const geometric = clamp01(1 - 0.62 * dStab - 0.48 * dDrift);
  const ip = String(imprint.interferencePattern || "");
  const cp = cft.interference && typeof cft.interference === "object" ? String(cft.interference.pattern || "") : "";
  const infMatch = ip && cp ? (ip === cp ? 1 : 0.7) : 0.86;
  const attnI = imprint.attentionVx != null && imprint.attentionVy != null;
  const af = cft.attentionField && typeof cft.attentionField === "object" ? cft.attentionField : {};
  let vecAlign = 0.82;
  if (attnI && af.vx != null && af.vy != null) {
    const a = Number(imprint.attentionVx) * Number(af.vx) + Number(imprint.attentionVy) * Number(af.vy);
    const m = Math.hypot(Number(imprint.attentionVx), Number(imprint.attentionVy)) * Math.hypot(Number(af.vx), Number(af.vy));
    vecAlign = m > 1e-6 ? clamp01(0.55 + 0.45 * (0.5 + 0.5 * (a / m))) : 0.75;
  }
  return clamp01(0.07 + geometric * 0.38 + phaseMatch * 0.18 + momentumAlign * 0.16 + infMatch * 0.08 + vecAlign * 0.13);
}
