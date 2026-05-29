/**
 * Identity merge policy — frame (primary) · session (anchor) · connection (volatile) · mergeId (deterministic).
 * Execution SSOT değildir; korelasyon + snapshot + offline kuyruk metadata için.
 *
 * @see docs/RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md
 */

import { getLastRuntimeMergeId } from "../boot/castleRuntimeMergeLayerV0.js";
import { loadRhizohProductSession } from "../product/rhizohProductSessionPersistenceV1.js";
import { getRuntimeFrameId } from "./runtimeFrameCorrelationV0.js";
import { readRhizohContinuityMetaDiskV0 } from "./rhizohContinuityDiskMetaV0.js";

export const RUNTIME_IDENTITY_MERGE_POLICY_VERSION = 0;

/**
 * @param {string} frameId
 * @param {string} sessionId
 * @param {string} connectionId
 * @returns {string}
 */
export function deriveDeterministicMergeId(frameId, sessionId, connectionId) {
  const f = String(frameId || "");
  const s = String(sessionId || "");
  const c = String(connectionId || "");
  const payload = `v0|${f}|${s}|${c}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `mid_${(h >>> 0).toString(16)}`;
}

/**
 * @param {{ connectionId?: string }} [io]
 * @returns {Record<string, unknown>}
 */
export function resolveActiveRuntimeIdentity(io = {}) {
  const meta = readRhizohContinuityMetaDiskV0();
  const product = loadRhizohProductSession(meta);
  const frameId = getRuntimeFrameId() || "";
  const sessionId = String(product?.sessionId || "");
  const connectionId = String(io.connectionId != null ? io.connectionId : "");
  const derived = deriveDeterministicMergeId(frameId, sessionId, connectionId);
  let lastCommitMergeId = null;
  try {
    lastCommitMergeId = getLastRuntimeMergeId();
  } catch {
    lastCommitMergeId = null;
  }
  return {
    policyVersion: RUNTIME_IDENTITY_MERGE_POLICY_VERSION,
    frameId: { role: "primary", value: frameId },
    sessionId: { role: "anchor", value: sessionId },
    connectionId: { role: "volatile", value: connectionId, attached: Boolean(connectionId) },
    mergeId: { value: derived, source: "deterministic_fnv1a_v0" },
    lastCommitMergeId,
    semantics:
      "primary=tab UI frame; anchor=product session replay; volatile=LLM credential attachment; mergeId=hash(frame,session,connection) for stable correlation; lastCommitMergeId=last withRuntimeMergeCommit scope"
  };
}
