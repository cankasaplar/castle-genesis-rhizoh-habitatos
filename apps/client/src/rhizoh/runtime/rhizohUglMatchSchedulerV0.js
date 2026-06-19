/**
 * UGL Match Scheduler — PLAY vs LEARN pipeline separation.
 * Sits above chessEngineTaskQueueV0; learn defers when play contended.
 * RESEARCH-ONLY
 */

import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0,
  enqueueChessEngineTaskV0,
  getChessEngineQueueSnapshotV0
} from "./chessEngineTaskQueueV0.js";
import { getChessEngineContentionSnapshotV0 } from "./chessEngineContentionGateV0.js";
import { drainUglLearnBufferV0 } from "./rhizohUglLearnBufferSinkV0.js";
import { RHIZOH_UGL_PIPELINE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_UGL_MATCH_SCHEDULER_SCHEMA_V0 = "castle.rhizoh.ugl_match_scheduler.v0";

const MAX_DEFERRED_LEARN_V0 = 64;
/** @type {Array<{ run: Function, label: string, enqueuedAt: number }>} */
let deferredLearnQueueV0 = [];
let playTasksCompletedV0 = 0;
let learnTasksCompletedV0 = 0;
let learnTasksDeferredV0 = 0;
let drainingLearnV0 = false;

function isPlayPipelineBusyV0() {
  const queue = getChessEngineQueueSnapshotV0();
  const contention = getChessEngineContentionSnapshotV0();
  if (queue.active) {
    const kind = queue.active.kind;
    if (
      kind === CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE ||
      kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE
    ) {
      return true;
    }
  }
  const playPending =
    (queue.pendingByPriority?.arena || 0) + (queue.pendingByPriority?.cluster || 0);
  return playPending > 0 || contention.chessLock || contention.contended;
}

async function drainDeferredLearnQueueV0() {
  if (drainingLearnV0 || deferredLearnQueueV0.length === 0) return;
  if (isPlayPipelineBusyV0()) return;
  drainingLearnV0 = true;
  try {
    while (deferredLearnQueueV0.length > 0 && !isPlayPipelineBusyV0()) {
      const row = deferredLearnQueueV0.shift();
      if (!row) break;
      try {
        await scheduleUglLearnTaskV0(row.run, { label: row.label, fromDeferred: true });
      } catch {
        /* noop */
      }
    }
  } finally {
    drainingLearnV0 = false;
  }
}

/**
 * @param {() => Promise<unknown>} run
 * @param {{ label?: string, kind?: string, priority?: number, latestOnly?: boolean }} [opts]
 */
export function scheduleUglPlayTaskV0(run, opts = {}) {
  const kind = opts.kind || CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE;
  const priority =
    opts.priority ||
    (kind === CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE
      ? CHESS_ENGINE_TASK_PRIORITY_V0.ARENA_MATCH
      : CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE);

  return enqueueChessEngineTaskV0({
    priority,
    kind,
    label: opts.label || `ugl_play_${kind}`,
    latestOnly: opts.latestOnly,
    run: async () => {
      const result = await run();
      playTasksCompletedV0 += 1;
      publishUglSchedulerRegistryV0();
      void drainDeferredLearnQueueV0();
      void drainUglLearnBufferV0();
      return result;
    }
  });
}

/**
 * @param {() => Promise<unknown>} run
 * @param {{ label?: string, force?: boolean, fromDeferred?: boolean }} [opts]
 */
export function scheduleUglLearnTaskV0(run, opts = {}) {
  if (!opts.force && !opts.fromDeferred && isPlayPipelineBusyV0()) {
    learnTasksDeferredV0 += 1;
    deferredLearnQueueV0.push({
      run,
      label: opts.label || "ugl_learn_deferred",
      enqueuedAt: Date.now()
    });
    while (deferredLearnQueueV0.length > MAX_DEFERRED_LEARN_V0) {
      deferredLearnQueueV0.shift();
    }
    publishUglSchedulerRegistryV0();
    return Promise.resolve(null);
  }

  return enqueueChessEngineTaskV0({
    priority: CHESS_ENGINE_TASK_PRIORITY_V0.LEARNING_MEASURE,
    kind: CHESS_ENGINE_TASK_KIND_V0.MULTI_PV,
    label: opts.label || "ugl_learn",
    latestOnly: true,
    run: async () => {
      const result = await run();
      learnTasksCompletedV0 += 1;
      publishUglSchedulerRegistryV0();
      void drainDeferredLearnQueueV0();
      return result;
    }
  });
}

export function getUglMatchSchedulerSnapshotV0() {
  const queue = getChessEngineQueueSnapshotV0();
  const contention = getChessEngineContentionSnapshotV0();
  return Object.freeze({
    schema: RHIZOH_UGL_MATCH_SCHEDULER_SCHEMA_V0,
    playPipeline: Object.freeze({
      busy: isPlayPipelineBusyV0(),
      completed: playTasksCompletedV0,
      pendingArena: queue.pendingByPriority?.arena || 0,
      pendingCluster: queue.pendingByPriority?.cluster || 0
    }),
    learnPipeline: Object.freeze({
      deferred: deferredLearnQueueV0.length,
      deferredTotal: learnTasksDeferredV0,
      completed: learnTasksCompletedV0,
      pendingLearning: queue.pendingByPriority?.learning || 0,
      draining: drainingLearnV0
    }),
    engineContention: contention,
    separationNote: "PLAY never blocked by learn backlog; learn defers when play contended",
    atMs: Date.now()
  });
}

function publishUglSchedulerRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.uglScheduler = getUglMatchSchedulerSnapshotV0();
}

export function buildUglMatchSchedulerReportV0() {
  return Object.freeze({
    ...getUglMatchSchedulerSnapshotV0(),
    pipelines: Object.freeze([RHIZOH_UGL_PIPELINE_V0.PLAY, RHIZOH_UGL_PIPELINE_V0.LEARN]),
    apis: Object.freeze({
      play: "scheduleUglPlayTaskV0(run, opts)",
      learn: "scheduleUglLearnTaskV0(run, opts)"
    })
  });
}

/** @internal vitest */
export function __resetUglMatchSchedulerForTestV0() {
  deferredLearnQueueV0 = [];
  playTasksCompletedV0 = 0;
  learnTasksCompletedV0 = 0;
  learnTasksDeferredV0 = 0;
  drainingLearnV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh?.uglScheduler) {
    delete window.__rhizoh.uglScheduler;
  }
}
