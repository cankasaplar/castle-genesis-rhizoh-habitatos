/**
 * Spatial + Tensor Replay Engine v0 — dry-run re-simulation without side effects.
 */

import { replayTensorIntentV0 } from "./rhizohTensorReplayV0.js";
import { buildCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import { listSpatialNodesV0, SPATIAL_NODE_TIER_V0 } from "./rhizohSpatialNodeLayerV0.js";
import { getSpatialTemporalTrailSnapshotV0 } from "./rhizohSpatialTemporalTrailV0.js";
import { getTruthTraceLogV0, TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";

export const RHIZOH_SPATIAL_REPLAY_ENGINE_SCHEMA_V0 = "rhizoh.spatial_replay_engine.v0";

/**
 * Replay temporal spatial trail — read-only path reconstruction.
 * @param {{ domain?: string, limit?: number }} [opts]
 */
export function replaySpatialTrailV0(opts = {}) {
  const domain = opts.domain ? String(opts.domain) : null;
  const limit = Math.min(32, Math.max(1, Number(opts.limit) || 16));
  const temporal = listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL);
  const trail = getSpatialTemporalTrailSnapshotV0();

  const filtered = temporal
    .filter((n) => !domain || String(n.payload?.sourceDomain || "") === domain)
    .slice(-limit);

  const steps = filtered.map((node, i) =>
    Object.freeze({
      step: i + 1,
      nodeId: node.id,
      tier: node.tier,
      kind: node.payload?.kind || "trail_marker",
      atMs: node.atMs,
      payload: node.payload,
      replay: true,
      sideEffects: false
    })
  );

  return Object.freeze({
    ok: true,
    replay: true,
    dryRun: true,
    domain,
    stepCount: steps.length,
    steps: Object.freeze(steps),
    trailRecent: trail.recent
  });
}

/**
 * Replay last recorded tensor intent from truth trace.
 * @param {{ domain?: string }} [opts]
 */
export function replayLastTensorIntentV0(opts = {}) {
  const domain = opts.domain ? String(opts.domain) : null;
  const decisions = getTruthTraceLogV0()
    .filter((t) => t.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION)
    .filter((t) => !domain || t.domain === domain);
  const last = decisions.at(-1);
  if (!last?.intent) {
    return Object.freeze({ ok: false, reason: "no_tensor_decision_to_replay" });
  }
  return replayTensorIntentV0(last.domain, last.intent, { source: "spatial_replay_engine" });
}

/**
 * Full causal replay — tensor dry-run + spatial trail + causal map snapshot.
 * @param {string} domain
 * @param {string} [intent]
 */
export function replayCausalChainV0(domain, intent) {
  const d = String(domain || "").trim();
  const tensor = intent
    ? replayTensorIntentV0(d, intent, { source: "causal_replay" })
    : replayLastTensorIntentV0({ domain: d });
  const spatial = replaySpatialTrailV0({ domain: d });
  const causal = buildCausalMapLayerV0();

  return Object.freeze({
    schema: RHIZOH_SPATIAL_REPLAY_ENGINE_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    domain: d,
    intent: intent || tensor.intent || null,
    tensor,
    spatial,
    causalSummary: Object.freeze({
      nodeCount: causal.nodeCount,
      edgeCount: causal.edgeCount,
      selfNarrative: causal.selfNarrative
    }),
    selfExplanation: [
      `Replayed tensor (${tensor.ok ? "ok" : "fail"}) + ${spatial.stepCount} spatial trail steps.`,
      causal.selfNarrative
    ].join(" ")
  });
}

export function publishSpatialReplayEngineV0() {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.replayCausalChainV0 = replayCausalChainV0;
    window.__rhizoh.replaySpatialTrailV0 = replaySpatialTrailV0;
    window.__RHIZOH_REPLAY_CAUSAL__ = replayCausalChainV0;
  }
}
