export const RHIZOH_TASK_NODE_STATUS = Object.freeze({
  PENDING: "pending",
  READY: "ready",
  RUNNING: "running",
  BLOCKED: "blocked",
  FAILED: "failed",
  COMPLETED: "completed"
});

function canEnterReady(task) {
  if (!task.dependsOn?.length) return true;
  return task.dependsOn.every((t) => t.status === RHIZOH_TASK_NODE_STATUS.COMPLETED);
}

/**
 * @param {Array<object>} tasks
 */
export function recomputeDagReadiness(tasks) {
  for (const task of tasks) {
    if (task.status === RHIZOH_TASK_NODE_STATUS.PENDING && canEnterReady(task)) {
      task.status = RHIZOH_TASK_NODE_STATUS.READY;
    }
  }
  return tasks;
}

/**
 * @param {Array<object>} tasks
 */
export function pickNextReadyTask(tasks) {
  return tasks.find((t) => t.status === RHIZOH_TASK_NODE_STATUS.READY) ?? null;
}

/**
 * @param {object} task
 * @param {"completed"|"failed"} result
 */
export function closeTask(task, result) {
  if (result === "completed") task.status = RHIZOH_TASK_NODE_STATUS.COMPLETED;
  else task.status = RHIZOH_TASK_NODE_STATUS.FAILED;
  task.closedAtMs = Date.now();
  return task;
}

