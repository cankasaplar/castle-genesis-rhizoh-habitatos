/**
 * SPECFLOW: RESEARCH-ONLY — **A3** Pull analytics snapshot from `youtube-publisher-bridge` and feed
 * `ingestYouTubeAnalyticsForCoherenceFeedbackV0` → `advanceCoherenceFeedbackStateV0` (coherence loop).
 */

/**
 * @param {string} baseUrl
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<Record<string, unknown>|null>}
 */
export async function fetchYoutubePublisherAnalyticsSnapshotV0(baseUrl, fetchImpl) {
  const fetchFn = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  const base = String(baseUrl || "").trim().replace(/\/$/, "");
  if (!base || !fetchFn) return null;
  try {
    const res = await fetchFn(`${base}/v0/analytics/latest`, { method: "GET" });
    if (!res.ok) return null;
    const j = await res.json();
    return j && typeof j === "object" ? /** @type {Record<string, unknown>} */ (j) : null;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>|null|undefined} snapshot — bridge JSON (numeric fields optional)
 * @returns {Record<string, unknown>|null} — payload suitable for `ingestYouTubeAnalyticsForCoherenceFeedbackV0`
 */
export function bridgeAnalyticsSnapshotToCoherenceIngestV0(snapshot) {
  const s = snapshot && typeof snapshot === "object" ? snapshot : null;
  if (!s) return null;
  return {
    viewVelocity01: s.viewVelocity01,
    averageViewDurationFrac: s.averageViewDurationFrac ?? s.retentionQuality01,
    retentionQuality01: s.retentionQuality01,
    commentSentiment01: s.commentSentiment01,
    retentionDrop01: s.retentionDrop01
  };
}

/**
 * @param {{
 *   baseUrl: string,
 *   fetchImpl?: typeof fetch,
 *   ingestYouTubeAnalyticsForCoherenceFeedbackV0: (raw: Record<string, unknown>|null|undefined) => { kind: string, payload: Record<string, unknown> },
 *   advanceCoherenceFeedbackStateV0: (...args: unknown[]) => { state: unknown, kernelHints: unknown },
 *   getFeedbackState: () => unknown,
 *   setFeedbackState: (s: unknown) => void,
 *   setFeedbackKernelHints: (h: unknown) => void,
 *   getGovernance: () => unknown
 * }} params
 * @returns {Promise<{ applied: boolean, event?: unknown }>}
 */
export async function pullYoutubePublisherAnalyticsIntoCoherenceFeedbackV0(params) {
  const p = params && typeof params === "object" ? params : {};
  const snap = await fetchYoutubePublisherAnalyticsSnapshotV0(String(p.baseUrl || ""), p.fetchImpl);
  const raw = bridgeAnalyticsSnapshotToCoherenceIngestV0(snap);
  if (!raw) return { applied: false };
  const ev = p.ingestYouTubeAnalyticsForCoherenceFeedbackV0(raw);
  const fbGov = p.getGovernance();
  const { state, kernelHints } = p.advanceCoherenceFeedbackStateV0(p.getFeedbackState(), ev, fbGov);
  p.setFeedbackState(state);
  p.setFeedbackKernelHints(kernelHints);
  return { applied: true, event: ev };
}
