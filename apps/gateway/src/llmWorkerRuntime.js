/**
 * LLM worker runtime — queue + task store for /rhizoh/llm delegation.
 */
import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";

const TASK_TTL_MS = Math.max(60_000, Number(process.env.CASTLE_LLM_WORKER_TASK_TTL_MS || 15 * 60_000) || 15 * 60_000);
const TASK_POLL_MS = Math.max(100, Number(process.env.CASTLE_LLM_WORKER_POLL_MS || 400) || 400);

/** @type {Map<string, { status: string, createdAt: number, updatedAt: number, response?: unknown, httpStatus?: number }>} */
const tasks = new Map();

/** @type {Worker | null} */
let worker = null;

/** @type {Map<string, { resolve: Function, reject: Function }>} */
const pending = new Map();

function envTruthy(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return defaultValue;
  const v = String(raw).trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off" || v === "no") return false;
  return true;
}

export function isLlmWorkerEnabledV0() {
  return envTruthy("CASTLE_LLM_WORKER", true);
}

export function isLlmWorkerAsyncEnabledV0() {
  return envTruthy("CASTLE_LLM_WORKER_ASYNC", false);
}

function cleanupExpiredTasksV0() {
  const now = Date.now();
  for (const [id, task] of tasks.entries()) {
    if (now - task.createdAt > TASK_TTL_MS) tasks.delete(id);
  }
}

function ensureWorkerV0() {
  if (worker) return worker;
  worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  worker.on("message", (msg) => {
    const id = String(msg?.id || "");
    if (!id) return;

    const waiter = pending.get(id);
    if (waiter) {
      pending.delete(id);
      if (msg.ok) waiter.resolve(msg);
      else waiter.reject(Object.assign(new Error(String(msg.detail || msg.error || "llm_worker_failed")), msg));
    }

    const existing = tasks.get(id);
    if (!existing) return;

    existing.updatedAt = Date.now();
    if (msg.ok) {
      existing.status = "done";
      existing.httpStatus = 200;
      existing.response = {
        ok: true,
        ...msg.result,
        traceId: msg.traceId,
        turnLatencyMs: msg.turnLatencyMs,
        ...(msg.spinePhases ? { spinePhases: msg.spinePhases } : {}),
        ...(msg.sampledTrace !== undefined ? { sampledTrace: msg.sampledTrace } : {})
      };
      return;
    }

    existing.status = "failed";
    existing.httpStatus = 500;
    existing.response = {
      ok: false,
      error: msg.error || "llm_worker_failed",
      detail: msg.detail,
      reply: msg.reply || "Rhizoh bağlantısı geçici olarak kesildi.",
      directive: msg.directive || "NONE",
      code: msg.code || "",
      stressClass: msg.stressClass,
      responseAction: msg.responseAction,
      stressMatrix: msg.stressMatrix,
      stressInterpretable: msg.stressInterpretable,
      stressConfidence: msg.stressConfidence,
      actionConfidence: msg.actionConfidence,
      actionSoftened: msg.actionSoftened,
      responseActionStrict: msg.responseActionStrict,
      actionInterpretable: msg.actionInterpretable,
      conflictResolution: msg.conflictResolution,
      stressSecondary: msg.stressSecondary,
      responseActions: msg.responseActions,
      rhizohFailureKind: msg.rhizohFailureKind
    };
  });
  worker.on("error", (err) => {
    for (const [id, waiter] of pending.entries()) {
      waiter.reject(err);
      pending.delete(id);
    }
    worker?.terminate().catch(() => {});
    worker = null;
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      for (const [id, waiter] of pending.entries()) {
        waiter.reject(new Error(`llm_worker_exit_${code}`));
        pending.delete(id);
      }
    }
    worker = null;
  });
  return worker;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} turnInput
 * @param {{ connectionId?: string | null, llmKeySourceUsed?: string, langEcho?: Record<string, unknown> }} meta
 */
function dispatchLlmWorkerTaskV0(id, turnInput, meta = {}) {
  cleanupExpiredTasksV0();
  tasks.set(id, {
    status: "processing",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    meta
  });
  ensureWorkerV0().postMessage({ id, turnInput });
}

/**
 * Run turn in worker thread and await completion (sync API contract — HTTP 200).
 * @param {Record<string, unknown>} turnInput
 * @param {{ connectionId?: string | null, llmKeySourceUsed?: string, langEcho?: Record<string, unknown> }} meta
 */
export function runLlmWorkerTaskV0(turnInput, meta = {}) {
  const id = randomUUID();
  return new Promise((resolve, reject) => {
    pending.set(id, {
      resolve: (msg) => {
        resolve({
          result: msg.result,
          traceId: msg.traceId,
          turnLatencyMs: msg.turnLatencyMs,
          spinePhases: msg.spinePhases,
          sampledTrace: msg.sampledTrace,
          taskId: id
        });
      },
      reject
    });
    dispatchLlmWorkerTaskV0(id, turnInput, meta);
  });
}

/**
 * Queue turn and return task id immediately (HTTP 202 + poll).
 * @param {Record<string, unknown>} turnInput
 * @param {{ connectionId?: string | null, llmKeySourceUsed?: string, langEcho?: Record<string, unknown> }} meta
 */
export function enqueueLlmWorkerTaskAsyncV0(turnInput, meta = {}) {
  const id = randomUUID();
  dispatchLlmWorkerTaskV0(id, turnInput, meta);
  return id;
}

/**
 * @param {string} taskId
 */
export function getLlmWorkerTaskSnapshotV0(taskId) {
  cleanupExpiredTasksV0();
  const task = tasks.get(String(taskId || ""));
  if (!task) return null;

  const meta = task.meta || {};
  const base = {
    taskId: String(taskId),
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };

  if (task.status === "processing") {
    return { ...base, httpStatus: 202 };
  }

  const body = task.response && typeof task.response === "object" ? { ...task.response } : { ok: false, error: "llm_task_empty" };
  if (meta.connectionId !== undefined) body.connectionId = meta.connectionId;
  if (meta.llmKeySourceUsed) body.llmKeySourceUsed = meta.llmKeySourceUsed;
  if (meta.langEcho && typeof meta.langEcho === "object") Object.assign(body, meta.langEcho);

  return {
    ...base,
    httpStatus: task.httpStatus || (task.status === "done" ? 200 : 500),
    body
  };
}

export function getLlmWorkerPollIntervalMsV0() {
  return TASK_POLL_MS;
}

export function shutdownLlmWorkerV0() {
  for (const [id, waiter] of pending.entries()) {
    waiter.reject(new Error("llm_worker_shutdown"));
    pending.delete(id);
  }
  tasks.clear();
  if (worker) {
    void worker.terminate();
    worker = null;
  }
}
