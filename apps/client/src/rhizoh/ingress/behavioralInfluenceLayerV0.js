/**
 * Behavioral Influence Layer v0 — habitat-safe soft policy modulation.
 * sediment → attention weighting ONLY (ranking bias · visibility hint · anchor scalar).
 * NEVER causal write · NEVER identity · NEVER learning loop · NEVER observe().
 * @see docs/RHIZOH_BEHAVIORAL_INFLUENCE_LAYER_V0.md
 */

import { OBSERVER_PLANE_V0, OBSERVER_TRACE_EXCLUDED_SINKS_V0 } from "./observerReadOnlyHookV0.js";
import {
  getAttentionSedimentSnapshotV0,
  SEDIMENT_INPUT_SOURCE_V0
} from "./attentionSedimentationBufferV0.js";
import { runEpistemicConsumeOnlyPassV0 } from "./epistemicInvocationGuardV0.js";

export const BEHAVIORAL_INFLUENCE_SCHEMA_V0 = "castle.rhizoh.behavioral_influence.v0";

/** Soft cap — prevents runaway attention amplification. */
export const MAX_BEHAVIOR_WEIGHT_V0 = 1.35;

/**
 * @param {object | null | undefined} stratum
 * @param {{ crossLensBoost?: number }} [ctx]
 */
export function computeBehaviorWeightV0(stratum, ctx = {}) {
  if (!stratum) return 1;
  const freqFactor = Math.min(1, (stratum.frequency || 0) / 4);
  const decay = Number(stratum.salienceDecay) || 0;
  const cluster = stratum.source === SEDIMENT_INPUT_SOURCE_V0.MAP ? Number(stratum.clusterDensity) || 0 : 0;
  const anchor =
    stratum.source === SEDIMENT_INPUT_SOURCE_V0.CHESS && stratum.constraintAnchor ? 0.08 : 0;
  const crossLens = Number(ctx.crossLensBoost) || 0;
  const raw = 1 + freqFactor * decay * 0.5 + cluster * 0.15 + anchor + crossLens;
  return Math.round(Math.min(MAX_BEHAVIOR_WEIGHT_V0, raw) * 1000) / 1000;
}

/**
 * Map ∩ Chess weak confirmation when both strata exist.
 * @param {readonly object[]} strata
 */
export function computeCrossLensAgreementV0(strata) {
  const map = strata.filter((s) => s.source === SEDIMENT_INPUT_SOURCE_V0.MAP);
  const chess = strata.filter((s) => s.source === SEDIMENT_INPUT_SOURCE_V0.CHESS);
  if (!map.length || !chess.length) {
    return Object.freeze({ agreement: 0, boost: 0, confirmed: false });
  }
  const agreement = Math.min(1, (map.length + chess.length) / 6);
  const boost = Math.round(Math.min(0.12, agreement * 0.1) * 1000) / 1000;
  return Object.freeze({ agreement, boost, confirmed: boost > 0 });
}

/**
 * @param {string} entityId
 * @param {readonly object[]} entries
 */
function matchStratumForEntityV0(entityId, strata, entries = []) {
  const id = String(entityId || "");
  const direct = strata.find((s) => s.key.includes(id) || id.includes(String(s.key.split(":")[1] || "")));
  if (direct) return direct;

  for (const entry of entries) {
    const key = `${entry.type}:${entry.target}`;
    if (key.includes(id) || id.includes(entry.target)) {
      return strata.find((s) => s.key === key) || null;
    }
  }
  return null;
}

/**
 * @param {readonly object[]} narrativeItems
 * @param {{ sediment?: object, observerEntries?: object[], locale?: string, enabled?: boolean }} [opts]
 */
