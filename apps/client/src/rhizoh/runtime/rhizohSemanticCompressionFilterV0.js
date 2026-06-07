/**
 * Semantic Compression Filter v0 — identity-meaningful vs telemetry noise.
 * Prevents "remembers everything but forgets what matters."
 */

import { resolveEventProfileV0 } from "./rhizohPulsePriorityEngineV0.js";

export const RHIZOH_SEMANTIC_FILTER_SCHEMA_V0 = "rhizoh.semantic_compression_filter.v0";

const MEANINGFUL_WEIGHT_FLOOR_V0 = 0.45;
const TELEMETRY_WEIGHT_CEILING_V0 = 0.15;

/**
 * @param {object} event
 */
export function classifyEventSemanticsV0(event = {}) {
  const profile = resolveEventProfileV0(event);
  const weight = profile.eventWeight;
  const telemetry = profile.telemetry === true || weight <= TELEMETRY_WEIGHT_CEILING_V0;
  const meaningful = profile.identityMeaningful && weight >= MEANINGFUL_WEIGHT_FLOOR_V0;

  return Object.freeze({
    schema: RHIZOH_SEMANTIC_FILTER_SCHEMA_V0,
    key: profile.key,
    eventWeight: weight,
    meaningful,
    telemetry,
    compressible: telemetry || !meaningful,
    retainInIdentity: meaningful,
    semanticMass: meaningful ? weight : telemetry ? 0.02 : weight * 0.25
  });
}

/**
 * @param {object} logSnapshot — from getIdentityEventLogSnapshotV0()
 */
export function filterIdentityNoiseV0(logSnapshot = {}) {
  const recent = logSnapshot.recent || [];
  const classified = recent.map((row) =>
    Object.freeze({
      id: row.id,
      classification: classifyEventSemanticsV0({
        type: row.type,
        intent: row.intent,
        presenceKind: row.presenceKind
      })
    })
  );

  const meaningfulEvents = classified.filter((c) => c.classification.retainInIdentity);
  const telemetryEvents = classified.filter((c) => c.classification.telemetry);
  const semanticMass = meaningfulEvents.reduce(
    (sum, c) => sum + c.classification.semanticMass,
    0
  );
  const noiseRatio =
    recent.length > 0 ? telemetryEvents.length / recent.length : 0;

  return Object.freeze({
    schema: RHIZOH_SEMANTIC_FILTER_SCHEMA_V0,
    total: recent.length,
    meaningfulCount: meaningfulEvents.length,
    telemetryCount: telemetryEvents.length,
    semanticMass: Number(semanticMass.toFixed(3)),
    noiseRatio: Number(noiseRatio.toFixed(3)),
    identityInflationRisk: noiseRatio > 0.55 && semanticMass < 1.5,
    meaningfulEvents: Object.freeze(meaningfulEvents.slice(-8)),
    telemetryEvents: Object.freeze(telemetryEvents.slice(-4))
  });
}

/**
 * Enrich event row before append with semantic weight.
 * @param {object} event
 */
export function enrichEventWithSemanticsV0(event = {}) {
  const classification = classifyEventSemanticsV0(event);
  return Object.freeze({
    ...event,
    semanticWeight: classification.semanticMass,
    telemetry: classification.telemetry,
    identityMeaningful: classification.retainInIdentity
  });
}
