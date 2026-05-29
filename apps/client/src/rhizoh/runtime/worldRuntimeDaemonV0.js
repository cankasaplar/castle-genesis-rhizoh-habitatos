/**
 * Sprint C — persistent world runtime daemon (streaming substrate process).
 *
 * **Not** frame-driven (no rAF). Runs on interval + ingress enqueue.
 */

import { isWalGeometryIngressEnabledV0 } from "./walWorldAuthorityGateV0.js";
import { defaultWorldAuthorityRuntimeV0 } from "./worldAuthorityRuntimeDefaultsV0.js";
import {
  ingestWorldAuthorityStreamFrameOnKernelV0,
  mapStreamFrameToWalDiffV0,
  WAL_STREAM_FRAME_KIND_V0
} from "./worldAuthorityStreamIngressV0.js";
import { mergeWalHistoriesV0, buildWalConvergenceSnapshotV0 } from "./walRealityConvergenceV0.js";
import { pokeRealitySealerScheduleOnKernelV0 } from "./realitySealerLiveWiringV0.js";
import {
  WORLD_RUNTIME_DAEMON_DEFAULTS_V0,
  getWorldRuntimeDaemonStateV0,
  appendLocalWalHistoryEntryV0,
  enqueueWorldRuntimeStreamFrameV0
} from "./worldRuntimeDaemonQueueV0.js";

export {
  WORLD_RUNTIME_DAEMON_DEFAULTS_V0,
  createWorldRuntimeDaemonStateV0,
  getWorldRuntimeDaemonStateV0,
  resetWorldRuntimeDaemonStateV0,
  isWorldRuntimeDaemonEnabledV0,
  enqueueWorldRuntimeStreamFrameV0,
  appendLocalWalHistoryEntryV0,
  ingestRemoteWalHistoryV0
} from "./worldRuntimeDaemonQueueV0.js";

export const WORLD_RUNTIME_DAEMON_SCHEMA_V0 = "castle.rhizoh.world_runtime_daemon.v0";

export function accumulateTopologyDiffV0(roomScope, entry) {
  const daemonStateV0 = getWorldRuntimeDaemonStateV0();
  const room = String(roomScope || "").trim();
  if (!room) return { ok: false, code: "ROOM_REQUIRED" };
  const patchId = String(entry?.patchId || "").trim();
  if (!patchId) return { ok: false, code: "PATCH_ID_REQUIRED" };

  const acc = daemonStateV0.topologyAccumulatorByRoom[room] ?? {
    revision: 0,
    patches: [],
    patchIds: new Set()
  };
  if (acc.patchIds.has(patchId)) {
    return { ok: true, duplicate: true, revision: acc.revision };
  }
  acc.patchIds.add(patchId);
  acc.patches.push({
    patchId,
    patch: entry.patch,
    lamport: Number(entry.lamport) || 0,
    atMs: Date.now()
  });
  acc.revision += 1;
  daemonStateV0.topologyAccumulatorByRoom[room] = acc;
  return { ok: true, revision: acc.revision, pending: acc.patches.length };
}

export function reconcileSceneGraphRoomV0(kernel, roomScope, nowMs = Date.now()) {
  const daemonStateV0 = getWorldRuntimeDaemonStateV0();
  const room = String(roomScope || "").trim();
  const war = kernel.worldAuthorityRuntime ?? defaultWorldAuthorityRuntimeV0();
  const cache = war.sceneGraphByRoomUid[room];
  const rec = daemonStateV0.sceneReconciliationByRoom[room] ?? {
    lastReconciledRevision: 0,
    lastAtMs: 0,
    driftDetected: false
  };

  const cacheRev = cache?.revision ?? 0;
  const drift = cacheRev > rec.lastReconciledRevision;
  const stale = nowMs - rec.lastAtMs > WORLD_RUNTIME_DAEMON_DEFAULTS_V0.sceneReconcileStaleMs;

  rec.lastReconciledRevision = cacheRev;
  rec.lastAtMs = nowMs;
  rec.driftDetected = drift || stale;
  daemonStateV0.sceneReconciliationByRoom[room] = rec;

  return {
    roomScope: room,
    cacheRevision: cacheRev,
    driftDetected: rec.driftDetected,
    nodeCount: cache ? Object.keys(cache.nodes).length : 0
  };
}

function flushTopologyAccumulatorIfReadyV0(roomScope) {
  const daemonStateV0 = getWorldRuntimeDaemonStateV0();
  const acc = daemonStateV0.topologyAccumulatorByRoom[roomScope];
  if (!acc?.patches?.length) return null;
  if (acc.patches.length < WORLD_RUNTIME_DAEMON_DEFAULTS_V0.topologyFlushPatchCount) {
    return null;
  }
  const merged = acc.patches.sort((a, b) => (a.lamport || 0) - (b.lamport || 0));
  const frame = {
    frameId: `topology:acc:${roomScope}:${acc.revision}`,
    roomScope,
    patch: { patches: merged.map((p) => p.patch), patchIds: merged.map((p) => p.patchId) },
    signed: true
  };
  daemonStateV0.topologyAccumulatorByRoom[roomScope] = {
    revision: acc.revision,
    patches: [],
    patchIds: new Set()
  };
  return { streamKind: WAL_STREAM_FRAME_KIND_V0.TOPOLOGY_PATCH, frame };
}

