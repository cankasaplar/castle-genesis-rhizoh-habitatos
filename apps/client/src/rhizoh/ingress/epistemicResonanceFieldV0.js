/**
 * Epistemic Resonance Field v0 — MEASUREMENT ONLY (no system modulation).
 * Computes observational geometry scores; explicitly does NOT feed learning/causal/narrative authority.
 * @see docs/RHIZOH_EPISTEMIC_RESONANCE_FIELD_V0.md
 */

import { getObserverTraceSnapshotV0, OBSERVER_TRACE_EXCLUDED_SINKS_V0 } from "./observerReadOnlyHookV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { evaluateEpistemicReturnFieldV0 } from "./epistemicReturnFieldV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "./narrativeProjectionEngineV0.js";
import { normalizePinTargetIdV0 } from "./epistemicPinSemanticRegistryV0.js";

export const EPISTEMIC_RESONANCE_FIELD_SCHEMA_V0 = "castle.rhizoh.epistemic_resonance_field.v0";

function estimateAttentionDurationMsV0(entries, entityId) {
  const normalized = normalizePinTargetIdV0(entityId);
  const relevant = (entries || []).filter((e) => {
    const t = String(e.target || "");
    return t === entityId || normalizePinTargetIdV0(t) === normalized;
  });
  if (relevant.length < 2) return relevant.length ? 800 : 0;
  const sorted = [...relevant].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return Math.max(0, (sorted[sorted.length - 1].ts || 0) - (sorted[0].ts || 0));
}

/**
 * @param {{ locale?: string, observerTrace?: object, visitor?: object }} [opts]
 */
export function measureEpistemicResonanceFieldV0(opts = {}) {
  const locale = opts.locale ?? "en";
  const observerTrace = opts.observerTrace ?? getObserverTraceSnapshotV0();
  const visitor = opts.visitor ?? getVisitorEpistemicTraceV0();
  const returnField = evaluateEpistemicReturnFieldV0(visitor);
  const narrative = resolveNarrativeFromObserverTraceV0({ locale, observerTrace });
  const entries = observerTrace?.entries || [];

  const measurements = (narrative.groundedNarratives || []).map((item) => {
    const attention_duration = estimateAttentionDurationMsV0(entries, item.entityId);
    const semantic_alignment = item.grounded
      ? Math.round(Math.min(0.95, item.salience * 0.55 + (visitor?.coherence_alignment ?? 0) * 0.45) * 100) / 100
      : Math.round(item.salience * 0.25 * 100) / 100;
    const revisit_probability_delta = Math.round(returnField.familiarity * 0.18 * 100) / 100;
    const resonance_coefficient = Math.round(
      Math.min(0.99, semantic_alignment * 0.5 + Math.min(1, attention_duration / 12000) * 0.3 + revisit_probability_delta) *
        100
    ) / 100;

    return Object.freeze({
      entity: item.entityId,
      observer: "anon",
      attention_duration,
      revisit_probability_delta,
      semantic_alignment,
      resonance_coefficient,
      measurementOnly: true,
      influencesCausalGraph: false,
      influencesNarrative: false,
      bidirectionalInfluence: false
    });
  });

  const peak =
    measurements.length > 0
      ? measurements.reduce((best, row) => (row.resonance_coefficient > best.resonance_coefficient ? row : best))
      : null;

  return Object.freeze({
    schema: EPISTEMIC_RESONANCE_FIELD_SCHEMA_V0,
    measurements: Object.freeze(measurements),
    peakResonance: peak?.resonance_coefficient ?? 0,
    primaryEntity: peak?.entity ?? null,
    measurementOnly: true,
    isCoupling: false,
    influencesCausalGraph: false,
    influencesIdentity: false,
    influencesNarrative: false,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true,
    readOnly: true
  });
}

export function mountEpistemicResonanceFieldConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.epistemicResonanceField = Object.freeze({
    measure: measureEpistemicResonanceFieldV0
  });
}
