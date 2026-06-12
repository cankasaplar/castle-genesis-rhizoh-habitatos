/**
 * LLM worker runtime — queue + task store for /rhizoh/llm delegation.
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

import { buildLlmWorkerPostMessageV0 } from "./llmWorkerTurnSanitizeV0.js";
const TASK_POLL_MS = Math.max(100, Number(process.env.CASTLE_LLM_WORKER_POLL_MS || 400) || 400);

const WORKER_DIR = dirname(fileURLToPath(import.meta.url));
const WORKER_SCRIPT_BESIDE_RUNTIME = join(WORKER_DIR, "worker.js");

/** @type {Map<string, { status: string, createdAt: number, updatedAt: number, meta?: Record<string, unknown>, response?: unknown, httpStatus?: number }>} */
const tasks = new Map();

/** @type {Worker | null} */
let worker = null;

/** @type {string | null} */
let latestTaskId = null;

/** @type {string} */
let resolvedWorkerScriptPath = "";

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

/**
 * Render runs from /opt/render/project/src/apps/gateway — resolve worker.js with fallbacks.
 */
export function resolveLlmWorkerScriptPathV0() {
  const candidates = [
    WORKER_SCRIPT_BESIDE_RUNTIME,
    join(process.cwd(), "src", "worker.js"),
    join(process.cwd(), "apps", "gateway", "src", "worker.js")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return WORKER_SCRIPT_BESIDE_RUNTIME;
}

function cleanupExpiredTasksV0() {
  const now = Date.now();
  for (const [id, task] of tasks.entries()) {
    if (now - task.createdAt > TASK_TTL_MS) tasks.delete(id);
  }
}

function applyWorkerResultToTaskV0(id, msg) {
  let existing = tasks.get(id);
  if (!existing) {
    existing = {
      status: "processing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: {}
    };
    tasks.set(id, existing);
    console.warn("[llm-worker] task result arrived for untracked id; created entry", { id });
  }

  existing.updatedAt = Date.now();
  const clientError = String(msg.error || msg.code || "");
  const isClientError =
    clientError === "message_required" ||
    clientError === "missing_api_key" ||
    clientError === "server_llm_key_missing" ||
    clientError === "user_llm_connection_required";

  if (msg.ok) {
    existing.status = "completed";
    existing.httpStatus = 200;
    existing.response = {
      ok: true,
      status: "completed",
      ...msg.result,
      traceId: msg.traceId,
      turnLatencyMs: msg.turnLatencyMs,
      ...(msg.spinePhases ? { spinePhases: msg.spinePhases } : {}),
      ...(msg.sampledTrace !== undefined ? { sampledTrace: msg.sampledTrace } : {})
    };
    return;
  }

  existing.status = "failed";
  existing.httpStatus = isClientError ? 400 : 500;
  existing.response = {
    ok: false,
    status: "failed",
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
}

function ensureWorkerV0() {
  if (worker) return worker;

  resolvedWorkerScriptPath = resolveLlmWorkerScriptPathV0();
  const exists = existsSync(resolvedWorkerScriptPath);
  console.log("🔥 [GENESIS_BOOT] Internal worker spawning...", {
    workerPath: resolvedWorkerScriptPath,
    cwd: process.cwd(),
    exists
  });
  if (!exists) {
    throw new Error(`llm_worker_script_missing:${resolvedWorkerScriptPath}`);
  }

  worker = new Worker(resolvedWorkerScriptPath, { type: "module" });
  worker.on("message", (msg) => {
    const id = String(msg?.id || "");
    if (!id) return;

    console.log("[llm-worker] parent received result", {
      id,
      ok: msg.ok === true,
      status: msg.ok ? "completed" : "failed"
    });

    const waiter = pending.get(id);
    if (waiter) {
      pending.delete(id);
      const errMsg = String(msg.detail || msg.error || "llm_worker_failed");
      const errCode = String(msg.code || msg.error || "");
      if (msg.ok) waiter.resolve(msg);
      else {
        const err = Object.assign(new Error(errMsg), msg);
        if (!err.code && errCode) err.code = errCode;
        waiter.reject(err);
      }
    }

    applyWorkerResultToTaskV0(id, msg);
  });
  worker.on("error", (err) => {
    console.error("[llm-worker] thread error:", err);
    for (const [id, waiter] of pending.entries()) {
      waiter.reject(err);
      pending.delete(id);
    }
    worker?.terminate().catch(() => {});
    worker = null;
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error("[llm-worker] thread exit non-zero:", code);
      for (const [id, waiter] of pending.entries()) {
        waiter.reject(new Error(`llm_worker_exit_${code}`));
        pending.delete(id);
      }
    }
    worker = null;
  });

  console.log("🔥 [GENESIS_BOOT] Internal worker spawned.", { workerPath: resolvedWorkerScriptPath });
  return worker;
}

/**
 * Eager worker boot — call from server listen callback so Render logs show spawn status.
 */
export function initLlmWorkerAtBootV0() {
  if (!isLlmWorkerEnabledV0()) {
    console.log("[GENESIS_BOOT] LLM worker disabled (CASTLE_LLM_WORKER=0)");
    return { ok: false, reason: "disabled" };
  }
  ensureWorkerV0();
  return { ok: true, workerPath: resolvedWorkerScriptPath };
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
  latestTaskId = id;
  const w = ensureWorkerV0();
  const envelope = buildLlmWorkerPostMessageV0(id, turnInput);
  w.postMessage(envelope);
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

export function getLatestLlmWorkerTaskIdV0() {
  return latestTaskId;
}

export function getLlmWorkerDebugSnapshotV0() {
  return {
    latestTaskId,
    gatewayPid: process.pid,
    workerPath: resolvedWorkerScriptPath || resolveLlmWorkerScriptPathV0(),
    workerAlive: worker != null,
    taskCount: tasks.size,
    pendingCount: pending.size,
    asyncEnabled: isLlmWorkerAsyncEnabledV0()
  };
}

/**
 * @param {string} taskId
 */
export function getLlmWorkerTaskSnapshotV0(taskId) {
  cleanupExpiredTasksV0();
  const resolvedId =
    String(taskId || "").trim().toLowerCase() === "last"
      ? String(latestTaskId || "")
      : String(taskId || "");
  if (!resolvedId) return null;

  const task = tasks.get(resolvedId);
  if (!task) return null;

  const meta = task.meta || {};
  const base = {
    taskId: resolvedId,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };

  if (task.status === "processing") {
    return { ...base, httpStatus: 202 };
  }

  const body =
    task.response && typeof task.response === "object"
      ? { ...task.response }
      : { ok: false, error: "llm_task_empty", status: "failed" };
  if (meta.connectionId !== undefined) body.connectionId = meta.connectionId;
  if (meta.llmKeySourceUsed) body.llmKeySourceUsed = meta.llmKeySourceUsed;
  if (meta.langEcho && typeof meta.langEcho === "object") Object.assign(body, meta.langEcho);

  return {
    ...base,
    httpStatus: task.httpStatus || (task.status === "completed" ? 200 : 500),
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
  latestTaskId = null;
  if (worker) {
    void worker.terminate();
    worker = null;
  }
}
