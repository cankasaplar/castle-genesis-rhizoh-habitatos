/**
 * Narrative bridge validation v0 — four epistemic axioms.
 * @see docs/RHIZOH_MEANING_RESONANCE_LEDGER_V0.md
 */

export const NARRATIVE_BRIDGE_AXIOMS_V0 = Object.freeze({
  CAUSAL_INVARIANCE: "causal_invariance",
  NON_AGENTIC_CLOSURE: "non_agentic_closure",
  BIDIRECTIONAL_NON_ENTANGLEMENT: "bidirectional_non_entanglement",
  TEMPORAL_CONTINUITY: "temporal_continuity_dominance"
});

export const BRIDGE_VALIDATION_THRESHOLDS_V0 = Object.freeze({
  MIN_PATTERN_STABILITY: 0.35,
  MIN_TEMPORAL_CONTINUITY: 0.28,
  MAX_WEAK_RELATION_STRENGTH: 0.35
});

const INTENT_INFERENCE_RE_V0 =
  /\b(intent|intention|wanted|wants|aimed|goal|decided|chose|purpose|motivat|istedi|amaç|karar|niyet)\b/i;

/**
 * @param {readonly object[]} entries
 * @param {string} key
 */
export function computePatternStabilityV0(entries, key) {
  if (!entries?.length || !key) return 0;
  const hits = entries.filter((e) => {
    const k = `${e.type}:${e.target}`;
    return k === key || String(e.target || "") === key;
  });
  if (hits.length < 2) return 0;
  const uniqueTs = new Set(hits.map((e) => Math.floor((e.ts || 0) / 60000)));
  const repeatFactor = Math.min(1, hits.length / 4);
  const spreadFactor = Math.min(1, uniqueTs.size / 3);
  return Math.round(Math.min(1, repeatFactor * 0.65 + spreadFactor * 0.35) * 100) / 100;
}

/**
 * @param {readonly object[]} entries
 * @param {string} key
 */
export function computeTemporalContinuityV0(entries, key) {
  if (!entries?.length || !key) return 0;
  const hits = entries
    .filter((e) => `${e.type}:${e.target}` === key || String(e.target || "") === key)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (hits.length < 2) return 0;
  const span = (hits[hits.length - 1].ts || 0) - (hits[0].ts || 0);
  const gapPenalty = hits.slice(1).reduce((acc, row, i) => {
    const gap = (row.ts || 0) - (hits[i].ts || 0);
    return acc + (gap > 120000 ? 0.15 : 0);
  }, 0);
  const spanScore = Math.min(1, span / 180000);
  const density = Math.min(1, hits.length / 5);
  return Math.round(Math.max(0, Math.min(1, spanScore * 0.5 + density * 0.5 - gapPenalty)) * 100) / 100;
}

/**
 * @param {object} narrativeEdge
 */
export function containsIntentInferenceV0(narrativeEdge) {
  const text = [
    narrativeEdge?.description,
    narrativeEdge?.title,
    narrativeEdge?.relation,
    narrativeEdge?.label
  ]
    .filter(Boolean)
    .join(" ");
  return INTENT_INFERENCE_RE_V0.test(text);
}

/**
 * @param {object} narrativeEdge
 */
export function writesToSourceGraphsV0(narrativeEdge) {
  return (
    narrativeEdge?.influencesCausalGraph === true ||
    narrativeEdge?.influencesMap === true ||
    narrativeEdge?.influencesChess === true ||
    narrativeEdge?.writesToCausalMap === true
  );
}

/**
 * @param {{ mapEvent?: object, chessEvent?: object, narrativeEdge: object, observerEntries?: object[] }} input
 */
export function bridgeValidateV0(input) {
  const entries = input.observerEntries || [];
  const mapKey = input.mapEvent ? `${input.mapEvent.type}:${input.mapEvent.target}` : null;
  const chessKey = input.chessEvent ? `${input.chessEvent.type}:${input.chessEvent.target}` : null;
  const primaryKey = mapKey || chessKey || `${input.narrativeEdge?.from}:${input.narrativeEdge?.to}`;

  const mapStability = mapKey ? computePatternStabilityV0(entries, mapKey) : 0;
  const chessStability = chessKey ? computePatternStabilityV0(entries, chessKey) : 0;
  const invariance = Math.max(mapStability, chessStability);

  const mapContinuity = mapKey ? computeTemporalContinuityV0(entries, mapKey) : 0;
  const chessContinuity = chessKey ? computeTemporalContinuityV0(entries, chessKey) : 0;
  const continuity = Math.max(mapContinuity, chessContinuity);

  const nonAgentic = !containsIntentInferenceV0(input.narrativeEdge);
  const noFeedbackLoop = !writesToSourceGraphsV0(input.narrativeEdge);

  const strength = Math.min(
    BRIDGE_VALIDATION_THRESHOLDS_V0.MAX_WEAK_RELATION_STRENGTH,
    Number(input.narrativeEdge?.strength ?? 0.15) || 0.15
  );

  const passed =
    invariance >= BRIDGE_VALIDATION_THRESHOLDS_V0.MIN_PATTERN_STABILITY &&
    continuity >= BRIDGE_VALIDATION_THRESHOLDS_V0.MIN_TEMPORAL_CONTINUITY &&
    nonAgentic === true &&
    noFeedbackLoop === true;

  return Object.freeze({
    schema: "castle.rhizoh.narrative_bridge_validation.v0",
    passed,
    axioms: Object.freeze({
      [NARRATIVE_BRIDGE_AXIOMS_V0.CAUSAL_INVARIANCE]: invariance >= BRIDGE_VALIDATION_THRESHOLDS_V0.MIN_PATTERN_STABILITY,
      [NARRATIVE_BRIDGE_AXIOMS_V0.NON_AGENTIC_CLOSURE]: nonAgentic,
      [NARRATIVE_BRIDGE_AXIOMS_V0.BIDIRECTIONAL_NON_ENTANGLEMENT]: noFeedbackLoop,
      [NARRATIVE_BRIDGE_AXIOMS_V0.TEMPORAL_CONTINUITY]:
        continuity >= BRIDGE_VALIDATION_THRESHOLDS_V0.MIN_TEMPORAL_CONTINUITY
    }),
    metrics: Object.freeze({
      invariance,
      continuity,
      cappedStrength: strength,
      primaryKey
    }),
    interpretationOnly: true
  });
}
