/**
 * SPECFLOW: RESEARCH-ONLY — Map YouTube (or any player) **analytics** into coherence feedback events.
 * YouTube = sensor: closes narrative loop **publish → metrics → kernel weight** via `YOUTUBE_METRICS`.
 */

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * @param {Record<string, unknown>|null|undefined} raw — viewVelocity01, averageViewDurationFrac (0–1 of video), commentSentiment01 (0–1)
 * @returns {{ kind: "YOUTUBE_METRICS", payload: Record<string, unknown> }}
 */
export function ingestYouTubeAnalyticsForCoherenceFeedbackV0(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const viewVelocity01 = clamp01(r.viewVelocity01);
  const retentionQuality01 = clamp01(r.averageViewDurationFrac ?? r.retentionQuality01 ?? 0.5);
  const commentSentiment01 = clamp01(r.commentSentiment01 ?? 0.5);
  const retentionDrop01 = clamp01(r.retentionDrop01 ?? 1 - retentionQuality01);
  const engagement01 = Math.round((0.32 * viewVelocity01 + 0.38 * retentionQuality01 + 0.3 * commentSentiment01) * 1000) / 1000;
  return {
    kind: "YOUTUBE_METRICS",
    payload: {
      engagement01,
      viewVelocity01,
      retentionQuality01,
      retentionDrop01,
      commentSentiment01
    }
  };
}
