/**
 * Sprint 2 — WAL as candidate ingress only.
 *
 * **Invariant:** Only the sealer may advance canonical reality.
 * WAL may produce diffs and seal *candidates*; it must never write `realityEpoch` directly.
 *
 * Chain:
 *   world diff → candidate → classifier → constitution → lease → seal → reality_epoch++
 *
 * @see realitySealingCoreV0.js
 * @see worldAuthorityLiveStreamEngineV1.js
 */

import { computeExecutionCommandHashV0 } from "./executionCommandHashV0.js";
import {
  createDefaultRealitySealLayerStateV0,
  drainRealitySealQueueV0,
  enqueueRealitySealCandidateV0
} from "./realitySealingCoreV0.js";

export const WORLD_AUTHORITY_SEAL_INGRESS_SCHEMA_V0 =
  "castle.rhizoh.world_authority_seal_ingress.v0";

/** Touch-invariant — epoch authority is singular. */
export const CANONICAL_REALITY_AUTHORITY_INVARIANT_V0 =
  "Only the sealer may advance canonical reality.";

/** Layers that must never bump `realityEpoch` (candidate ingress only). */
export const EPOCH_WRITE_FORBIDDEN_LAYERS_V0 = Object.freeze([
  "coherence",
  "studio",
  "wal",
  "ros",
  "federation"
]);

/** WAL diff kinds — ingress vocabulary (not sealing verdicts). */
export const WAL_WORLD_DIFF_KIND_V0 = Object.freeze({
  SCENE_CHUNK: "scene_chunk",
  OBSTACLE_DELTA: "obstacle_delta",
  TOPOLOGY_PATCH: "topology_patch",
  FEDERATION_PATCH: "federation_patch",
  SNAPSHOT_MATERIALIZE: "snapshot_materialize"
});

export const KIND_TO_COMMIT_CLASS = Object.freeze({
  [WAL_WORLD_DIFF_KIND_V0.SCENE_CHUNK]: "high_rate_substrate",
  [WAL_WORLD_DIFF_KIND_V0.OBSTACLE_DELTA]: "sealing_world_geometry",
  [WAL_WORLD_DIFF_KIND_V0.TOPOLOGY_PATCH]: "sealing_topology_mandate",
  [WAL_WORLD_DIFF_KIND_V0.FEDERATION_PATCH]: "sealing_topology_mandate",
  [WAL_WORLD_DIFF_KIND_V0.SNAPSHOT_MATERIALIZE]: "sealing_world_geometry"
});

/**
 * @typedef {Object} WalWorldDiffV0
 * @property {string} diffId
 * @property {keyof typeof WAL_WORLD_DIFF_KIND_V0 | string} kind
 * @property {string} [roomScope]
 * @property {number} [streamSeq]
 * @property {unknown} [payload]
 * @property {string} [priorObstacleSetHash]
 * @property {string} [castleId]
 * @property {boolean} [signed]
 * @property {boolean} [duplicateOfPrior]
 * @property {boolean} [attemptDirectEpochBump]
 * @property {boolean} [constitutionOk]
 * @property {boolean} [leaseOk]
 */

/**
 * @param {WalWorldDiffV0 | null | undefined} diff
 * @returns {{ ok: true, diff: WalWorldDiffV0 } | { ok: false, code: string }}
 */
export function normalizeWalWorldDiffV0(diff) {
  if (!diff || typeof diff !== "object") {
    return { ok: false, code: "WAL_DIFF_MISSING" };
  }
  const kind = String(diff.kind || "").trim();
  if (!kind || !KIND_TO_COMMIT_CLASS[kind]) {
    return { ok: false, code: "WAL_DIFF_UNKNOWN_KIND" };
  }
  const diffId = String(diff.diffId || "").trim();
  if (!diffId) {
    return { ok: false, code: "WAL_DIFF_MISSING_ID" };
  }
  if (diff.attemptDirectEpochBump === true) {
    return { ok: false, code: "WAL_DIRECT_EPOCH_FORBIDDEN" };
  }
  return {
    ok: true,
    diff: {
      ...diff,
      diffId,
      kind,
      signed: diff.signed !== false
    }
  };
}

/**
 * Deterministic payload witness for idempotency / classifier duplicate detection.
 *
 * @param {WalWorldDiffV0} diff
 */