export function tickWalRealityConvergenceV0() {
  const daemonStateV0 = getWorldRuntimeDaemonStateV0();
  const remoteEntries = daemonStateV0.remoteWalHistories.map((h) => h.entries);
  const mergeResult = mergeWalHistoriesV0(daemonStateV0.walHistoryLocal, remoteEntries);
  daemonStateV0.lastConvergence = {
    ...buildWalConvergenceSnapshotV0(mergeResult),
    conflicts: mergeResult.conflicts
  };
  return mergeResult;
}

export function tickWorldRuntimeDaemonV0(getState, setState, opts = {}) {
  const daemonStateV0 = getWorldRuntimeDaemonStateV0();
  const nowMs = Number(opts.nowMs) || Date.now();
  const maxFrames = Number(opts.maxFrames) || WORLD_RUNTIME_DAEMON_DEFAULTS_V0.maxFramesPerTick;
  const kernel = getState();
  const war = kernel.worldAuthorityRuntime ?? defaultWorldAuthorityRuntimeV0();

  const rooms = new Set([
    ...Object.keys(war.sceneGraphByRoomUid ?? {}),
    ...Object.keys(daemonStateV0.topologyAccumulatorByRoom)
  ]);

  const reconcileReports = [];
  for (const room of rooms) {
    reconcileReports.push(reconcileSceneGraphRoomV0(kernel, room, nowMs));
    const flush = flushTopologyAccumulatorIfReadyV0(room);
    if (flush) enqueueWorldRuntimeStreamFrameV0(flush);
  }

  const convergence = tickWalRealityConvergenceV0();

  const drained = [];
  let processed = 0;
  while (processed < maxFrames && daemonStateV0.streamQueue.length > 0) {
    const item = daemonStateV0.streamQueue.shift();
    processed += 1;
    const mapped = mapStreamFrameToWalDiffV0({ streamKind: item.streamKind, frame: item.frame });
    const r = ingestWorldAuthorityStreamFrameOnKernelV0(
      getState,
      setState,
      { streamKind: item.streamKind, frame: item.frame },
      { nowMs, daemonBypass: true }
    );
    if (mapped.ok) {
      appendLocalWalHistoryEntryV0(mapped.walDiff, { lamport: daemonStateV0.walHistoryLocal.length });
    }
    drained.push({ streamKind: item.streamKind, ok: r.ok, code: r.code });
  }

  daemonStateV0.backpressure.depth = daemonStateV0.streamQueue.length;
  daemonStateV0.backpressure.paused =
    daemonStateV0.backpressure.depth >= daemonStateV0.backpressure.highWaterMark;

  let sealerPoke = null;
  if (drained.some((d) => d.ok) || convergence.conflicts.length > 0) {
    sealerPoke = pokeRealitySealerScheduleOnKernelV0(getState, setState, {
      nowMs,
      trigger: "world_runtime_daemon",
      walIngressSealing: true
    });
  }

  daemonStateV0.lastTickAtMs = nowMs;
  daemonStateV0.ticksThisSession += 1;

  return {
    schema: WORLD_RUNTIME_DAEMON_SCHEMA_V0,
    processed,
    queueDepth: daemonStateV0.backpressure.depth,
    paused: daemonStateV0.backpressure.paused,
    droppedFrames: daemonStateV0.backpressure.droppedFrames,
    reconcileReports,
    convergence: daemonStateV0.lastConvergence,
    drained,
    sealerPoke
  };
}

export function attachDaemonSnapshotToKernelV0(kernel) {
  const war = kernel.worldAuthorityRuntime ?? defaultWorldAuthorityRuntimeV0();
  return {
    ...kernel,
    worldAuthorityRuntime: {
      ...war,
      daemonSnapshot: buildWorldRuntimeDaemonSnapshotV0()
    }
  };
}

export function buildWorldRuntimeDaemonSnapshotV0() {
  const daemonStateV0 = getWorldRuntimeDaemonStateV0();
  return {
    schema: WORLD_RUNTIME_DAEMON_SCHEMA_V0,
    ts: Date.now(),
    running: daemonStateV0.running,
    lastTickAtMs: daemonStateV0.lastTickAtMs,
    ticksThisSession: daemonStateV0.ticksThisSession,
    backpressure: { ...daemonStateV0.backpressure },
    queueDepth: daemonStateV0.streamQueue.length,
    sceneRooms: Object.keys(daemonStateV0.sceneReconciliationByRoom).length,
    topologyRooms: Object.keys(daemonStateV0.topologyAccumulatorByRoom).length,
    walHistoryLen: daemonStateV0.walHistoryLocal.length,
    remotePeerCount: daemonStateV0.remoteWalHistories.length,
    lastConvergence: daemonStateV0.lastConvergence,
    walGeometryIngress: isWalGeometryIngressEnabledV0()
  };
}
