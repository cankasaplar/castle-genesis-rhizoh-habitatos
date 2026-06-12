/**
 * Normalize gateway → worker LLM task shape (schema drift / alias fields).
 */

/**
 * @param {unknown} task
 */
export function sanitizeLlmWorkerTaskV0(task) {
  const id = String(task?.id || "");
  /** @type {Record<string, unknown>} */
  let turnInput =
    task?.turnInput && typeof task.turnInput === "object"
      ? { ...(task.turnInput) }
      : task?.input && typeof task.input === "object"
        ? { ...(task.input) }
        : {};

  /** @type {Record<string, unknown>} */
  let safePayload =
    turnInput.safePayload && typeof turnInput.safePayload === "object"
      ? { ...(turnInput.safePayload) }
      : turnInput.payload && typeof turnInput.payload === "object"
        ? { ...(turnInput.payload) }
        : task?.payload && typeof task.payload === "object"
          ? { ...(task.payload) }
          : {};

  const message = String(
    safePayload.message ||
      safePayload.text ||
      turnInput.message ||
      turnInput.text ||
      task?.message ||
      task?.text ||
      task?.input?.text ||
      task?.input?.message ||
      task?.payload?.text ||
      task?.payload?.message ||
      ""
  ).trim();

  if (message) {
    safePayload = { ...safePayload, message };
  }

  turnInput = {
    safePayload,
    auth:
      turnInput.auth && typeof turnInput.auth === "object"
        ? turnInput.auth
        : { ok: false },
    keyMode: turnInput.keyMode || "auto",
    conn: turnInput.conn && typeof turnInput.conn === "object" ? turnInput.conn : null,
    resolvedProvider: turnInput.resolvedProvider,
    resolvedModel: turnInput.resolvedModel,
    connApiKey: String(turnInput.connApiKey || "")
  };

  return { id, turnInput, message };
}

/**
 * @param {unknown} task
 */
export function buildLlmWorkerPostMessageV0(id, turnInput) {
  const sanitized = sanitizeLlmWorkerTaskV0({ id, turnInput });
  return {
    id: sanitized.id,
    turnInput: sanitized.turnInput,
    messagePreview: sanitized.message ? sanitized.message.slice(0, 80) : ""
  };
}