export function computeWalDiffPayloadHashV0(diff) {
  return computeExecutionCommandHashV0({
    lane: "wal",
    provenance: diff.castleId ?? "local",
    namespace: "world_authority",
    type: diff.kind,
    payload: {
      diffId: diff.diffId,
      roomScope: diff.roomScope ?? null,
      streamSeq: diff.streamSeq ?? null,
      priorObstacleSetHash: diff.priorObstacleSetHash ?? null,
      body: diff.payload ?? null
    }
  });
}

/**
 * @param {WalWorldDiffV0} diff
 * @param {number} nowMs
 * @returns {import("../../studio/types/rskOntology.js").RealitySealCandidateV0}
 */
export function mapWalDiffToSealCandidateV0(diff, nowMs = Date.now()) {
  const commitClassId = KIND_TO_COMMIT_CLASS[diff.kind] ?? "high_rate_substrate";
  const isSealing =
    commitClassId === "sealing_world_geometry" || commitClassId === "sealing_topology_mandate";
  return {
    candidateId: `wal:${diff.diffId}`,
    source: "wal",
    commitClassId,
    roomScope: diff.roomScope,
    payloadHash: computeWalDiffPayloadHashV0(diff),
    enqueuedAtMs: nowMs,
    constitutionOk: diff.constitutionOk,
    leaseOk: diff.leaseOk ?? (isSealing ? diff.signed !== false : true),
    duplicateOfPriorSeal: diff.duplicateOfPrior === true
  };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {WalWorldDiffV0} walDiff
 * @param {{ nowMs?: number, drain?: boolean, autoRejectUnsigned?: boolean }} [opts]
 * @returns {{
 *   ok: boolean,
 *   code?: string,
 *   seal: import("../../studio/types/rskOntology.js").RealitySealLayerState,
 *   candidateId?: string,
 *   enqueued?: boolean,
 *   drained?: { processed: number, sealed: number }
 * }}
 */
export function submitWorldAuthoritySealCandidateV0(seal, walDiff, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  let s = createDefaultRealitySealLayerStateV0(seal, { nowMs });

  const normalized = normalizeWalWorldDiffV0(walDiff);
  if (!normalized.ok) {
    return { ok: false, code: normalized.code, seal: s };
  }
  const diff = normalized.diff;

  if (opts.autoRejectUnsigned !== false && diff.signed === false) {
    return { ok: false, code: "WAL_DIFF_UNSIGNED", seal: s };
  }

  const candidate = mapWalDiffToSealCandidateV0(diff, nowMs);
  s = enqueueRealitySealCandidateV0(s, candidate);

  let drained;
  if (opts.drain === true) {
    const r = drainRealitySealQueueV0(s, nowMs);
    s = r.seal;
    drained = { processed: r.processed, sealed: r.sealed };
  }

  return {
    ok: true,
    seal: s,
    candidateId: candidate.candidateId,
    enqueued: true,
    drained
  };
}

/**
 * Dev / CI guard — reject patches that try to set realityEpoch outside the sealer.
 *
 * @param {Record<string, unknown>} patch
 * @returns {{ ok: true } | { ok: false, code: string, layer?: string }}
 */
export function assertNoDirectEpochWriteInPatchV0(patch) {
  if (!patch || typeof patch !== "object") return { ok: true };
  if ("realityEpoch" in patch || "reality_epoch" in patch) {
    return { ok: false, code: "DIRECT_EPOCH_WRITE_FORBIDDEN", layer: "patch_root" };
  }
  const rs = /** @type {Record<string, unknown>} */ (patch).realitySeal;
  if (rs && typeof rs === "object" && ("realityEpoch" in rs || "reality_epoch" in rs)) {
    return { ok: false, code: "DIRECT_EPOCH_WRITE_FORBIDDEN", layer: "realitySeal" };
  }
  return { ok: true };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {Record<string, unknown>}
 */
export function buildWorldAuthoritySealIngressSnapshotV0(seal) {
  const s = createDefaultRealitySealLayerStateV0(seal);
  return {
    schema: WORLD_AUTHORITY_SEAL_INGRESS_SCHEMA_V0,
    invariant: CANONICAL_REALITY_AUTHORITY_INVARIANT_V0,
    epochWriteForbiddenLayers: EPOCH_WRITE_FORBIDDEN_LAYERS_V0,
    ts: Date.now(),
    queueDepth: s.sealQueue.length,
    realityEpoch: s.realityEpoch,
    note: "WAL ingress enqueues candidates only; epoch advances exclusively via realitySealingCoreV0 drain."
  };
}
