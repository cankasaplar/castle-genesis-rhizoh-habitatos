/**
 * Cross-Tower Bias Coupler v0 — Map ↔ Narrative bias sync, Chess anchor fixed.
 * Stabilizes "meaning feel" without learning, causal write, or identity mutation.
 * @see docs/RHIZOH_CROSS_TOWER_BIAS_COUPLER_V0.md
 */

import { OBSERVER_PLANE_V0, OBSERVER_TRACE_EXCLUDED_SINKS_V0 } from "./observerReadOnlyHookV0.js";
import { getAttentionSedimentSnapshotV0 } from "./attentionSedimentationBufferV0.js";
import {
  buildMapAttentionWeightsV0,
  computeBehaviorWeightV0,
  computeCrossLensAgreementV0
} from "./behavioralInfluenceLayerV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "./narrativeProjectionEngineV0.js";
import { runEpistemicConsumeOnlyPassV0 } from "./epistemicInvocationGuardV0.js";

export const CROSS_TOWER_BIAS_COUPLER_SCHEMA_V0 = "castle.rhizoh.cross_tower_bias_coupler.v0";

/**
 * bias scalar in [0, MAX] where finalScore uses (1 + bias).
 * @param {object | null | undefined} stratum
 */
export function computeBiasScalarV0(stratum) {
  const w = computeBehaviorWeightV0(stratum);
  return Math.round(Math.max(0, w - 1) * 1000) / 1000;
}

/**
 * @param {string} a
 * @param {string} b
 */
function towerTargetOverlapV0(a, b) {
  const na = String(a || "").toLowerCase();
  const nb = String(b || "").toLowerCase();
  if (!na || !nb) return 0;
  if (na === nb || na.includes(nb) || nb.includes(na)) return 1;
  const tailA = na.replace(/^pin_/, "");
  const tailB = nb.replace(/^pin_/, "");
  if (tailA && tailB && (tailA === tailB || na.includes(tailB) || nb.includes(tailA))) return 0.85;
  return 0;
}

/**
 * @param {{ locale?: string, sediment?: object }} [opts]
 */
export function coupleCrossTowerBiasV0(opts = {}) {
  return runEpistemicConsumeOnlyPassV0(() => {
    const sediment = opts.sediment ?? getAttentionSedimentSnapshotV0();
    const locale = opts.locale ?? "en";
    const mapTower = buildMapAttentionWeightsV0({ sediment });
    const narrative = resolveNarrativeFromObserverTraceV0({ locale, behavioralInfluence: true });
    const crossLens = computeCrossLensAgreementV0(sediment?.strata || []);

    const mapTop = mapTower.pins?.[0] ?? null;
    const narrativeTop = narrative.primaryFocus;
    const mapTarget = mapTop?.target ?? "";
    const narrativeTarget = narrativeTop?.entityId ?? narrativeTop?.sedimentKey ?? "";

    const towerOverlap = towerTargetOverlapV0(mapTarget, narrativeTarget);
    const mapBias = mapTop ? computeBiasScalarV0(sediment.strata?.find((s) => s.key === mapTop.key)) : 0;
    const narrativeBias = narrativeTop?.behaviorWeight
      ? Math.max(0, (narrativeTop.behaviorWeight || 1) - 1)
      : 0;

    const couplingStrength = Math.round(
      Math.min(1, towerOverlap * 0.55 + crossLens.agreement * 0.25 + Math.min(mapBias, narrativeBias) * 0.2) *
        1000
    ) / 1000;

    const meaningStability = Math.round(
      Math.min(1, couplingStrength * (crossLens.confirmed ? 1.1 : 0.85)) * 1000
    ) / 1000;

    const chessAnchorLocked = sediment?.chessField?.deterministicAnchor === true;

    return Object.freeze({
      schema: CROSS_TOWER_BIAS_COUPLER_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.BEHAVIORAL_INFLUENCE,
      mapTower: Object.freeze({
        dominantTarget: mapTarget || null,
        visibilityWeight: mapTop?.visibilityWeight ?? 1,
        biasScalar: mapBias
      }),
      narrativeTower: Object.freeze({
        dominantTarget: narrativeTarget || null,
        influencedSalience: narrativeTop?.influencedSalience ?? narrativeTop?.salience ?? 0,
        biasScalar: narrativeBias
      }),
      chessTower: Object.freeze({
        anchorLocked: chessAnchorLocked,
        anchorBias: chessAnchorLocked ? 1.05 : 1,
        influencesEngine: false
      }),
      couplingStrength,
      meaningStability,
      towerOverlap,
      crossLens,
      learns: false,
      isLearning: false,
      influencesCausalGraph: false,
      influencesIdentity: false,
      influencesMapState: false,
      influencesChessEngine: false,
      softInfluenceOnly: true,
      biasNotLearning: true,
      behaviorBias: true,
      truthBias: false,
      excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
      interpretationOnly: true
    });
  }, 0);
}

export function mountCrossTowerBiasCouplerConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.crossTowerBiasCoupler = Object.freeze({
    couple: coupleCrossTowerBiasV0
  });
}
