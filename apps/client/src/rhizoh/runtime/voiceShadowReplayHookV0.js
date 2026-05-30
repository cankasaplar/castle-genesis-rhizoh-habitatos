/**
 * Shadow replay hook — observation ring → tuning signals (no execution authority).
 * Periodic clustering over voiceShadowForwardRing for threshold / heuristic feedback.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const VOICE_SHADOW_REPLAY_HOOK_SCHEMA = "castle.rhizoh.voice_shadow_replay_hook.v0";

const REPLAY_MIN_SAMPLES = 4;
const REPLAY_EMIT_GAP_MS = 60000;
let lastReplayEmitAtMs = 0;

/**
 * @returns {object[]}
 */
export function getShadowForwardRingV0() {
  if (typeof window === "undefined") return [];
  const ring = window.__rhizoh?.voiceShadowForwardRing;
  return Array.isArray(ring) ? ring : [];
}

/**
 * @param {object[]} ring
 */
export function extractShadowReplaySignalsV0(ring = []) {
  /** @type {Map<string, { count: number, bands: Set<string>, previews: string[] }>} */
  const byReason = new Map();

  for (const row of ring) {
    const reason = String(row?.route?.reason || row?.reason || "unknown");
    const band = String(row?.band || row?.route?.band || "unknown");
    const prev = byReason.get(reason) || { count: 0, bands: new Set(), previews: [] };
    prev.count += 1;
    prev.bands.add(band);
    if (prev.previews.length < 3) prev.previews.push(String(row.preview || "").slice(0, 64));
    byReason.set(reason, prev);
  }

  const clusters = [...byReason.entries()].map(([reason, agg]) =>
    Object.freeze({
      reason,
      count: agg.count,
      bands: Object.freeze([...agg.bands]),
      samplePreviews: Object.freeze([...agg.previews]),
      tuningHint: deriveShadowTuningHintV0(reason, agg.count, agg.bands)
    })
  );

  const dominant = clusters.sort((a, b) => b.count - a.count)[0] || null;

  return Object.freeze({
    schema: VOICE_SHADOW_REPLAY_HOOK_SCHEMA,
    sampleCount: ring.length,
    clusters: Object.freeze(clusters),
    dominantReason: dominant?.reason || null,
    dominantCount: dominant?.count || 0,
    suggestedAction: dominant?.tuningHint || "observe",
    atMs: Date.now()
  });
}

/**
 * @param {string} reason
 * @param {number} count
 * @param {Set<string>} bands
 */
function deriveShadowTuningHintV0(reason, count, bands) {
  if (count < REPLAY_MIN_SAMPLES) return "observe_accumulate";
  if (reason === "whisper_default_conf" && bands.has("unknown")) {
    return "review_short_utterance_heuristic_or_directed_patterns";
  }
  if (reason === "low_confidence") {
    return "review_confidence_router_not_global_threshold_alone";
  }
  if (reason === "whisper_artifact") {
    return "ambient_filter_ok_keep_execution_blocked";
  }
  return "observe";
}

/**
 * Call after each shadow-forward append; emits at most once per REPLAY_EMIT_GAP_MS.
 * @param {object} [lastEntry]
 */
export function maybeEmitShadowReplaySignalsV0(lastEntry = null) {
  const ring = getShadowForwardRingV0();
  if (ring.length < REPLAY_MIN_SAMPLES) return null;

  const now = Date.now();
  if (now - lastReplayEmitAtMs < REPLAY_EMIT_GAP_MS) return null;
  lastReplayEmitAtMs = now;

  const signals = extractShadowReplaySignalsV0(ring);
  logVoiceInfoV0("SHADOW_REPLAY_SIGNALS", {
    ...signals,
    lastPreview: lastEntry?.preview
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.shadowReplaySignals = signals;
    const history = Array.isArray(window.__rhizoh.shadowReplayHistory)
      ? window.__rhizoh.shadowReplayHistory
      : [];
    history.push(signals);
    window.__rhizoh.shadowReplayHistory = history.slice(-12);
  }

  return signals;
}

export function resetShadowReplayHookForTestV0() {
  lastReplayEmitAtMs = 0;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.shadowReplaySignals;
    delete window.__rhizoh.shadowReplayHistory;
  }
}
