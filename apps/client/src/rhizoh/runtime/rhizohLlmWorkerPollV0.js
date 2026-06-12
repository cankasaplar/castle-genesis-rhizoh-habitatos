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

  while (Date.now() < deadline) {
    const res = await fetchFn(pollUrl, { method: "GET", headers });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 200 && data && typeof data === "object") {
      return Object.freeze({ ok: true, data, taskId, polled: true });
    }

    if (res.status === 202 || data?.status === "processing") {
      await sleepMs(pollIntervalMs);
      continue;
    }

    if (res.status >= 400) {
      return Object.freeze({
        ok: false,
        error: `rhizoh_llm_task_${res.status}`,
        taskId,
        gatewayError: data?.error,
        gatewayDetail: data?.detail,
        data
      });
    }

    await sleepMs(pollIntervalMs);
  }

  return Object.freeze({ ok: false, error: "rhizoh_llm_task_timeout", taskId });
}
