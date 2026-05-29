/**
 * Sprint C daemon queue + history (no ingress import — avoids cycles).
 */

import { computeWalDiffPayloadHashV0 } from "./submitWorldAuthoritySealCandidateV0.js";

export const WORLD_RUNTIME_DAEMON_QUEUE_SCHEMA_V0 = "castle.rhizoh.world_runtime_daemon_queue.v0";

export const WORLD_RUNTIME_DAEMON_DEFAULTS_V0 = Object.freeze({
  tickIntervalMs: 500,
  maxQueueDepth: 64,
  highWaterMark: 48,
  maxFramesPerTick: 8,
  topologyFlushPatchCount: 12,
  sceneReconcileStaleMs: 2000
});

let daemonStateV0 = createWorldRuntimeDaemonStateV0();

export function createWorldRuntimeDaemonStateV0() {
  return {
    schema: WORLD_RUNTIME_DAEMON_QUEUE_SCHEMA_V0,
    running: false,
    lastTickAtMs: 0,
    ticksThisSession: 0,
    streamQueue: [],
    backpressure: {
      depth: 0,
      maxDepth: WORLD_RUNTIME_DAEMON_DEFAULTS_V0.maxQueueDepth,
      droppedFrames: 0,
      paused: false,
      highWaterMark: WORLD_RUNTIME_DAEMON_DEFAULTS_V0.highWaterMark
    },
    sceneReconciliationByRoom: {},
    topologyAccumulatorByRoom: {},
    walHistoryLocal: [],
    remoteWalHistories: [],
    lastConvergence: null,
    peerConvergence: {
      quarantineByCastleId: {},
      acceptedByCastleId: {},
      debugEvents: []
    }
  };
}

export function getWorldRuntimeDaemonStateV0() {
  return daemonStateV0;
}

export function resetWorldRuntimeDaemonStateV0() {
  daemonStateV0 = createWorldRuntimeDaemonStateV0();
}

export function isWorldRuntimeDaemonEnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_WORLD_RUNTIME_DAEMON === "1";
  } catch {
    return false;
  }
}

export function enqueueWorldRuntimeStreamFrameV0(item) {
  const streamKind = String(item?.streamKind || "").trim();
  if (!streamKind) {
    return { accepted: false, code: "STREAM_KIND_REQUIRED" };
  }
  const bp = daemonStateV0.backpressure;
  if (daemonStateV0.streamQueue.length >= bp.maxDepth) {
    bp.droppedFrames += 1;
    bp.paused = true;
    return { accepted: false, code: "BACKPRESSURE_DROP", depth: daemonStateV0.streamQueue.length };
  }
  daemonStateV0.streamQueue.push({
    streamKind,
    frame: item.frame,
    enqueuedAtMs: Number(item.enqueuedAtMs) || Date.now()
  });
  bp.depth = daemonStateV0.streamQueue.length;
  bp.paused = bp.depth >= bp.highWaterMark;
  return { accepted: true, depth: bp.depth, paused: bp.paused };
}

export function appendLocalWalHistoryEntryV0(walDiff, meta = {}) {
  const entry = {
    diffId: walDiff.diffId,
    kind: walDiff.kind,
    roomScope: walDiff.roomScope,
    lamport: Number(meta.lamport) || daemonStateV0.walHistoryLocal.length + 1,
    castleId: String(meta.castleId || "local"),
    streamSeq: walDiff.streamSeq,
    payload: walDiff.payload,
    payloadHash: computeWalDiffPayloadHashV0(walDiff),
    signed: walDiff.signed !== false
  };
  daemonStateV0.walHistoryLocal.push(entry);
  if (daemonStateV0.walHistoryLocal.length > 512) {
    daemonStateV0.walHistoryLocal = daemonStateV0.walHistoryLocal.slice(-512);
  }
  return entry;
}

export function ingestRemoteWalHistoryV0(history, castleId) {
  const id = String(castleId || "peer").slice(0, 64);
  const list = Array.isArray(history) ? history : [];
  daemonStateV0.remoteWalHistories = daemonStateV0.remoteWalHistories.filter((h) => h.castleId !== id);
  daemonStateV0.remoteWalHistories.push({ castleId: id, entries: list });
  return { ok: true, peerCount: daemonStateV0.remoteWalHistories.length };
}
