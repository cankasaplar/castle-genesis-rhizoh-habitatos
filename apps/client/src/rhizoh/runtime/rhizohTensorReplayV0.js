/**
 * Tensor intent replay — re-simulate decision chain without side effects (dry run).
 */

import { mapIntentToActionV0 } from "./rhizohTensorBridgeV0.js";
import {
  traceTruthEventV0,
  TRUTH_TRACE_KIND_V0,
  isTruthTraceEnabledV0
} from "./rhizohTruthTraceLayerV0.js";

/**
 * Replay same intent through tensor bridge (no adapter side effects).
 * @param {string} domain
 * @param {string} intent
 * @param {object} [request]
 */
export function replayTensorIntentV0(domain, intent, request = {}) {
  const startedAt = Date.now();
  const result = mapIntentToActionV0(domain, {
    ...request,
    intent,
    dryRun: true
  });

  if (isTruthTraceEnabledV0()) {
    traceTruthEventV0(TRUTH_TRACE_KIND_V0.TENSOR_REPLAY, {
      domain: String(domain || ""),
      intent: String(intent || ""),
      resultOk: result?.ok !== false,
      action: result?.action ?? null,
      latencyMs: Date.now() - startedAt,
      dryRun: true
    });
  }

  return Object.freeze({
    ok: result?.ok !== false,
    domain,
    intent,
    replay: true,
    dryRun: true,
    result,
    latencyMs: Date.now() - startedAt
  });
}
