/**
 * Sprint B — WAL as streamed geometry authority (not raw events).
 *
 * **Contract:** obstacle stream, scene diff, topology patch →
 * `submitWorldAuthoritySealCandidateOnKernelV0` only.
 *
 * - Streams **never** write `realityEpoch` directly.
 * - Streams **only** enqueue candidates + influence sealer schedule (poke / queue depth).
 * - Epoch advances **only** if schedule allows sealer drain (ontology rhythm).
 *
 * @see worldAuthorityLiveStreamEngineV1.js
 * @see realitySealerLiveWiringV0.js
 */

import { WAL_WORLD_DIFF_KIND_V0, computeWalDiffPayloadHashV0 } from "./submitWorldAuthoritySealCandidateV0.js";
import { submitWorldAuthoritySealCandidateOnKernelV0 } from "./realitySealerLiveWiringV0.js";
import {
  executeRosPolicyOnWalDiffV0,
  grantRosAuthorityLeaseV0,
  hasActiveRosLeaseV0
} from "./realityOperatingSystemExecutionRuntimeV0.js";
import {
  computeNavInvalidationMaskV0,
  mergeObstacleDiscsV0,
  parseObstacleDiscsFromDeltaV0
} from "./obstacleNavInvalidationV0.js";
import { stagePendingObstacleAuthorityV0, maybeApplyPostSealBridgeOnKernelV0 } from "./postSealSimulationBridgeV0.js";
import { defaultWorldAuthorityRuntimeV0 } from "./worldAuthorityRuntimeDefaultsV0.js";
import {
  enqueueWorldRuntimeStreamFrameV0,
  isWorldRuntimeDaemonEnabledV0,
  appendLocalWalHistoryEntryV0
} from "./worldRuntimeDaemonQueueV0.js";

export const WORLD_AUTHORITY_STREAM_INGRESS_SCHEMA_V0 =
  "castle.rhizoh.world_authority_stream_ingress.v0";

/** Sprint B entry condition — geometry streams are authority proposals, not epoch writers. */
export const WAL_STREAM_GEOMETRY_AUTHORITY_CONTRACT_V0 =
  "WAL streams propose geometry authority via seal candidates; they influence schedule only until the sealer drains.";

export const WAL_STREAM_FRAME_KIND_V0 = Object.freeze({
  OBSTACLE_STREAM: "obstacle_stream",
  SCENE_DIFF: "scene_diff",
  TOPOLOGY_PATCH: "topology_patch"
});

/**
 * @typedef {Object} WalObstacleStreamFrameV0
 * @property {string} frameId
 * @property {string} [roomScope]
 * @property {number} [streamSeq]
 * @property {string} [priorObstacleSetHash]
 * @property {unknown} [delta]
 * @property {boolean} [signed]
 */

/**
 * @typedef {Object} WalSceneDiffFrameV0
 * @property {string} frameId
 * @property {string} [roomScope]
 * @property {number} [streamSeq]
 * @property {unknown} [chunk]
 * @property {boolean} [signed]
 */

/**
 * @typedef {Object} WalTopologyPatchFrameV0
 * @property {string} frameId
 * @property {string} roomScope
 * @property {unknown} [patch]
 * @property {boolean} [signed]
 */

/**
 * @param {WalObstacleStreamFrameV0} frame
 */
export function obstacleStreamFrameToWalDiffV0(frame) {
  const frameId = String(frame?.frameId || "").trim();
  return {
    diffId: frameId ? `obstacle:${frameId}` : "",
    kind: WAL_WORLD_DIFF_KIND_V0.OBSTACLE_DELTA,
    roomScope: frame?.roomScope,
    streamSeq: frame?.streamSeq,
    priorObstacleSetHash: frame?.priorObstacleSetHash,
    payload: frame?.delta ?? null,
    signed: frame?.signed !== false
  };
}

/**
 * @param {WalSceneDiffFrameV0} frame
 */
export function sceneDiffFrameToWalDiffV0(frame) {
  const frameId = String(frame?.frameId || "").trim();
  return {
    diffId: frameId ? `scene:${frameId}` : "",
    kind: WAL_WORLD_DIFF_KIND_V0.SCENE_CHUNK,
    roomScope: frame?.roomScope,
    streamSeq: frame?.streamSeq,
    payload: frame?.chunk ?? null,
    signed: frame?.signed !== false
  };
}

/**
 * @param {WalTopologyPatchFrameV0} frame
 */
export function topologyPatchFrameToWalDiffV0(frame) {
  const frameId = String(frame?.frameId || "").trim();
  return {
    diffId: frameId ? `topology:${frameId}` : "",
    kind: WAL_WORLD_DIFF_KIND_V0.TOPOLOGY_PATCH,
    roomScope: frame?.roomScope,
    payload: frame?.patch ?? null,
    signed: frame?.signed !== false
  };
}

