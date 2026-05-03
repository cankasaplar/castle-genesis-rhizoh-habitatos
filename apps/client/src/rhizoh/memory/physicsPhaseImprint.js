/**
 * Phase imprint: crystallized social physics at write time (living trace, not a dead snapshot).
 * @param {Record<string, unknown> | null | undefined} socialPhysics
 * @param {Record<string, unknown> | null | undefined} socialFieldTheory
 */
export function buildPhysicsPhaseImprint(socialPhysics, socialFieldTheory) {
  const sp = socialPhysics && typeof socialPhysics === "object" ? socialPhysics : {};
  const ft = socialFieldTheory && typeof socialFieldTheory === "object" ? socialFieldTheory : {};
  const af = ft.attentionField && typeof ft.attentionField === "object" ? ft.attentionField : {};
  const inf = ft.interference && typeof ft.interference === "object" ? ft.interference : {};
  return {
    stability: Number(sp.stabilityScore) || 0,
    drift: Number(sp.driftScore) || 0,
    trustFlux: Number(sp.trustFlux) || 0,
    phase: String(sp.phase || "stable"),
    coPresenceMomentum: Number(sp.coPresenceMomentum) || 0,
    interactionMomentum: Number(sp.interactionMomentum) || 0,
    reconciliationNeed: Number(sp.reconciliationNeed) || 0,
    interferencePattern: String(inf.pattern || "mixed"),
    attentionVx: Number(af.vx) || 0,
    attentionVy: Number(af.vy) || 0,
    imprintedAt: Date.now()
  };
}

/** @param {number} w */
export function classifyMemoryCrystallization(w) {
  return w > 0.38 ? "ANCHOR_MEMORY" : "EPHEMERAL_MEMORY";
}
