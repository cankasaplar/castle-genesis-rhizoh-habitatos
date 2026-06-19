/**
 * Chess engine task queue — priority scheduling for the single Stockfish WASM pipeline.
 * RESEARCH-ONLY — observation / sim scheduling only; no execution authority.
 */

export const CHESS_ENGINE_TASK_QUEUE_SCHEMA_V0 = "castle.rhizoh.chess_engine_task_queue.v0";

/** Lower number = higher priority. */
export const CHESS_ENGINE_TASK_PRIORITY_V0 = Object.freeze({
  ARENA_MATCH: 1,
  LEARNING_MEASURE: 2,
  CLUSTER_MOVE: 3,
  BACKGROUND: 4
});

export const CHESS_ENGINE_TASK_KIND_V0 = Object.freeze({
  ARENA_MOVE: "arena_move",
  MULTI_PV: "multi_pv",
  CLUSTER_MOVE: "cluster_move",
  ANALYSIS: "analysis",
  PREWARM: "prewarm",
  ENGINE_OP: "engine_op"
});

/**
 * @typedef {{
 *   priority: number,
 *   kind: string,
 *   label?: string,
 *   run: () => Promise<unknown>,
 *   onPreempt?: () => void
 * }} ChessEngineTaskEnqueueV0
 */

/** @type {Array<object>} */
let queueV0 = [];
/** @type {object | null} */
let activeTaskV0 = null;
let drainingV0 = false;
let taskSeqV0 = 0;
let preemptCountV0 = 0;
let completedCountV0 = 0;
let clusterSupersededCountV0 = 0;

function flattenPendingClusterMovesV0(keepRow) {
  const next = [];
  for (const task of queueV0) {
    if (
      task.id !== keepRow.id &&
      task.priority === CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE &&
      task.kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE
    ) {
      clusterSupersededCountV0 += 1;
      task.resolve(null);
      continue;
    }
    next.push(task);
  }
  queueV0 = next;
}

function insertTaskSortedV0(row) {
  const idx = queueV0.findIndex(
    (task) => task.priority > row.priority || (task.priority === row.priority && task.enqueuedAt > row.enqueuedAt)
  );
  if (idx === -1) queueV0.push(row);
  else queueV0.splice(idx, 0, row);
}

/** Drop pending cluster tasks so arena play can own the single engine. */
export function cancelPendingClusterEngineTasksV0() {
  const next = [];
  for (const task of queueV0) {
    if (
      task.priority === CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE &&
      task.kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE
    ) {
      clusterSupersededCountV0 += 1;
      task.resolve(null);
      continue;
    }
    next.push(task);
  }
  queueV0 = next;
  if (
    activeTaskV0?.priority === CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE &&
    activeTaskV0?.kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE
  ) {
    preemptCountV0 += 1;
    try {
      activeTaskV0.onPreempt?.();
    } catch {
      /* noop */
    }
  }
  publishChessEngineQueueRegistryV0();
}

function publishChessEngineQueueRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessEngineQueue = getChessEngineQueueSnapshotV0();
}

/**
 * @param {ChessEngineTaskEnqueueV0 & { resolve: Function, reject: Function, id: number, enqueuedAt: number }} task
 */
function maybePreemptForTaskV0(task) {
  if (!activeTaskV0) return;
  if (task.priority >= activeTaskV0.priority) return;
  preemptCountV0 += 1;
  try {
    activeTaskV0.onPreempt?.();
  } catch {
    /* noop */
  }
}

async function drainChessEngineTaskQueueV0() {
  if (drainingV0) return;
  drainingV0 = true;
  try {
    while (queueV0.length > 0 && !activeTaskV0) {
      const task = queueV0.shift();
      activeTaskV0 = Object.freeze({
        id: task.id,
        priority: task.priority,
        kind: task.kind,
        label: task.label,
        run: task.run,
        onPreempt: task.onPreempt,
        enqueuedAt: task.enqueuedAt,
        startedAtMs: Date.now(),
        resolve: task.resolve,
        reject: task.reject
      });
      publishChessEngineQueueRegistryV0();
      try {
        const result = await task.run();
        task.resolve(result);
      } catch (err) {
        task.reject(err);
      } finally {
        activeTaskV0 = null;
        completedCountV0 += 1;
        publishChessEngineQueueRegistryV0();
      }
    }
  } finally {
    drainingV0 = false;
    if (queueV0.length > 0 && !activeTaskV0) {
      void drainChessEngineTaskQueueV0();
    }
  }
}

/**
 * @param {ChessEngineTaskEnqueueV0} task
 * @returns {Promise<unknown>}
 */
export function enqueueChessEngineTaskV0(task) {
  return new Promise((resolve, reject) => {
    const row = Object.freeze({
      id: (taskSeqV0 += 1),
      priority: Number(task.priority) || CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: String(task.kind || CHESS_ENGINE_TASK_KIND_V0.ENGINE_OP),
      label: String(task.label || task.kind || "engine_op"),
      run: task.run,
      onPreempt: task.onPreempt || null,
      enqueuedAt: Date.now(),
      resolve,
      reject
    });
    insertTaskSortedV0(row);
    const latestOnlyCluster =
      task.latestOnly !== false &&
      row.priority === CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE &&
      row.kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE;
    if (latestOnlyCluster) {
      flattenPendingClusterMovesV0(row);
    }
    maybePreemptForTaskV0(row);
    publishChessEngineQueueRegistryV0();
    void drainChessEngineTaskQueueV0();
  });
}

export function getChessEngineQueueSnapshotV0() {
  const pendingByPriority = Object.freeze({
    arena: queueV0.filter((t) => t.priority === CHESS_ENGINE_TASK_PRIORITY_V0.ARENA_MATCH).length,
    learning: queueV0.filter((t) => t.priority === CHESS_ENGINE_TASK_PRIORITY_V0.LEARNING_MEASURE).length,
    cluster: queueV0.filter((t) => t.priority === CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE).length,
    background: queueV0.filter((t) => t.priority === CHESS_ENGINE_TASK_PRIORITY_V0.BACKGROUND).length
  });

  return Object.freeze({
    schema: CHESS_ENGINE_TASK_QUEUE_SCHEMA_V0,
    pendingCount: queueV0.length,
    pendingByPriority,
    active: activeTaskV0
      ? Object.freeze({
          id: activeTaskV0.id,
          priority: activeTaskV0.priority,
          kind: activeTaskV0.kind,
          label: activeTaskV0.label,
          startedAtMs: activeTaskV0.startedAtMs || activeTaskV0.enqueuedAt
        })
      : null,
    preemptCount: preemptCountV0,
    clusterSupersededCount: clusterSupersededCountV0,
    completedCount: completedCountV0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessEngineTaskQueueForTestV0() {
  queueV0 = [];
  activeTaskV0 = null;
  drainingV0 = false;
  taskSeqV0 = 0;
  preemptCountV0 = 0;
  completedCountV0 = 0;
  clusterSupersededCountV0 = 0;
  if (typeof window !== "undefined" && window.__rhizoh?.chessEngineQueue) {
    delete window.__rhizoh.chessEngineQueue;
  }
}
