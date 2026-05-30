/**
 * Shadow intelligence loop — analysis mode only (export JSON, clustering, labeling).
 * No auto-threshold, no execution authority.
 */

import { getShadowForwardRingV0, extractShadowReplaySignalsV0 } from "./voiceShadowReplayHookV0.js";
import { computeInterpretationStabilityV0 } from "./voiceInterpretationStabilityV0.js";
import { VOICE_SHADOW_REPLAY_HOOK_SCHEMA } from "./voiceShadowReplayHookV0.js";

export const VOICE_SHADOW_ANALYSIS_EXPORT_SCHEMA =
  "castle.rhizoh.voice_shadow_analysis_export.v0";

/**
 * Multi-axis clusters for ops review.
 * @param {object[]} [ring]
 */
export function clusterShadowForwardRingV0(ring = getShadowForwardRingV0()) {
  /** @type {Map<string, { count: number, layers: Set<string>, previews: string[] }>} */
  const byCluster = new Map();

  for (const row of ring) {
    const reason = String(row?.route?.reason || "unknown");
    const band = String(row?.band || "unknown");
    const layer = String(row?.route?.rejectionLayer || "unknown");
    const key = `${reason}|${band}|${layer}`;
    const prev = byCluster.get(key) || { count: 0, layers: new Set(), previews: [] };
    prev.count += 1;
    prev.layers.add(layer);
    if (prev.previews.length < 5) prev.previews.push(String(row.preview || "").slice(0, 72));
    byCluster.set(key, prev);
  }

  return Object.freeze(
    [...byCluster.entries()]
      .map(([clusterKey, agg]) => {
        const [reason, band, rejectionLayer] = clusterKey.split("|");
        return Object.freeze({
          clusterKey,
          reason,
          band,
          rejectionLayer,
          count: agg.count,
          patternLabel: labelShadowClusterV0(reason, band, rejectionLayer, agg.count),
          samplePreviews: Object.freeze([...agg.previews])
        });
      })
      .sort((a, b) => b.count - a.count)
  );
}

/**
 * @param {string} reason
 * @param {string} band
 * @param {string} layer
 * @param {number} count
 */
function labelShadowClusterV0(reason, band, layer, count) {
  if (reason === "whisper_default_conf" && band === "unknown") {
    return count >= 3 ? "short_turkish_utterance_friction" : "whisper_default_probe";
  }
  if (reason === "low_confidence" && layer === "interaction") {
    return "confidence_router_interaction_block";
  }
  if (band === "ambient") return "ambient_contamination";
  if (reason === "whisper_artifact") return "whisper_training_artifact";
  return `shadow_cluster_${reason}`;
}

/**
 * Full analysis snapshot for export / ops.
 * @param {{ pretty?: boolean }} [opts]
 */
export function buildShadowVoiceAnalysisSnapshotV0(opts = {}) {
  const ring = getShadowForwardRingV0();
  const replay = extractShadowReplaySignalsV0(ring);
  const stability = computeInterpretationStabilityV0(ring);
  const clusters = clusterShadowForwardRingV0(ring);

  return Object.freeze({
    schema: VOICE_SHADOW_ANALYSIS_EXPORT_SCHEMA,
    replaySchema: VOICE_SHADOW_REPLAY_HOOK_SCHEMA,
    exportedAtMs: Date.now(),
    analysisMode: "observation_only",
    executionPolicy: Object.freeze({
      autoThreshold: false,
      shadowToExecutionBridge: false,
      learningDecision: "none"
    }),
    ringSize: ring.length,
    ring: Object.freeze(ring.map((r) => ({ ...r }))),
    replay,
    stability,
    clusters,
    summary: Object.freeze({
      dominantReason: replay.dominantReason,
      dominantCount: replay.dominantCount,
      suggestedAction: replay.suggestedAction,
      recurringPatternCount: stability.recurringPatterns.length,
      topCluster: clusters[0]?.clusterKey || null
    })
  });
}

/**
 * @param {{ pretty?: boolean }} [opts]
 * @returns {string}
 */
export function exportShadowVoiceAnalysisJsonV0(opts = {}) {
  const snap = buildShadowVoiceAnalysisSnapshotV0(opts);
  return opts.pretty === true ? JSON.stringify(snap, null, 2) : JSON.stringify(snap);
}

export function installShadowVoiceAnalysisExportV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.exportShadowVoiceAnalysisV0 = () => exportShadowVoiceAnalysisJsonV0({ pretty: true });
  window.__rhizoh.getShadowVoiceAnalysisSnapshotV0 = () => buildShadowVoiceAnalysisSnapshotV0();
}