export function applyBehavioralInfluenceToNarrativesV0(narrativeItems, opts = {}) {
  const enabled = opts.enabled !== false;
  const sediment = opts.sediment ?? getAttentionSedimentSnapshotV0();
  const strata = sediment?.strata || [];
  const entries = opts.observerEntries || [];
  const crossLens = computeCrossLensAgreementV0(strata);

  if (!enabled || !strata.length) {
    const ranked = [...narrativeItems].sort((a, b) => b.salience - a.salience);
    return Object.freeze({
      ranked: Object.freeze(ranked),
      influenced: false,
      influencesSelection: false,
      temporalSediment: Object.freeze({
        available: strata.length > 0,
        influencesSelection: false,
        interpretationOnly: true
      }),
      interpretationOnly: true
    });
  }

  const influencedItems = narrativeItems.map((item) => {
    const stratum = matchStratumForEntityV0(item.entityId, strata, entries);
    const behaviorWeight = computeBehaviorWeightV0(stratum, { crossLensBoost: crossLens.boost });
    const mapWeight =
      stratum?.source === SEDIMENT_INPUT_SOURCE_V0.MAP
        ? 1 + (stratum.clusterDensity || 0) * 0.1
        : 1;
    const chessAnchor =
      stratum?.source === SEDIMENT_INPUT_SOURCE_V0.CHESS && stratum.constraintAnchor ? 1.05 : 1;
    const influencedSalience = Math.min(
      1,
      Math.round(item.salience * mapWeight * chessAnchor * behaviorWeight * 1000) / 1000
    );

    return Object.freeze({
      ...item,
      baseSalience: item.salience,
      behaviorWeight,
      mapWeight: Math.round(mapWeight * 1000) / 1000,
      chessAnchor,
      influencedSalience,
      sedimentKey: stratum?.key ?? null,
      softInfluenceOnly: true
    });
  });

  const ranked = [...influencedItems].sort((a, b) => b.influencedSalience - a.influencedSalience);
  const top = ranked[0];
  const tr = opts.locale === "tr";

  return Object.freeze({
    ranked: Object.freeze(ranked),
    influenced: true,
    influencesSelection: true,
    temporalSediment: Object.freeze({
      available: true,
      influencesSelection: true,
      dominantKey: top?.sedimentKey ?? strata[0]?.key,
      frequency: strata[0]?.frequency ?? 0,
      behaviorWeight: top?.behaviorWeight ?? 1,
      crossLensAgreement: crossLens.agreement,
      crossLensConfirmed: crossLens.confirmed,
      label: tr
        ? `Dikkat ağırlığı: ${top?.sedimentKey || "—"} (×${top?.behaviorWeight ?? 1})`
        : `Attention weight: ${top?.sedimentKey || "—"} (×${top?.behaviorWeight ?? 1})`,
      interpretationOnly: true
    }),
    crossLens,
    interpretationOnly: true
  });
}

/**
 * Map visibility scalers for UI (read-only hints — does not mutate map/causal state).
 * @param {{ sediment?: object }} [opts]
 */
export function buildMapAttentionWeightsV0(opts = {}) {
  const sediment = opts.sediment ?? getAttentionSedimentSnapshotV0();
  const mapStrata = (sediment?.strata || []).filter((s) => s.source === SEDIMENT_INPUT_SOURCE_V0.MAP);

  const pins = mapStrata.map((s) => {
    const target = String(s.key.split(":")[1] || s.key);
    const visibilityWeight = computeBehaviorWeightV0(s);
    return Object.freeze({
      target,
      key: s.key,
      frequency: s.frequency,
      visibilityWeight,
      highlightHint: visibilityWeight > 1.08,
      influencesCausalGraph: false,
      interpretationOnly: true
    });
  });

  return Object.freeze({
    schema: BEHAVIORAL_INFLUENCE_SCHEMA_V0,
    plane: OBSERVER_PLANE_V0.BEHAVIORAL_INFLUENCE,
    pins: Object.freeze(pins),
    clusterDensity: sediment?.mapField?.clusterDensity ?? 0,
    influencesMapState: false,
    influencesCausalGraph: false,
    softInfluenceOnly: true,
    interpretationOnly: true
  });
}

/**
 * @param {{ locale?: string, sediment?: object, observerEntries?: object[], enabled?: boolean }} [opts]
 */
export function resolveBehavioralInfluenceV0(opts = {}) {
  return runEpistemicConsumeOnlyPassV0(() => {
    const sediment = opts.sediment ?? getAttentionSedimentSnapshotV0();
    const mapWeights = buildMapAttentionWeightsV0({ sediment });

    return Object.freeze({
      schema: BEHAVIORAL_INFLUENCE_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.BEHAVIORAL_INFLUENCE,
      sedimentRefreshed: (sediment?.stratumCount ?? 0) > 0,
      mapAttention: mapWeights,
      chessAnchorBias: sediment?.chessField?.deterministicAnchor === true ? 1.05 : 1,
      learns: false,
      influencesCausalGraph: false,
      influencesIdentity: false,
      influencesMapState: false,
      influencesChessEngine: false,
      softInfluenceOnly: true,
      excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
      interpretationOnly: true
    });
  }, 0);
}

export function mountBehavioralInfluenceConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.behavioralInfluence = Object.freeze({
    resolve: resolveBehavioralInfluenceV0,
    applyToNarratives: applyBehavioralInfluenceToNarrativesV0,
    mapWeights: buildMapAttentionWeightsV0,
    computeWeight: computeBehaviorWeightV0
  });
}
