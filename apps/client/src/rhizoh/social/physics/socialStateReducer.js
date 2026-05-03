import { computeAttentionDrift } from "./attentionDrift.js";
import { computeTrustFlow } from "./trustFlow.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, unknown>} [cp]
 */
function meanAbsSaturatedPairwiseForce(cp) {
  const o = cp && typeof cp === "object" ? cp : {};
  let s = 0;
  let n = 0;
  for (const k of Object.keys(o)) {
    const e = o[k];
    if (!e || typeof e !== "object") continue;
    const f = Number(e.pairwiseSaturatedForce);
    if (Number.isFinite(f)) {
      s += Math.abs(f);
      n += 1;
    }
  }
  return n ? s / n : 0;
}

/**
 * @param {unknown} prev
 * @param {{ contextTimeline?: unknown, relationships?: unknown, presenceTelemetry?: unknown }} input
 */
export function reduceSocialPhysicsState(prev, input) {
  const p = prev && typeof prev === "object" ? prev : {};
  const t = input?.contextTimeline && typeof input.contextTimeline === "object" ? input.contextTimeline : {};
  const relationships = input?.relationships && typeof input.relationships === "object" ? input.relationships : {};
  const cp = t.coPresenceGraph && typeof t.coPresenceGraph === "object" ? t.coPresenceGraph : {};
  const tsgeDiag = t.tsge && typeof t.tsge === "object" ? t.tsge : {};
  const tsgeLocalGravityMean = clamp01(meanAbsSaturatedPairwiseForce(cp));
  const tsgeSpawnMitosisHint = !!tsgeDiag.spawnMitosisHint;
  const tsgeAttentionCurvatureVariance = Number(tsgeDiag.attentionCurvatureVariance);
  const tsgeStableAttractorHint = !!tsgeDiag.stableAttractorHint;
  const drift = computeAttentionDrift(t);
  const trust = computeTrustFlow(relationships);
  const stabilityScore = clamp01(0.45 + trust.trustMean * 0.4 + drift.interactionMomentum * 0.15 - drift.coPresenceMomentum * 0.08);
  const driftScore = clamp01(drift.coPresenceMomentum * 0.52 + (1 - trust.trustMean) * 0.28 + (drift.direction === "room_scan" ? 0.16 : 0));
  const reconciliationNeed = clamp01(driftScore - stabilityScore * 0.6 + 0.22);
  let phase = "stable";
  if (reconciliationNeed > 0.65) phase = "reconcile";
  else if (driftScore > 0.58) phase = "drifting";
  else if (stabilityScore > 0.7) phase = "coherent";

  const now = Date.now();
  const prevPhase = String(p.phase || "");
  let reconcilePhaseSinceAt = p.reconcilePhaseSinceAt != null ? Number(p.reconcilePhaseSinceAt) : null;
  if (phase === "reconcile") {
    if (prevPhase !== "reconcile" || !Number.isFinite(reconcilePhaseSinceAt)) {
      reconcilePhaseSinceAt = now;
    }
  } else {
    reconcilePhaseSinceAt = null;
  }
  const reconcileDurationMs =
    phase === "reconcile" && reconcilePhaseSinceAt != null
      ? Math.min(300_000, Math.max(0, now - reconcilePhaseSinceAt))
      : 0;
  const rMin = reconcileDurationMs / 60_000;
  const quietStateProbability = clamp01(0.1 + Math.tanh(rMin * 1.25) * 0.82);
  const interactionEnergy = clamp01(
    1 - quietStateProbability * 0.88 + stabilityScore * 0.2 - reconciliationNeed * 0.08
  );
  const observationMode = clamp01(
    driftScore * 0.35 + quietStateProbability * 0.42 + (1 - stabilityScore) * 0.26 + reconciliationNeed * 0.2
  );

  return {
    phase,
    trustRegime: trust.regime,
    attentionDirection: drift.direction,
    stabilityScore: Math.round(stabilityScore * 1000) / 1000,
    driftScore: Math.round(driftScore * 1000) / 1000,
    reconciliationNeed: Math.round(reconciliationNeed * 1000) / 1000,
    interactionMomentum: drift.interactionMomentum,
    coPresenceMomentum: drift.coPresenceMomentum,
    trustMean: trust.trustMean,
    familiarityMean: trust.familiarityMean,
    trustFlux: trust.flux,
    reconcilePhaseSinceAt,
    reconcileDurationMs,
    quietStateProbability: Math.round(quietStateProbability * 1000) / 1000,
    interactionEnergy: Math.round(interactionEnergy * 1000) / 1000,
    observationMode: Math.round(observationMode * 1000) / 1000,
    tsgeLocalGravityMean: Math.round(tsgeLocalGravityMean * 1000) / 1000,
    tsgeSpawnMitosisHint,
    tsgeAttentionCurvatureVariance: Number.isFinite(tsgeAttentionCurvatureVariance)
      ? Math.round(tsgeAttentionCurvatureVariance * 1_000_000) / 1_000_000
      : 0,
    tsgeStableAttractorHint,
    updatedAt: now,
    lastPhase: p.phase || null
  };
}

