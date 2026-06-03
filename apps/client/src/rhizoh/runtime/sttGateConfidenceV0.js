/**
 * Single STT gate confidence surface — avoids route vs turn temporal drift.
 */

export const STT_GATE_CONFIDENCE_SCHEMA_V0 = "castle.rhizoh.stt_gate_confidence.v0";

/**
 * @param {{
 *   temporal?: { effectiveConfidence?: number, rawConfidence?: number } | null,
 *   confidence?: number
 * }} input
 */
export function resolveSttGateConfidenceV0(input = {}) {
  const temporal =
    input.temporal && typeof input.temporal === "object" ? input.temporal : null;
  const raw = Number(input.confidence);
  const fromTemporal = Number(temporal?.effectiveConfidence);
  const gateConfidence = Number.isFinite(fromTemporal)
    ? fromTemporal
    : Number.isFinite(raw)
      ? raw
      : undefined;
  const rawConfidence = Number.isFinite(Number(temporal?.rawConfidence))
    ? Number(temporal.rawConfidence)
    : Number.isFinite(raw)
      ? raw
      : undefined;
  const drift01 =
    Number.isFinite(gateConfidence) && Number.isFinite(rawConfidence)
      ? Math.abs(gateConfidence - rawConfidence)
      : null;

  return Object.freeze({
    schema: STT_GATE_CONFIDENCE_SCHEMA_V0,
    gateConfidence,
    rawConfidence: rawConfidence ?? null,
    drift01,
    temporalApplied: Number.isFinite(fromTemporal)
  });
}