/**
 * @param {{ streamKind: string, frame: unknown }} input
 * @returns {{ ok: true, walDiff: import("./submitWorldAuthoritySealCandidateV0.js").WalWorldDiffV0 } | { ok: false, code: string }}
 */
export function mapStreamFrameToWalDiffV0(input) {
  const kind = String(input?.streamKind || "");
  const frame = input?.frame;
  if (kind === WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM) {
    const walDiff = obstacleStreamFrameToWalDiffV0(/** @type {WalObstacleStreamFrameV0} */ (frame));
    if (!walDiff.diffId) return { ok: false, code: "OBSTACLE_FRAME_ID_REQUIRED" };
    return { ok: true, walDiff };
  }
  if (kind === WAL_STREAM_FRAME_KIND_V0.SCENE_DIFF) {
    const walDiff = sceneDiffFrameToWalDiffV0(/** @type {WalSceneDiffFrameV0} */ (frame));
    if (!walDiff.diffId) return { ok: false, code: "SCENE_FRAME_ID_REQUIRED" };
    return { ok: true, walDiff };
  }
  if (kind === WAL_STREAM_FRAME_KIND_V0.TOPOLOGY_PATCH) {
    const walDiff = topologyPatchFrameToWalDiffV0(/** @type {WalTopologyPatchFrameV0} */ (frame));
    if (!walDiff.diffId) return { ok: false, code: "TOPOLOGY_FRAME_ID_REQUIRED" };
    if (!String(walDiff.roomScope || "").trim()) {
      return { ok: false, code: "TOPOLOGY_ROOM_SCOPE_REQUIRED" };
    }
    return { ok: true, walDiff };
  }
  return { ok: false, code: "UNKNOWN_STREAM_KIND" };
}

/**
 * @param {import("./submitWorldAuthoritySealCandidateV0.js").WalWorldDiffV0} walDiff
 * @param {ReturnType<typeof submitWorldAuthoritySealCandidateOnKernelV0>} submitResult
 * @param {number} epochBefore
 * @param {import("../../studio/types/rskOntology.js").StudioKernelState} kernelAfter
 */
function buildStreamIngressResultV0(walDiff, submitResult, epochBefore, kernelAfter) {
  const epochAfter = kernelAfter.realitySeal.realityEpoch;
  const sealed = submitResult.poke?.sealed > 0;
  return {
    ...submitResult,
    streamKind: walDiff.kind,
    payloadHash: computeWalDiffPayloadHashV0(walDiff),
    geometryAuthority: {
      contract: WAL_STREAM_GEOMETRY_AUTHORITY_CONTRACT_V0,
      walWroteEpochDirectly: false,
      epochBefore,
      epochAfter,
      epochDeltaFromWal: 0,
      epochAdvancedBySealerDrain: sealed && epochAfter > epochBefore
    },
    scheduleInfluence: {
      queueDepth: kernelAfter.realitySeal.sealQueue.length,
      walIngressSealing: submitResult.poke?.scheduleReason === "wal_sealing_ingress" || undefined,
      pokeReason: submitResult.poke?.scheduleReason,
      drained: submitResult.poke?.drained === true,
      inflationStatus: submitResult.poke?.inflationStatus
    }
  };
}

/**
 * Single Sprint B ingress — all geometry streams must use this.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{ streamKind: string, frame: unknown }} streamInput
 * @param {{ nowMs?: number, persist?: boolean }} [opts]
 */
