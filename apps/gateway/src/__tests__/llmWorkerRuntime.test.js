import assert from "node:assert/strict";
import test from "node:test";
import { getLlmWorkerTaskSnapshotV0 } from "../llmWorkerRuntime.js";

test("llmWorkerRuntime returns null for unknown task id", () => {
  assert.equal(getLlmWorkerTaskSnapshotV0("missing-task-id"), null);
});
