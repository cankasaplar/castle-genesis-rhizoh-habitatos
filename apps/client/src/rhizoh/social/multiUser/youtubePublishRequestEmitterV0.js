/**
 * SPECFLOW: RESEARCH-ONLY — **A2** App → `publishRequest` emitter toward `youtube-publisher-bridge`
 * (`POST /v0/publish-requests`). Throttled; driven by distributor `youtubePipelineHint` + diff pressure.
 */

export const YOUTUBE_PUBLISH_REQUEST_SCHEMA_V0 = "castle.rhizoh.youtube_publish_request.v0";

/**
 * @param {Record<string, unknown>|null|undefined} distributor — `distributeGlobalCoherenceKernelOutputV0` result
 * @param {number} nowMs
 * @param {number} lastEmitAtMs
 * @param {{ minIntervalMs?: number, minPublishScore?: number }|null} [opts]
 */
export function shouldEmitYoutubePublishRequestV0(distributor, nowMs, lastEmitAtMs, opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const minGap = Math.max(4000, Number(o.minIntervalMs) || 90_000);
  if (nowMs - lastEmitAtMs < minGap) return false;
  const d = distributor && typeof distributor === "object" ? distributor : null;
  if (!d) return false;
  const dirty = !!(d.networkDiff && typeof d.networkDiff === "object" && d.networkDiff.dirty);
  const y = d.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  if (!y) return false;
  const pr = Number(y.publishRecommendationScore);
  const minScore = Number(o.minPublishScore);
  const threshold = Number.isFinite(minScore) ? minScore : 0.52;
  if (!Number.isFinite(pr)) return false;
  if (dirty && pr >= Math.max(0.35, threshold - 0.12)) return true;
  return pr >= threshold;
}

/**
 * @param {Record<string, unknown>|null|undefined} bridgeOut — `runGlobalSocialCoherenceKernelTickV0` result
 * @param {Record<string, unknown>|null|undefined} distributor
 * @param {Record<string, unknown>|null|undefined} [narrativeEpisode] — `resolveNarrativeEpisodeForPublishV0` çıktısı
 */
export function buildYoutubePublishRequestEnvelopeV0(bridgeOut, distributor, narrativeEpisode) {
  const b = bridgeOut && typeof bridgeOut === "object" ? bridgeOut : {};
  const d = distributor && typeof distributor === "object" ? distributor : {};
  const gm = b.globalMerge && typeof b.globalMerge === "object" ? b.globalMerge : null;
  const k = b.kernel && typeof b.kernel === "object" ? b.kernel : null;
  /** @type {Record<string, unknown>} */
  const out = {
    schema: YOUTUBE_PUBLISH_REQUEST_SCHEMA_V0,
    ts: Date.now(),
    kernelFrame: k != null && Number.isFinite(Number(k.frame)) ? Number(k.frame) : null,
    globalSourcesCount: gm != null && Array.isArray(gm.sources) ? gm.sources.length : 0,
    youtubePipelineHint: d.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null,
    studioEvent: d.studioEvent && typeof d.studioEvent === "object" ? d.studioEvent : null,
    networkDiff: d.networkDiff && typeof d.networkDiff === "object" ? d.networkDiff : null,
    lineage: d.lineage && typeof d.lineage === "object" ? d.lineage : null
  };
  const ne = narrativeEpisode && typeof narrativeEpisode === "object" ? narrativeEpisode : null;
  if (ne) out.narrativeEpisode = ne;
  return out;
}

/**
 * @param {string} baseUrl — e.g. `http://127.0.0.1:8791`
 * @param {Record<string, unknown>} envelope
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ ok: boolean, skipped?: boolean, status?: number, error?: string }>}
 */
export async function postYoutubePublishRequestV0(baseUrl, envelope, fetchImpl) {
  const fetchFn = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  const base = String(baseUrl || "").trim().replace(/\/$/, "");
  if (!base || !fetchFn) return { ok: false, skipped: true };
  try {
    const res = await fetchFn(`${base}/v0/publish-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope)
    });
    if (!res.ok) return { ok: false, status: res.status, error: await res.text().catch(() => "") };
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
