import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeLlmWorkerTaskV0 } from "../llmWorkerTurnSanitizeV0.js";

test("sanitizeLlmWorkerTaskV0 maps turnInput.safePayload.message", () => {
  const out = sanitizeLlmWorkerTaskV0({
    id: "t1",
    turnInput: {
      safePayload: { message: "Merhaba Rhizoh" },
      keyMode: "env",
      auth: { ok: false }
    }
  });
  assert.equal(out.message, "Merhaba Rhizoh");
  assert.equal(out.turnInput.safePayload.message, "Merhaba Rhizoh");
});

test("sanitizeLlmWorkerTaskV0 maps alias text fields", () => {
  const out = sanitizeLlmWorkerTaskV0({
    id: "t2",
    text: "alias text field"
  });
  assert.equal(out.message, "alias text field");
  assert.equal(out.turnInput.safePayload.message, "alias text field");
});

test("sanitizeLlmWorkerTaskV0 maps input.text alias", () => {
  const out = sanitizeLlmWorkerTaskV0({
    id: "t3",
    input: { text: "nested input text" }
  });
  assert.equal(out.message, "nested input text");
});
