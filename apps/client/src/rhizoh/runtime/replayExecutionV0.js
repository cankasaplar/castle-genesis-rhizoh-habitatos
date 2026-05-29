/**
 * PR-3.2 — Replay: prove behavior over history (no playback semantics).
 * SPECFLOW: **RESEARCH-ONLY**
 */

import { createAmbientBoxStateV0 } from "./ambientBoxStateV0.js";
import { projectSubstrateFromNestedExecutionResultV0 } from "./canonicalMirrorPipelineV0.js";

/**
 * @param {Array<{ frameId?: string | number, lane?: string, executionResult?: unknown, at?: number, timestamp?: number }>} history
 * @returns {{ frameId: string | number | undefined, lane: string | undefined, output: ReturnType<typeof createAmbientBoxStateV0> }[]}
 */
export function replayExecutionV0(history) {
  if (!Array.isArray(history)) return [];
  return history.map((frame) => {
    const at =
      typeof frame?.at === "number" && Number.isFinite(frame.at)
        ? frame.at
        : typeof frame?.timestamp === "number" && Number.isFinite(frame.timestamp)
          ? frame.timestamp
          : undefined;
    return {
      frameId: frame?.frameId,
      lane: frame?.lane,
      output: createAmbientBoxStateV0(frame?.executionResult, at)
    };
  });
}

/**
 * Same as `replayExecutionV0` but each frame runs the **canonical mirror contract**
 * (validate nested → box → validate box). Use for proof manifests / drift audits.
 *
 * @param {Array<{ frameId?: string | number, lane?: string, executionResult?: unknown, at?: number, timestamp?: number }>} history
 */
export function replayExecutionCanonicalV0(history) {
  if (!Array.isArray(history)) return [];
  return history.map((frame) => {
    const at =
      typeof frame?.at === "number" && Number.isFinite(frame.at)
        ? frame.at
        : typeof frame?.timestamp === "number" && Number.isFinite(frame.timestamp)
          ? frame.timestamp
          : undefined;
    const proj = projectSubstrateFromNestedExecutionResultV0(frame?.executionResult, at);
    return {
      frameId: frame?.frameId,
      lane: frame?.lane,
      ...proj
    };
  });
}
