/**
 * Interpretation stability layer — recurring shadow patterns (analysis only).
 * Observes repetition; never changes thresholds or execution.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { getShadowForwardRingV0 } from "./voiceShadowReplayHookV0.js";

export const VOICE_INTERPRETATION_STABILITY_SCHEMA =
  "castle.rhizoh.voice_interpretation_stability.v0";

export const VOICE_LEARNING_DECISION_V0 = Object.freeze({
  NONE: "none",
  HUMAN_REVIEW_SUGGESTED: "human_review_suggested"
});

const PATTERN_RECURRENCE_MIN = 3;
const STABILITY_EMIT_GAP_MS = 45000;
let lastStabilityEmitAtMs = 0;

/**
 * @param {object} row
 */
function patternKeyFromShadowRowV0(row) {
  const reason = String(row?.route?.reason || row?.reason || "unknown");
  const band = String(row?.band || row?.route?.band || "unknown");
  const layer = String(row?.route?.rejectionLayer || row?.rejectionLayer || "unknown");
  return `${reason}::${band}::${layer}`;
}

/**
 * @param {object[]} [ring]
 */
export function computeInterpretationStabilityV0(ring = getShadowForwardRingV0()) {
  /** @type {Map<string, { count: number, firstAtMs: number, lastAtMs: number, previews: string[] }>} */
  const patterns = new Map();

  for (const row of ring) {
    const key = patternKeyFromShadowRowV0(row);
    const atMs = Number(row?.atMs) || Date.now();
    const prev = patterns.get(key) || { count: 0, firstAtMs: atMs, lastAtMs: atMs, previews: [] };
    prev.count += 1;
    prev.lastAtMs = atMs;
    if (prev.previews.length < 4) prev.previews.push(String(row.preview || "").slice(0, 56));
    patterns.set(key, prev);
  }

  const recurring = [...patterns.entries()]
    .filter(([, agg]) => agg.count >= PATTERN_RECURRENCE_MIN)
    .map(([key, agg]) => {
      const [reason, band, rejectionLayer] = key.split("::");
      const spanMs = Math.max(0, agg.lastAtMs - agg.firstAtMs);
      return Object.freeze({
        patternKey: key,
        reason,
        band,
        rejectionLayer,
        occurrences: agg.count,
        spanMs,
        stabilityTrend: agg.count >= 5 ? "stable" : "emerging",
        label: "recurring_shadow_pattern",
        samplePreviews: Object.freeze([...agg.previews]),
        learningDecision: VOICE_LEARNING_DECISION_V0.NONE,
        reviewHint:
          agg.count >= 5
            ? VOICE_LEARNING_DECISION_V0.HUMAN_REVIEW_SUGGESTED
            : VOICE_LEARNING_DECISION_V0.NONE
      });
    })
    .sort((a, b) => b.occurrences - a.occurrences);

  const overallTrend =
    ring.length < PATTERN_RECURRENCE_MIN
      ? "insufficient_data"
      : recurring.length > 0
        ? "patterns_detected"
        : "diverse_observations";

  return Object.freeze({
    schema: VOICE_INTERPRETATION_STABILITY_SCHEMA,
    ringSampleCount: ring.length,
    recurringPatterns: Object.freeze(recurring),
    overallTrend,
    learningDecision: VOICE_LEARNING_DECISION_V0.NONE,
    policyAuthority: "observation_only",
    atMs: Date.now()
  });
}

/**
 * @param {object} [lastEntry]
 */
export function maybeEmitInterpretationStabilityV0(lastEntry = null) {
  const stability = computeInterpretationStabilityV0();
  if (stability.recurringPatterns.length === 0) return null;

  const now = Date.now();
  if (now - lastStabilityEmitAtMs < STABILITY_EMIT_GAP_MS) return null;
  lastStabilityEmitAtMs = now;

  const top = stability.recurringPatterns[0];
  logVoiceInfoV0("INTERPRETATION_STABILITY", {
    overallTrend: stability.overallTrend,
    topPattern: top.patternKey,
    occurrences: top.occurrences,
    stabilityTrend: top.stabilityTrend,
    learningDecision: stability.learningDecision,
    lastPreview: lastEntry?.preview
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.interpretationStability = stability;
  }

  return stability;
}

export function resetInterpretationStabilityForTestV0() {
  lastStabilityEmitAtMs = 0;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.interpretationStability;
  }
}
