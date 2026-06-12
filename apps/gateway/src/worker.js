/**
 * Gateway LLM worker thread — heavy /rhizoh/llm turns off the main HTTP event loop.
 */
import { parentPort } from "node:worker_threads";
import { rhizohGatewayTurn } from "./rhizohGatewayTurn.js";

if (!parentPort) {
  throw new Error("llm_worker_requires_parent_port");
}

console.log("🔥 [GENESIS_BOOT] worker.js module loaded", { pid: process.pid });

parentPort.on("message", async (task) => {
  const id = String(task?.id || "");
  console.log("WORKER_RECEIVED_TASK:", { id, hasTurnInput: Boolean(task?.turnInput) });
  if (!id) return;

  try {
    const turnInput = task?.turnInput;
    if (!turnInput || typeof turnInput !== "object") {
      parentPort.postMessage({
        id,
        ok: false,
        error: "missing_turn_input",
        detail: "Worker task missing turnInput"
      });
      return;
    }

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
    parentPort.postMessage({
      id,
      ok: false,
      status: "failed",
      error: String(error?.code || error?.message || "llm_worker_failed"),
      detail: String(error?.message || error),
      code: error?.code || "",
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
