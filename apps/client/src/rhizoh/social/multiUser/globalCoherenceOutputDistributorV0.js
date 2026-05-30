/**
 * SPECFLOW: RESEARCH-ONLY — **Global Coherence Output Distributor**: one envelope from bridge/kernel
 * into UI, LLM, network pulse (+ bounded diff), studio tick event, and optional **YouTube sensor hint**
 * (studio / Rhizoh Channel Director). Loop closure: publish → analytics →
 * `ingestYouTubeAnalyticsForCoherenceFeedbackV0` → `YOUTUBE_METRICS` → governance.
 *
 * Geri besleme: dağıtıcı çıktısı `advanceCoherenceFeedbackStateV0` ile birleştirilir (`coherenceFeedbackLoopV0.js`).
 * Input: `runGlobalSocialCoherenceKernelTickV0` result (or any object with `kernel` + `globalMerge`).
 */

import { buildSocialCoherenceNetworkDiffV0 } from "./socialCoherenceKernelV0.js";
import { buildYoutubeCoherencePipelineHintV0 } from "./youtubeCoherencePipelineHintV0.js";

export const GLOBAL_COHERENCE_OUTPUT_DISTRIBUTOR_SCHEMA_V0 = "castle.rhizoh.global_coherence_output_distributor.v0";

export const STUDIO_GLOBAL_COHERENCE_TICK_SCHEMA_V0 = "castle.rhizoh.studio.global_coherence_tick.v0";

export const YOUTUBE_GLOBAL_COHERENCE_HINT_SCHEMA_V0 = "castle.rhizoh.youtube.global_coherence_hint.v0";

/**
 * @param {Record<string, unknown>|null|undefined} bridgeOut
 * @param {Record<string, unknown>|null|undefined} prevSnapshotForNetwork — prior `networkPulse` (or full kernel snapshotForNetwork)
 * @param {{
 *   includeYoutubeHint?: boolean,
 *   attachBridge?: boolean
 * } | null} [opts]
 */
export function distributeGlobalCoherenceKernelOutputV0(bridgeOut, prevSnapshotForNetwork, opts) {
  const b = bridgeOut && typeof bridgeOut === "object" ? bridgeOut : null;
  const k = b?.kernel && typeof b.kernel === "object" ? b.kernel : null;
  const o = opts && typeof opts === "object" ? opts : {};
  const includeYoutube = !!o.includeYoutubeHint;
  const attachBridge = !!o.attachBridge;

  const uiSnapshot =
    k?.snapshotForUi && typeof k.snapshotForUi === "object" ? /** @type {Record<string, unknown>} */ (k.snapshotForUi) : null;
  const llmSnapshot =
    k?.snapshotForLlm && typeof k.snapshotForLlm === "object" ? /** @type {Record<string, unknown>} */ (k.snapshotForLlm) : null;
  const networkPulse =
    k?.snapshotForNetwork && typeof k.snapshotForNetwork === "object"
      ? /** @type {Record<string, unknown>} */ (k.snapshotForNetwork)
      : null;

  const networkDiff = buildSocialCoherenceNetworkDiffV0(prevSnapshotForNetwork, networkPulse);

  const globalMerge = b?.globalMerge && typeof b.globalMerge === "object" ? b.globalMerge : null;
  const drift = globalMerge?.driftGuard && typeof globalMerge.driftGuard === "object" ? globalMerge.driftGuard : null;
  const sources = Array.isArray(globalMerge?.sources) ? globalMerge.sources : [];

  const studioEvent = {
    schema: STUDIO_GLOBAL_COHERENCE_TICK_SCHEMA_V0,
    ts: Date.now(),
    frame: k != null && Number.isFinite(Number(k.frame)) ? Number(k.frame) : null,
    bridgeSchema: typeof b?.schema === "string" ? b.schema : null,
    reducerSchema: typeof globalMerge?.schema === "string" ? globalMerge.schema : null,
    driftGuard: drift,
    sources,
    role: uiSnapshot && typeof uiSnapshot.role === "string" ? uiSnapshot.role : null,
    peerCount: uiSnapshot != null && Number.isFinite(Number(uiSnapshot.peerCount)) ? Number(uiSnapshot.peerCount) : null,
    fullSnapshotRecommended: !!(drift && drift.fullSnapshotRecommended)
  };

  /** @type {Record<string, unknown> | undefined} */
  let youtubePipelineHint;
  if (includeYoutube) {
    const built = buildYoutubeCoherencePipelineHintV0({
      kernel: k,
      globalMerge,
      networkPulse,
      networkDiff,
      uiSnapshot
    });
    youtubePipelineHint = {
      schema: YOUTUBE_GLOBAL_COHERENCE_HINT_SCHEMA_V0,
      ...built
    };
  }

  /** @type {Record<string, unknown>} */
  const out = {
    schema: GLOBAL_COHERENCE_OUTPUT_DISTRIBUTOR_SCHEMA_V0,
    uiSnapshot,
    llmSnapshot,
    networkPulse,
    networkDiff,
    studioEvent,
    lineage: {
      bridgeSchema: typeof b?.schema === "string" ? b.schema : null,
      kernelSchema: typeof k?.schema === "string" ? k.schema : null,
      globalReducerSchema: typeof globalMerge?.schema === "string" ? globalMerge.schema : null
    }
  };
  if (youtubePipelineHint) out.youtubePipelineHint = youtubePipelineHint;
  if (attachBridge && b) out.bridge = b;
  return out;
}
