/**
 * Castle Execution State v1.1 — pause/resume graph for interruptible cognition.
 * interrupt ≠ drop · interrupt = suspend + resume graph
 */

export const CASTLE_EXECUTION_STATE_SCHEMA_V1 = "castle.execution_state.v1";

export const EXECUTION_STATE_V1 = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  SUSPENDED: "suspended"
});

/** @type {object} */
let executionStateV1 = createIdleStateV1();

function createIdleStateV1() {
  return {
    state: EXECUTION_STATE_V1.IDLE,
    currentPlan: null,
    currentPriority: 0,
    startedAtMs: 0,
    resumeGraph: null
  };
}

/**
 * @param {object} plan
 * @param {number} atMs
 */
export function beginExecutionV1(plan, atMs = Date.now()) {
  executionStateV1 = {
    state: EXECUTION_STATE_V1.RUNNING,
    currentPlan: plan,
    currentPriority: plan.priority || 0,
    startedAtMs: atMs,
    resumeGraph: null
  };
  publishExecutionStateV1();
  return getExecutionStateV1();
}

/**
 * Suspend current execution — saved for resume, not dropped.
 * @param {object} coherence
 * @param {number} atMs
 * @param {string} reason
 */
export function suspendCurrentExecutionV1(coherence, atMs = Date.now(), reason = "preempt") {
  if (executionStateV1.state !== EXECUTION_STATE_V1.RUNNING || !executionStateV1.currentPlan) {
    return null;
  }

  const suspended = Object.freeze({
    schema: CASTLE_EXECUTION_STATE_SCHEMA_V1,
    suspendedPlan: executionStateV1.currentPlan,
    priority: executionStateV1.currentPriority,
    startedAtMs: executionStateV1.startedAtMs,
    suspendedAtMs: atMs,
    reason,
    coherence: coherence ? Object.freeze({ ...coherence }) : null
  });

  executionStateV1 = {
    state: EXECUTION_STATE_V1.SUSPENDED,
    currentPlan: null,
    currentPriority: 0,
    startedAtMs: 0,
    resumeGraph: suspended
  };

  publishExecutionStateV1();
  return suspended;
}

/**
 * Resume previously suspended plan if no higher-priority work pending.
 * @param {number} atMs
 */
export function resumeSuspendedExecutionV1(atMs = Date.now()) {
  const resume = executionStateV1.resumeGraph;
  if (!resume?.suspendedPlan) return null;

  executionStateV1 = {
    state: EXECUTION_STATE_V1.RUNNING,
    currentPlan: resume.suspendedPlan,
    currentPriority: resume.priority,
    startedAtMs: atMs,
    resumeGraph: null
  };

  publishExecutionStateV1();
  return Object.freeze({ resumed: resume.suspendedPlan, atMs });
}

export function completeExecutionV1(atMs = Date.now()) {
  executionStateV1 = createIdleStateV1();
  publishExecutionStateV1();
  return getExecutionStateV1();
}

export function getExecutionStateV1() {
  return Object.freeze({
    schema: CASTLE_EXECUTION_STATE_SCHEMA_V1,
    state: executionStateV1.state,
    currentPlan: executionStateV1.currentPlan,
    currentPriority: executionStateV1.currentPriority,
    startedAtMs: executionStateV1.startedAtMs,
    resumeGraph: executionStateV1.resumeGraph
      ? Object.freeze({ ...executionStateV1.resumeGraph })
      : null,
    isIdle: executionStateV1.state === EXECUTION_STATE_V1.IDLE,
    isRunning: executionStateV1.state === EXECUTION_STATE_V1.RUNNING
  });
}

function publishExecutionStateV1() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.executionState = getExecutionStateV1();
}

/** @internal vitest */
export function __resetExecutionStateForTestV1() {
  executionStateV1 = createIdleStateV1();
}
