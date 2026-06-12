/**
 * Poll async /rhizoh/llm worker tasks (HTTP 202 → GET /rhizoh/llm/task/:id).
 */

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveRhizohLlmTaskPollUrlV0(endpoint, pollPath, taskId) {
  const poll = String(pollPath || "").trim();
  if (poll.startsWith("http://") || poll.startsWith("https://")) return poll;
  const base = String(endpoint || "").trim().replace(/\/rhizoh\/llm\/?$/i, "");
  if (poll.startsWith("/")) return `${base}${poll}`;
  return `${base}/rhizoh/llm/task/${encodeURIComponent(String(taskId || ""))}`;
}

function isTerminalPollPayloadV0(data) {
  if (!data || typeof data !== "object") return false;
  if (data.terminal === true || data.pollLegacyHttp500 === true) return true;
  if (data.status === "completed" || data.status === "failed") return true;
  if (data.ok === true && data.reply != null) return true;
  if (data.ok === false && data.error) return true;
  return false;
}

function terminalPollResultV0(data, taskId, resStatus) {
  if (data.ok === false || data.status === "failed") {
    return Object.freeze({
      ok: false,
      error: String(data.error || data.detail || `rhizoh_llm_task_${resStatus}`),
      taskId,
      gatewayError: data.error,
      gatewayDetail: data.detail,
      reply: data.reply,
      data,
      polled: true
    });
  }
  return Object.freeze({ ok: true, data, taskId, polled: true });
}

function isTransientPollHttpStatusV0(status) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * @param {{
 *   endpoint: string,
 *   taskId: string,
 *   pollPath?: string,
 *   headers?: Record<string, string>,
 *   fetchImpl?: typeof fetch,
 *   maxWaitMs?: number,
 *   pollIntervalMs?: number
 * }} input
 */
export async function pollRhizohLlmWorkerTaskV0(input = {}) {
  const fetchFn = input.fetchImpl ?? fetch;
  const taskId = String(input.taskId || "").trim();
  if (!taskId) {
    return Object.freeze({ ok: false, error: "missing_task_id" });
  }

  const pollUrl = resolveRhizohLlmTaskPollUrlV0(input.endpoint, input.pollPath, taskId);
  const headers = input.headers && typeof input.headers === "object" ? { ...input.headers } : {};
  const maxWaitMs = Math.max(5_000, Number(input.maxWaitMs || 120_000) || 120_000);
  const pollIntervalMs = Math.max(150, Number(input.pollIntervalMs || 450) || 450);
  const deadline = Date.now() + maxWaitMs;
  let transientPollErrors = 0;

  while (Date.now() < deadline) {
    const res = await fetchFn(pollUrl, { method: "GET", headers });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 202 || data?.status === "processing") {
      await sleepMs(pollIntervalMs);
      continue;
    }

    if (res.status === 404) {
      return Object.freeze({
        ok: false,
        error: "rhizoh_llm_task_not_found",
        taskId,
        gatewayError: data?.error,
        gatewayDetail: data?.detail,
        data
      });
    }

    if ((res.status === 200 || res.status >= 500) && isTerminalPollPayloadV0(data)) {
      return terminalPollResultV0(data, taskId, res.status);
    }

    if (isTransientPollHttpStatusV0(res.status) && transientPollErrors < 6) {
      transientPollErrors += 1;
      await sleepMs(Math.min(2000, pollIntervalMs * transientPollErrors));
      continue;
    }

    if (res.status >= 400) {
      return Object.freeze({
        ok: false,
        error: `rhizoh_llm_task_${res.status}`,
        taskId,
        gatewayError: data?.error,
        gatewayDetail: data?.detail,
        reply: data?.reply,
        data,
        syncFallbackRecommended: res.status === 500 || res.status === 404
      });
    }

    await sleepMs(pollIntervalMs);
  }

  return Object.freeze({
    ok: false,
    error: "rhizoh_llm_task_timeout",
    taskId,
    syncFallbackRecommended: true
  });
}

/**
 * One-shot sync retry — bypass async 202 when poll path is broken on prod gateway.
 * @param {{ endpoint: string, fetchOpts: RequestInit, fetchImpl?: typeof fetch }} input
 */
export async function postRhizohLlmSyncFallbackV0(input = {}) {
  const fetchFn = input.fetchImpl ?? fetch;
  const endpoint = String(input.endpoint || "").trim();
  if (!endpoint) return Object.freeze({ ok: false, error: "missing_endpoint" });
  const baseHeaders =
    input.fetchOpts?.headers && typeof input.fetchOpts.headers === "object"
      ? { ...(input.fetchOpts.headers) }
      : {};
  const headers = { ...baseHeaders, "X-Rhizoh-Llm-Sync": "1" };
  const res = await fetchFn(endpoint, { ...(input.fetchOpts || {}), headers });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return Object.freeze({ ok: res.ok, status: res.status, data });
}
