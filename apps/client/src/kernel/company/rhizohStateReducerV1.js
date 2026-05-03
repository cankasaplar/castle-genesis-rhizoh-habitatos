export const RHIZOH_STATE_REDUCER_VERSION = "v1";

function hashStringFNV1a(value) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function projectStateForHash(state) {
  return {
    contracts: state.contracts.size,
    tasks: state.tasks.map((t) => ({ taskId: t.taskId, status: t.status, traceId: t.traceId })),
    approvals: state.approvals.map((a) => ({ taskId: a.taskId, status: a.status })),
    memoryArtifacts: state.memoryArtifacts,
    proofRecords: state.proofRecords,
    killState: state.killState
  };
}

function snapshotHashFromReducedState(state) {
  return hashStringFNV1a(JSON.stringify(projectStateForHash(state)));
}

function createEmptyReducedState() {
  return {
    contracts: new Set(),
    tasks: [],
    approvals: [],
    memoryArtifacts: 0,
    proofRecords: 0,
    killState: { level: "L0", active: false, reason: null, atMs: null }
  };
}

function ensureTask(state, event) {
  let task = state.tasks.find((t) => t.taskId === event.taskId);
  if (!task && event.taskId) {
    task = { taskId: event.taskId, status: "pending", traceId: event.traceId ?? null };
    state.tasks.push(task);
  }
  return task;
}

function applyEvent(state, event) {
  switch (event.type) {
    case "AGENT_CONTRACT_REGISTERED":
      if (event.agentId) state.contracts.add(event.agentId);
      break;
    case "TASK_CREATED": {
      if (!event.taskId) break;
      const task = ensureTask(state, event);
      if (task) {
        task.status = "pending";
        task.traceId = event.traceId ?? task.traceId;
      }
      break;
    }
    case "TASK_BLOCKED_AWAITING_APPROVAL": {
      const task = ensureTask(state, event);
      if (task) task.status = "blocked";
      if (event.taskId && !state.approvals.find((a) => a.taskId === event.taskId && a.status === "pending")) {
        state.approvals.push({ taskId: event.taskId, status: "pending" });
      }
      break;
    }
    case "TASK_APPROVED": {
      const task = ensureTask(state, event);
      if (task) task.status = "pending";
      const approval = state.approvals.find((a) => a.taskId === event.taskId && a.status === "pending");
      if (approval) approval.status = "approved";
      break;
    }
    case "TASK_REJECTED": {
      const task = ensureTask(state, event);
      if (task) task.status = "failed";
      const approval = state.approvals.find((a) => a.taskId === event.taskId && a.status === "pending");
      if (approval) approval.status = "rejected";
      break;
    }
    case "TASK_EXECUTION_STARTED": {
      const task = ensureTask(state, event);
      if (task) task.status = "running";
      break;
    }
    case "TASK_EXECUTED": {
      const task = ensureTask(state, event);
      if (task) task.status = "completed";
      break;
    }
    case "TASK_FAILED_BUDGET_CAP": {
      const task = ensureTask(state, event);
      if (task) task.status = "failed";
      break;
    }
    case "MEMORY_COMMITTED":
      state.memoryArtifacts += 1;
      break;
    case "PROOF_ATTACHED":
      state.proofRecords += 1;
      break;
    case "KILL_SWITCH_EMITTED":
      state.killState = {
        level: event.payload?.level ?? "L1",
        active: true,
        reason: event.payload?.reason ?? "manual",
        atMs: event.atMs ?? null
      };
      break;
    case "KILL_SWITCH_RESET":
      state.killState = { level: "L0", active: false, reason: null, atMs: null };
      break;
    default:
      break;
  }
}

export function reduceRhizohEventLogV1(events) {
  const state = createEmptyReducedState();
  const frames = [];
  for (const event of events ?? []) {
    applyEvent(state, event);
    frames.push(
      Object.freeze({
        frameId: event.frameId ?? null,
        eventId: event.eventId ?? null,
        traceId: event.traceId ?? null,
        eventType: event.type ?? "UNKNOWN",
        reconstructedSnapshotHash: snapshotHashFromReducedState(state),
        reducedState: Object.freeze({
          contracts: state.contracts.size,
          tasks: state.tasks.map((t) => ({ ...t })),
          approvals: state.approvals.map((a) => ({ ...a })),
          memoryArtifacts: state.memoryArtifacts,
          proofRecords: state.proofRecords,
          killState: { ...state.killState }
        })
      })
    );
  }
  const finalFrame = frames.length ? frames[frames.length - 1] : null;
  return Object.freeze({
    reducerVersion: RHIZOH_STATE_REDUCER_VERSION,
    frameCount: frames.length,
    finalSnapshotHash: finalFrame?.reconstructedSnapshotHash ?? null,
    frames: Object.freeze(frames)
  });
}

