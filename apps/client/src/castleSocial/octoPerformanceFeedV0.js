/**
 * OctoPerformanceFeedV0 — intensity signal abstraction only.
 * No audio input · no motion logic · no execution edges.
 * @see docs/OCTO_PRESENCE_FIELD_V1.md
 */

export const OCTO_PERFORMANCE_FEED_SCHEMA_V0 = "castle.octo_performance_feed.v0";

export const OCTO_PERFORMANCE_SIGNAL_KIND_V0 = Object.freeze({
  BEAT: "beat",
  CROWD_DENSITY: "crowd_density",
  ENGAGEMENT_PROXY: "engagement_proxy",
  EVENT_CLOCK: "event_clock"
});

/** Keys that must never appear on a performance feed payload (V1.1 guard). */
export const OCTO_PERFORMANCE_FEED_FORBIDDEN_KEYS_V0 = Object.freeze([
  "audio",
  "audioBuffer",
  "mediaStream",
  "microphone",
  "motion",
  "motionLogic",
  "routeCesium",
  "flyTo",
  "fieldState",
  "executorOp"
]);

/**
 * @param {Record<string, unknown>} input
 */
export function findOctoPerformanceFeedViolationsV0(input = {}) {
  const violations = [];
  for (const key of Object.keys(input)) {
    const lower = key.toLowerCase();
    if (OCTO_PERFORMANCE_FEED_FORBIDDEN_KEYS_V0.some((blocked) => lower.includes(blocked.toLowerCase()))) {
      violations.push(key);
    }
  }
  return Object.freeze(violations);
}

/**
 * @param {{
 *   sessionId: string,
 *   signalKind?: string,
 *   intensity?: number,
 *   beatPhase?: number,
 *   crowdDensity?: number,
 *   engagementProxy?: number,
 *   atMs?: number,
 *   correlationId?: string
 * }} input
 */
export function buildOctoPerformanceFeedV0(input) {
  const sessionId = String(input?.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({
      schema: OCTO_PERFORMANCE_FEED_SCHEMA_V0,
      ok: false,
      reason: "missing_session_id"
    });
  }

  const violations = findOctoPerformanceFeedViolationsV0(input);
  if (violations.length) {
    return Object.freeze({
      schema: OCTO_PERFORMANCE_FEED_SCHEMA_V0,
      ok: false,
      reason: "forbidden_feed_keys",
      violations
    });
  }

  const signalKind = String(input?.signalKind || OCTO_PERFORMANCE_SIGNAL_KIND_V0.ENGAGEMENT_PROXY);
  const normalizedKind = Object.values(OCTO_PERFORMANCE_SIGNAL_KIND_V0).includes(signalKind)
    ? signalKind
    : OCTO_PERFORMANCE_SIGNAL_KIND_V0.ENGAGEMENT_PROXY;

  const intensity = Math.min(1, Math.max(0, Number(input?.intensity) || 0));
  const beatPhase =
    input?.beatPhase === undefined ? null : Math.min(1, Math.max(0, Number(input.beatPhase) || 0));
  const crowdDensity =
    input?.crowdDensity === undefined
      ? null
      : Math.min(1, Math.max(0, Number(input.crowdDensity) || 0));
  const engagementProxy =
    input?.engagementProxy === undefined
      ? null
      : Math.min(1, Math.max(0, Number(input.engagementProxy) || 0));

  return Object.freeze({
    schema: OCTO_PERFORMANCE_FEED_SCHEMA_V0,
    ok: true,
    sessionId,
    signalKind: normalizedKind,
    intensity,
    beatPhase,
    crowdDensity,
    engagementProxy,
    atMs: Number(input?.atMs) || 0,
    correlationId: input?.correlationId ? String(input.correlationId) : null,
    causalClaim: false,
    readOnly: true
  });
}
