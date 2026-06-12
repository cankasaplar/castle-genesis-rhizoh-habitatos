/**
 * Gateway LLM worker thread — heavy /rhizoh/llm turns off the main HTTP event loop.
 */
import { parentPort } from "node:worker_threads";
import { sanitizeLlmWorkerTaskV0 } from "./llmWorkerTurnSanitizeV0.js";
import { rhizohGatewayTurn } from "./rhizohGatewayTurn.js";

if (!parentPort) {
  throw new Error("llm_worker_requires_parent_port");
}

console.log("🔥 [GENESIS_BOOT] worker.js module loaded", { pid: process.pid });

parentPort.on("message", async (task) => {
  let rawLog = "";
  try {
    rawLog = JSON.stringify(task);
  } catch {
    rawLog = String(task);
  }
  console.log("WORKER_RAW_TASK_RECEIVED:", rawLog.slice(0, 4000));

  const { id, turnInput, message } = sanitizeLlmWorkerTaskV0(task);
  console.log("WORKER_SANITIZED_TASK:", {
    id,
    hasMessage: Boolean(message),
    messagePreview: message ? message.slice(0, 80) : "",
    keyMode: turnInput?.keyMode
  });

  if (!id) return;

  if (!message) {
    console.error("WORKER_FATAL: No message/text found in task payload");
    parentPort.postMessage({
      id,
      ok: false,
      status: "failed",
      error: "message_required",
      code: "message_required",
      detail: "message_required",
      reply: "Mesaj metni gerekli (message veya text alanı boş).",
      directive: "NONE"
    });
    return;
  }

  try {
    const { result, traceId, turnLatencyMs, spinePhases, sampledTrace } = await rhizohGatewayTurn(turnInput);
    parentPort.postMessage({
      id,
      ok: true,
      status: "completed",
      result,
      traceId,
      turnLatencyMs,
      spinePhases,
      sampledTrace
    });
  } catch (error) {
    const code = String(error?.code || error?.message || "llm_worker_failed");
    parentPort.postMessage({
      id,
      ok: false,
      status: "failed",
      error: code,
      code,
      detail: String(error?.message || error),
      reply: error?.reply || "",
      directive: error?.directive || "NONE",
      stressClass: error?.stressClass,
      responseAction: error?.responseAction,
      stressMatrix: error?.stressMatrix,
      stressInterpretable: error?.stressInterpretable,
      stressConfidence: error?.stressConfidence,
      actionConfidence: error?.actionConfidence,
      actionSoftened: error?.actionSoftened,
      responseActionStrict: error?.responseActionStrict,
      actionInterpretable: error?.actionInterpretable,
      conflictResolution: error?.conflictResolution,
      stressSecondary: error?.stressSecondary,
      responseActions: error?.responseActions,
      containment: error?.containment === true,
      rhizohFailureKind: error?.rhizohFailureKind
    });
  }
});
