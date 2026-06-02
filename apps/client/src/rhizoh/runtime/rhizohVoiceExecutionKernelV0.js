/**
 * Voice execution kernel instrumentation — graph + latency on one trace.
 */

import {
  beginCommandExecutionTraceV0,
  finishCommandExecutionTraceV0,
  recordExecutionGraphNodeV0,
  sideEffectsForCanonicalV0
} from "./rhizohCommandExecutionGraphV0.js";
import { enforceLatencyBudgetV0, measureLatencyPhaseV0 } from "./rhizohCastleLatencyBudgetV0.js";
import { readLocalCommandRowV0 } from "./rhizohLocalCommandRegistryV0.js";

export { sideEffectsForCanonicalV0 };

/**
 * @param {string} traceId
 * @param {{ input?: string, source?: string }} meta
 */
export function openVoiceExecutionTraceV0(traceId, meta = {}) {
  beginCommandExecutionTraceV0(traceId, meta);
  recordExecutionGraphNodeV0(traceId, {
    id: "ingress",
    phase: "ingress",
    trigger: String(meta.input || ""),
    localAction: false,
    llmFallback: false,
    sideEffects: Object.freeze([])
  });
  return traceId;
}

/**
 * @param {string} traceId
 * @param {() => T} fn
 * @template T
 */
export function traceSttNormalizePhaseV0(traceId, fn) {
  const { result, elapsedMs, budget } = measureLatencyPhaseV0("stt", fn, { traceId });
  recordExecutionGraphNodeV0(traceId, {
    id: "stt_normalize",
    phase: "stt",
    trigger: result?.text || "",
    localAction: true,
    llmFallback: false,
    sideEffects: Object.freeze(["stt:prosody", "stt:merge_fragments"]),
    edgeFrom: "ingress",
    edgeLabel: "stt",
    meta: Object.freeze({ elapsedMs, budgetOk: budget.ok })
  });
  enforceLatencyBudgetV0("stt", elapsedMs, traceId);
  return result;
}

/**
 * @param {string} traceId
 * @param {() => T} fn
 * @template T
 */
export function traceRoutePhaseV0(traceId, fn) {
  const { result, elapsedMs, budget } = measureLatencyPhaseV0("routing", fn, { traceId });
  const route = result;
  recordExecutionGraphNodeV0(traceId, {
    id: "route",
    phase: "routing",
    trigger: route?.normalized || "",
    localAction: route?.execution === "local",
    llmFallback: route?.execution === "llm",
    sideEffects: Object.freeze([`execution:${route?.execution || "unknown"}`]),
    edgeFrom: "stt_normalize",
    edgeLabel: "route",
    meta: Object.freeze({ elapsedMs, budgetOk: budget.ok, canonical: route?.canonical })
  });
  return result;
}

/**
 * @param {string} traceId
 * @param {string} canonical
 * @param {number} elapsedMs
 */
export function traceLocalExecPhaseV0(traceId, canonical, elapsedMs) {
  const row = readLocalCommandRowV0(canonical);
  recordExecutionGraphNodeV0(traceId, {
    id: `local:${canonical}`,
    phase: "local_exec",
    trigger: canonical,
    localAction: true,
    llmFallback: false,
    sideEffects: sideEffectsForCanonicalV0(canonical),
    edgeFrom: "route",
    edgeLabel: "local_exec",
    meta: Object.freeze({ handler: row?.handler, elapsedMs })
  });
  enforceLatencyBudgetV0("local_exec", elapsedMs, traceId);
}

/**
 * @param {string} traceId
 * @param {{ execution?: string, ok?: boolean }} summary
 */
export function closeVoiceExecutionTraceV0(traceId, summary = {}) {
  recordExecutionGraphNodeV0(traceId, {
    id: "finish",
    phase: "finish",
    trigger: String(summary.execution || ""),
    localAction: summary.execution === "local",
    llmFallback: summary.execution === "llm",
    sideEffects: Object.freeze([]),
    edgeFrom: summary.execution === "local" ? `local:${summary.canonical || "unknown"}` : "route",
    edgeLabel: "finish"
  });
  return finishCommandExecutionTraceV0(traceId, summary);
}
