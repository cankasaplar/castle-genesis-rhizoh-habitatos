import assert from "node:assert/strict";
import test from "node:test";
import {
  enqueueLlmWorkerTaskAsyncV0,
  getLlmWorkerTaskSnapshotV0,
  resolveLlmWorkerScriptPathV0,
  shutdownLlmWorkerV0
} from "../llmWorkerRuntime.js";
import { existsSync } from "node:fs";

test("llmWorkerRuntime returns null for unknown task id", () => {
  assert.equal(getLlmWorkerTaskSnapshotV0("missing-task-id"), null);
});

test("llmWorkerRuntime resolves worker.js beside runtime module", () => {
  const path = resolveLlmWorkerScriptPathV0();
  assert.ok(path.endsWith("worker.js"));
  assert.equal(existsSync(path), true);
});

test("llmWorkerRuntime task cleanup does not throw TASK_TTL_MS ReferenceError", () => {
  const prevWorker = process.env.CASTLE_LLM_WORKER;
  process.env.CASTLE_LLM_WORKER = "0";
  try {
    const taskId = enqueueLlmWorkerTaskAsyncV0(
      { safePayload: { message: "ping" }, auth: { ok: false }, keyMode: "auto" },
      {}
    );
    assert.ok(taskId);
    assert.doesNotThrow(() => getLlmWorkerTaskSnapshotV0(taskId));
  } finally {
    shutdownLlmWorkerV0();
    if (prevWorker == null) delete process.env.CASTLE_LLM_WORKER;
    else process.env.CASTLE_LLM_WORKER = prevWorker;
  }
});
