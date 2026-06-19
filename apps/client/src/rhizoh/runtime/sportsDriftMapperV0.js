/**
 * Sports Drift Mapper v0 — stochastic signal → reason category (drift reuse).
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SPORTS_ADAPTER_V0.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "../ticket/mutationReasonCodeOntologyV1.js";

export const SPORTS_DRIFT_MAPPER_SCHEMA_V0 = "castle.rhizoh.sports_drift_mapper.v0";

export const SPORTS_DRIFT_SIGNAL_V0 = Object.freeze({
  SCORE_SWING: "score_swing",
  MOMENTUM_SHIFT: "momentum_shift",
  FATIGUE: "fatigue",
  PERFORMANCE_SPIKE: "performance_spike"
});

export const ENTROPY_DRIFT_CATEGORY_V0 = "ENTROPY_DRIFT";

/**
 * @param {string} signal
 */
export function mapSportsSignalToReasonCategoryV0(signal) {
  switch (String(signal || "")) {
    case SPORTS_DRIFT_SIGNAL_V0.SCORE_SWING:
      return MUTATION_REASON_CATEGORY_V1.SC;
    case SPORTS_DRIFT_SIGNAL_V0.MOMENTUM_SHIFT:
      return MUTATION_REASON_CATEGORY_V1.REC;
    case SPORTS_DRIFT_SIGNAL_V0.FATIGUE:
      return MUTATION_REASON_CATEGORY_V1.QUOTA;
    case SPORTS_DRIFT_SIGNAL_V0.PERFORMANCE_SPIKE:
      return ENTROPY_DRIFT_CATEGORY_V0;
    default:
      return ENTROPY_DRIFT_CATEGORY_V0;
  }
}

/**
 * @param {object} normalizedEvent
 */
export function deriveSportsDriftSignalsV0(normalizedEvent) {
  const type = String(normalizedEvent?.eventType || "");
  const payload = normalizedEvent?.payload || {};
  /** @type {object[]} */
  const signals = [];

  if (type === "score_delta" || Math.abs(Number(payload.delta) || 0) >= 2) {
    signals.push(
      Object.freeze({
        signal: SPORTS_DRIFT_SIGNAL_V0.SCORE_SWING,
        category: mapSportsSignalToReasonCategoryV0(SPORTS_DRIFT_SIGNAL_V0.SCORE_SWING),
        confidence: Math.min(1, Math.abs(Number(payload.delta) || 1) / 3)
      })
    );
  }

  if (type === "momentum_shift" || Number(payload.momentumDelta) > 0.15) {
    signals.push(
      Object.freeze({
        signal: SPORTS_DRIFT_SIGNAL_V0.MOMENTUM_SHIFT,
        category: mapSportsSignalToReasonCategoryV0(SPORTS_DRIFT_SIGNAL_V0.MOMENTUM_SHIFT),
        confidence: Math.min(1, Number(payload.momentumDelta) || 0.5)
      })
    );
  }

  if (payload.fatigue01 != null && Number(payload.fatigue01) > 0.7) {
    signals.push(
      Object.freeze({
        signal: SPORTS_DRIFT_SIGNAL_V0.FATIGUE,
        category: mapSportsSignalToReasonCategoryV0(SPORTS_DRIFT_SIGNAL_V0.FATIGUE),
        confidence: Number(payload.fatigue01)
      })
    );
  }

  if (type === "player_action" && Number(payload.anomalyScore) > 0.6) {
    signals.push(
      Object.freeze({
        signal: SPORTS_DRIFT_SIGNAL_V0.PERFORMANCE_SPIKE,
        category: ENTROPY_DRIFT_CATEGORY_V0,
        confidence: Number(payload.anomalyScore)
      })
    );
  }

  if (signals.length === 0 && type) {
    signals.push(
      Object.freeze({
        signal: SPORTS_DRIFT_SIGNAL_V0.PERFORMANCE_SPIKE,
        category: ENTROPY_DRIFT_CATEGORY_V0,
        confidence: 0.35
      })
    );
  }

  return Object.freeze(signals);
}

/**
 * @param {object[]} events
 */
export function aggregateSportsDriftCategoriesV0(events) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const ev of events || []) {
    const signals = deriveSportsDriftSignalsV0(ev);
    for (const sig of signals) {
      counts[sig.category] = (counts[sig.category] || 0) + 1;
    }
  }
  return Object.freeze(counts);
}

/**
 * @param {object} signal
 */
export function buildSportsDriftReasonV0(signal) {
  const category = mapSportsSignalToReasonCategoryV0(signal.signal);
  const primary =
    category === ENTROPY_DRIFT_CATEGORY_V0
      ? "ENTROPY_DRIFT_STOCHASTIC_ANOMALY"
      : `${category}_SPORTS_SIGNAL`;
  return Object.freeze({
    primary,
    category,
    code: primary,
    message: `Sports ${signal.signal} observed in stochastic causal space`,
    sportsSignal: signal.signal,
    confidence: signal.confidence
  });
}
