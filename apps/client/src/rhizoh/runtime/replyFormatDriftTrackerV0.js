/**
 * RESEARCH-ONLY observability — session-scoped LLM reply format drift (self-debug).
 * Does not influence execution; interpretation / health logs only.
 */

const EMA_ALPHA_V0 = 0.35;
const MAX_SAMPLES_V0 = 48;

/** @type {number | null} */
let replyFormatDriftRolling = null;
let sampleCount = 0;
/** @type {Record<string, unknown> | null} */
let lastTurn = null;
/** @type {number[]} */
const recentDrifts = [];

/**
 * @param {{
 *   replyFormatDriftScore?: number,
 *   replyParsingConfidence?: number,
 *   replyExtractPath?: string,
 *   observedFormat?: string,
 *   providerExpectedFormat?: string,
 *   traceId?: string
 * }} sample
 */
export function recordReplyFormatDriftSampleV0(sample = {}) {
  const drift = Number(sample.replyFormatDriftScore);
  if (!Number.isFinite(drift)) return getReplyFormatDriftRollingV0();

  sampleCount += 1;
  replyFormatDriftRolling =
    replyFormatDriftRolling == null
      ? drift
      : replyFormatDriftRolling * (1 - EMA_ALPHA_V0) + drift * EMA_ALPHA_V0;

  recentDrifts.push(drift);
  if (recentDrifts.length > MAX_SAMPLES_V0) recentDrifts.shift();

  lastTurn = Object.freeze({
    at: Date.now(),
    replyFormatDriftScore: drift,
    replyParsingConfidence: Number.isFinite(Number(sample.replyParsingConfidence))
      ? Number(sample.replyParsingConfidence)
      : null,
    replyExtractPath: sample.replyExtractPath ?? sample.observedFormat ?? null,
    providerExpectedFormat: sample.providerExpectedFormat ?? null,
    observedFormat: sample.observedFormat ?? null,
    traceId: sample.traceId ? String(sample.traceId).slice(0, 128) : null
  });

  return getReplyFormatDriftRollingV0();
}

export function getReplyFormatDriftRollingV0() {
  const windowMean =
    recentDrifts.length > 0
      ? recentDrifts.reduce((a, b) => a + b, 0) / recentDrifts.length
      : null;
  return Object.freeze({
    schema: "castle.rhizoh.reply_format_drift_rolling.v0",
    replyFormatDriftRolling:
      replyFormatDriftRolling != null ? Math.round(replyFormatDriftRolling * 1000) / 1000 : null,
    replyFormatDriftWindowMean:
      windowMean != null ? Math.round(windowMean * 1000) / 1000 : null,
    sampleCount,
    windowSize: recentDrifts.length,
    lastTurn
  });
}

export function resetReplyFormatDriftTrackerV0() {
  replyFormatDriftRolling = null;
  sampleCount = 0;
  lastTurn = null;
  recentDrifts.length = 0;
}