export function ingestWorldAuthorityStreamFrameOnKernelV0(getState, setState, streamInput, opts = {}) {
  if (isWorldRuntimeDaemonEnabledV0() && opts.daemonBypass !== true) {
    const enq = enqueueWorldRuntimeStreamFrameV0({
      streamKind: streamInput.streamKind,
      frame: streamInput.frame,
      enqueuedAtMs: opts.nowMs
    });
    return {
      ok: enq.accepted !== false,
      code: enq.code,
      deferred: true,
      daemonQueue: enq,
      geometryAuthority: { walWroteEpochDirectly: false, deferredToDaemon: true }
    };
  }

  const mapped = mapStreamFrameToWalDiffV0(streamInput);
  if (!mapped.ok) {
    return { ok: false, code: mapped.code, geometryAuthority: { walWroteEpochDirectly: false } };
  }
  appendLocalWalHistoryEntryV0(mapped.walDiff, { lamport: opts.lamport });
  const nowMs = Number(opts.nowMs) || Date.now();
  let walDiff = mapped.walDiff;
  const roomScope = String(walDiff.roomScope || "global");

  if (opts.ensureRosLease !== false && !hasActiveRosLeaseV0(roomScope, nowMs)) {
    grantRosAuthorityLeaseV0(roomScope, opts.holderId ?? "castle:wal:local", 120_000);
  }

  const ros = executeRosPolicyOnWalDiffV0(walDiff, { holderId: opts.holderId, nowMs });
  if (!ros.allow) {
    return {
      ok: false,
      code: ros.code,
      rosVerdict: ros.rosVerdict,
      geometryAuthority: { walWroteEpochDirectly: false }
    };
  }
  walDiff = {
    ...walDiff,
    signed: walDiff.signed !== false,
    leaseOk: ros.leaseOk,
    constitutionOk: ros.constitutionOk
  };

  let navInvalidation = null;
  if (walDiff.kind === WAL_WORLD_DIFF_KIND_V0.OBSTACLE_DELTA) {
    const kernel0 = getState();
    const war0 = kernel0.worldAuthorityRuntime ?? defaultWorldAuthorityRuntimeV0();
    const prior =
      war0.sealedObstacleByRoomUid[roomScope]?.discs ??
      war0.pendingObstaclesByRoomUid[roomScope]?.discs ??
      [];
    const next = mergeObstacleDiscsV0(prior, walDiff.payload);
    const invalidationCellKeys = computeNavInvalidationMaskV0(prior, next);
    navInvalidation = { discCount: next.length, invalidationCellKeys: invalidationCellKeys.length };
    setState({
      ...kernel0,
      worldAuthorityRuntime: stagePendingObstacleAuthorityV0(war0, roomScope, {
        discs: next,
        invalidationCellKeys
      })
    });
  }

  const epochBefore = getState().realitySeal.realityEpoch;
  const submitResult = submitWorldAuthoritySealCandidateOnKernelV0(getState, setState, walDiff, {
    ...opts,
    nowMs,
    forceDrain: opts.forceDrain
  });
  if (!submitResult.ok) {
    return {
      ...submitResult,
      geometryAuthority: { walWroteEpochDirectly: false, epochBefore, epochAfter: epochBefore },
      ros
    };
  }

  let postSeal = { applied: false };
  if (submitResult.poke?.sealed > 0) {
    postSeal = maybeApplyPostSealBridgeOnKernelV0(getState, setState, {
      sealed: submitResult.poke.sealed,
      seal: getState().realitySeal,
      roomScope
    });
  }

  return {
    ok: true,
    ...buildStreamIngressResultV0(mapped.walDiff, submitResult, epochBefore, getState()),
    ros,
    navInvalidation,
    postSeal
  };
}

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {WalObstacleStreamFrameV0} frame
 * @param {{ nowMs?: number, persist?: boolean }} [opts]
 */
export function ingestObstacleStreamFrameOnKernelV0(getState, setState, frame, opts) {
  return ingestWorldAuthorityStreamFrameOnKernelV0(
    getState,
    setState,
    { streamKind: WAL_STREAM_FRAME_KIND_V0.OBSTACLE_STREAM, frame },
    opts
  );
}

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {WalSceneDiffFrameV0} frame
 * @param {{ nowMs?: number, persist?: boolean }} [opts]
 */
export function ingestSceneGraphDiffFrameOnKernelV0(getState, setState, frame, opts) {
  return ingestWorldAuthorityStreamFrameOnKernelV0(
    getState,
    setState,
    { streamKind: WAL_STREAM_FRAME_KIND_V0.SCENE_DIFF, frame },
    opts
  );
}

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {WalTopologyPatchFrameV0} frame
 * @param {{ nowMs?: number, persist?: boolean }} [opts]
 */
export function ingestTopologyPatchFrameOnKernelV0(getState, setState, frame, opts) {
  return ingestWorldAuthorityStreamFrameOnKernelV0(
    getState,
    setState,
    { streamKind: WAL_STREAM_FRAME_KIND_V0.TOPOLOGY_PATCH, frame },
    opts
  );
}

/**
 * @param {import("../../studio/types/rskOntology.js").StudioKernelState} kernel
 * @returns {Record<string, unknown>}
 */
export function buildWorldAuthorityStreamIngressSnapshotV0(kernel) {
  const rs = kernel?.realitySeal;
  return {
    schema: WORLD_AUTHORITY_STREAM_INGRESS_SCHEMA_V0,
    contract: WAL_STREAM_GEOMETRY_AUTHORITY_CONTRACT_V0,
    ts: Date.now(),
    realityEpoch: rs?.realityEpoch ?? 0,
    queueDepth: rs?.sealQueue?.length ?? 0,
    streamSeq: rs?.streamSeq ?? 0,
    frameKinds: Object.values(WAL_STREAM_FRAME_KIND_V0),
    entrypoint: "ingestWorldAuthorityStreamFrameOnKernelV0"
  };
}
