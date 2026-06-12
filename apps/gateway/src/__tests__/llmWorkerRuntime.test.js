import assert from "node:assert/strict";
import test from "node:test";
import {
  getLlmWorkerTaskSnapshotV0,
  resolveLlmWorkerScriptPathV0
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
