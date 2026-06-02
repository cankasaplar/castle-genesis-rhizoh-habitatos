/**
 * STT temporal smoothing — adaptive window / EMA / spike threshold by environment (TV vs quiet room).
 * Speech is continuous; single-frame decisions are softened before sanity / script gates.
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  measureArabicScriptRatioV0,
  measureCyrillicScriptRatioV0,
  measureLatinScriptRatioV0
} from "./sttScriptLocaleGuardV0.js";
import { classifyVoiceDirectedSpeechBandV0 } from "./voiceDirectedSpeechObservationV0.js";
import {
  getSttTemporalFieldCalibrationV0,
  recordSttTemporalFieldTurnV0,
  resetSttTemporalFieldCalibrationV0
} from "./sttTemporalFieldCalibrationV0.js";

export const STT_TEMPORAL_SMOOTHING_SCHEMA_V0 = "castle.rhizoh.stt_temporal_smoothing.v0";

export const STT_SCRIPT_BUCKET_V0 = Object.freeze({
  LATIN_TR: "latin_tr",
  LATIN: "latin",
  ARABIC: "arabic",
  CYRILLIC: "cyrillic",
  MIXED: "mixed",
  EMPTY: "empty"
});

export const STT_TEMPORAL_PROFILE_ID_V0 = Object.freeze({
  QUIET: "quiet",
  NOISY: "noisy"
});

/** Quiet room — responsive, trusts recent speech. */
export const STT_TEMPORAL_PROFILE_QUIET_V0 = Object.freeze({
  id: STT_TEMPORAL_PROFILE_ID_V0.QUIET,
  windowSize: 3,
  emaAlpha: 0.42,
  spikeThreshold: 0.22,
  rawBlend: 0.35
});

/** TV / ambient — stable, spike-sensitive. */
export const STT_TEMPORAL_PROFILE_NOISY_V0 = Object.freeze({
  id: STT_TEMPORAL_PROFILE_ID_V0.NOISY,
  windowSize: 7,
  emaAlpha: 0.25,
  spikeThreshold: 0.18,
  rawBlend: 0.28
});

const WINDOW_DEFAULT_V0 = 5;
const WINDOW_MIN_V0 = 3;
const WINDOW_MAX_V0 = 7;
const FRAME_TTL_MS_V0 = 12_000;
const MIN_FRAMES_FOR_SPIKE_SUPPRESS_V0 = 2;
const SCRIPT_COHERENCE_MIN_V0 = 0.55;
const NOISE_SCORE_ENTER_V0 = 3;
const NOISE_SCORE_EXIT_V0 = 2;
const NOISY_ENTER_STREAK_V0 = 1;
const QUIET_EXIT_STREAK_V0 = 2;

/** @type {Array<object>} */
let frameBuffer = [];
/** @type {string} */
let activeProfileId = STT_TEMPORAL_PROFILE_ID_V0.QUIET;
let noisyStreak = 0;
let quietStreak = 0;

function isAdaptiveTemporalEnabledV0() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_STT_TEMPORAL_ADAPTIVE ?? "1").trim();
    return raw !== "0" && raw.toLowerCase() !== "false";
  } catch {
    return true;
  }
}

function readFixedWindowSizeV0() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_STT_TEMPORAL_WINDOW || "").trim();
    const n = Number(raw);
    if (Number.isFinite(n) && n >= WINDOW_MIN_V0 && n <= WINDOW_MAX_V0) return Math.floor(n);
  } catch {
    /* noop */
  }
  return WINDOW_DEFAULT_V0;
}

/**
 * @param {string} id
 */
export function resolveSttTemporalProfileByIdV0(id) {
  return id === STT_TEMPORAL_PROFILE_ID_V0.NOISY
    ? STT_TEMPORAL_PROFILE_NOISY_V0
    : STT_TEMPORAL_PROFILE_QUIET_V0;
}

/**
 * @param {Array<object>} frames
 */
function bufferNoiseSignalsV0(frames) {
  const reasons = [];
  let score = 0;

  const buckets = new Set(
    frames.map((f) => f.scriptBucket).filter((b) => b && b !== STT_SCRIPT_BUCKET_V0.EMPTY)
  );
  if (buckets.size >= 3) {
    score += 1;
    reasons.push("script_bucket_chaos");
  }

  const hasArabic = frames.some((f) => f.scriptBucket === STT_SCRIPT_BUCKET_V0.ARABIC);
  const hasLatinTr = frames.some((f) => f.scriptBucket === STT_SCRIPT_BUCKET_V0.LATIN_TR);
  if (hasArabic && hasLatinTr) {
    score += 2;
    reasons.push("arabic_latin_mix");
  }

  const rmsVals = frames
    .map((f) => Number(f.maxRms))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (rmsVals.length) {
    const sorted = [...rmsVals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median >= 0.032) {
      score += 1;
      reasons.push("elevated_median_rms");
    }
  }

  const confVals = frames
    .map((f) => Number(f.confidence))
    .filter((n) => Number.isFinite(n));
  if (confVals.length >= 3) {
    const spread = Math.max(...confVals) - Math.min(...confVals);
    if (spread >= 0.25) {
      score += 1;
      reasons.push("confidence_swing");
    }
  }

  return { score, reasons };
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   maxRms?: number,
 *   source?: string,
 *   band?: string,
 *   ambientScore?: number,
 *   noiseDetectedHigh?: boolean
 * }} meta
 * @param {Array<object>} frames
 */
export function detectSttTemporalNoiseV0(meta = {}, frames = frameBuffer) {
  const reasons = [];
  let score = 0;

  if (meta.noiseDetectedHigh === true) {
    return Object.freeze({ noiseDetectedHigh: true, score: 99, reasons: ["explicit_high_noise"] });
  }

  if (String(meta.band || "") === "ambient") {
    score += 2;
    reasons.push("ambient_band");
  }
  if (Number(meta.ambientScore) >= 2) {
    score += 2;
    reasons.push("ambient_score_ge_2");
  }

  const rms = Number(meta.maxRms);
  if (Number.isFinite(rms) && rms >= 0.038) {
    score += 1;
    reasons.push("frame_rms_high");
  }

  const buf = bufferNoiseSignalsV0(frames);
  score += buf.score;
  reasons.push(...buf.reasons);

  if (!meta.band && !meta.ambientScore && String(meta.text || "").trim()) {
    try {
      const obs = classifyVoiceDirectedSpeechBandV0({
        text: meta.text,
        confidence: meta.confidence,
        maxRms: meta.maxRms,
        source: meta.source
      });
      if (obs.band === "ambient") {
        score += 2;
        reasons.push("classifier_ambient_band");
      }
      if (obs.ambientScore >= 2) {
        score += 1;
        reasons.push("classifier_ambient_score");
      }
    } catch {
      /* noop */
    }
  }

  const cal = getSttTemporalFieldCalibrationV0();
  const noiseEnter = cal.enabled ? cal.noiseScoreEnter : NOISE_SCORE_ENTER_V0;

  return Object.freeze({
    noiseDetectedHigh: score >= noiseEnter,
    score,
    noiseScoreEnter: noiseEnter,
    fieldCalibration: cal.enabled ? cal : null,
    reasons: Object.freeze([...new Set(reasons)])
  });
}

/**
 * @param {{
 *   band?: string,
 *   ambientScore?: number,
 *   maxRms?: number,
 *   text?: string,
 *   confidence?: number,
 *   source?: string,
 *   noiseDetectedHigh?: boolean
 * }} meta
 * @param {Array<object>} [frames]
 */
export function resolveSttTemporalProfileV0(meta = {}, frames = frameBuffer) {
  if (!isAdaptiveTemporalEnabledV0()) {
    const windowSize = readFixedWindowSizeV0();
    return Object.freeze({
      ...STT_TEMPORAL_PROFILE_QUIET_V0,
      id: "fixed",
      windowSize,
      emaAlpha: 0.38,
      spikeThreshold: 0.22,
      rawBlend: 0.35,
      adaptive: false,
      noiseDetectedHigh: false,
      noiseScore: 0,
      noiseReasons: Object.freeze([])
    });
  }

  const noise = detectSttTemporalNoiseV0(meta, frames);

  if (noise.noiseDetectedHigh) {
    noisyStreak += 1;
    quietStreak = 0;
  } else if (noise.score < NOISE_SCORE_EXIT_V0) {
    quietStreak += 1;
    noisyStreak = 0;
  } else {
    quietStreak = 0;
    noisyStreak = 0;
  }

  if (
    activeProfileId === STT_TEMPORAL_PROFILE_ID_V0.QUIET &&
    (noise.noiseDetectedHigh || noisyStreak >= NOISY_ENTER_STREAK_V0)
  ) {
    activeProfileId = STT_TEMPORAL_PROFILE_ID_V0.NOISY;
  } else if (
    activeProfileId === STT_TEMPORAL_PROFILE_ID_V0.NOISY &&
    quietStreak >= QUIET_EXIT_STREAK_V0
  ) {
    activeProfileId = STT_TEMPORAL_PROFILE_ID_V0.QUIET;
  }

  const base = resolveSttTemporalProfileByIdV0(activeProfileId);
  const cal = getSttTemporalFieldCalibrationV0();
  const spikeThreshold =
    cal.enabled && Number.isFinite(Number(cal.spikeThresholdQuiet))
      ? activeProfileId === STT_TEMPORAL_PROFILE_ID_V0.NOISY
        ? cal.spikeThresholdNoisy
        : cal.spikeThresholdQuiet
      : base.spikeThreshold;

  return Object.freeze({
    ...base,
    spikeThreshold,
    adaptive: true,
    noiseDetectedHigh: noise.noiseDetectedHigh,
    noiseScore: noise.score,
    noiseReasons: noise.reasons,
    fieldCalibration: cal.enabled ? cal : null
  });
}

/**
 * @param {string} text
 */
export function classifySttScriptBucketV0(text) {
  const raw = String(text || "").trim();
  if (!raw) return STT_SCRIPT_BUCKET_V0.EMPTY;

  const arabic = measureArabicScriptRatioV0(raw);
  const cyrillic = measureCyrillicScriptRatioV0(raw);
  const latin = measureLatinScriptRatioV0(raw);

  if (arabic >= 0.35) return STT_SCRIPT_BUCKET_V0.ARABIC;
  if (cyrillic >= 0.35) return STT_SCRIPT_BUCKET_V0.CYRILLIC;
  if (latin >= 0.4 && /[ğüşıöçĞÜŞİÖÇ]|\b(merhaba|nasıl|rhizoh|harita|tamam|evet|hayır)\b/iu.test(raw)) {
    return STT_SCRIPT_BUCKET_V0.LATIN_TR;
  }
  if (latin >= 0.4) return STT_SCRIPT_BUCKET_V0.LATIN;
  return STT_SCRIPT_BUCKET_V0.MIXED;
}

/**
 * @param {Array<{ confidence?: number, isSpike?: boolean }>} frames
 * @param {number} emaAlpha
 */
function rollingConfidenceV0(frames, emaAlpha) {
  const vals = frames
    .filter((f) => !f.isSpike && Number.isFinite(Number(f.confidence)))
    .map((f) => Number(f.confidence));
  if (!vals.length) return null;
  if (vals.length === 1) return vals[0];
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  let ema = mid;
  for (const v of vals) {
    ema = emaAlpha * v + (1 - emaAlpha) * ema;
  }
  return Number(Math.min(1, Math.max(0, ema)).toFixed(3));
}

/**
 * @param {Array<{ scriptBucket: string, isFinal?: boolean, isSpike?: boolean }>} frames
 */
function majorityScriptBucketV0(frames) {
  const votes = new Map();
  let total = 0;
  for (const f of frames) {
    if (f.isSpike) continue;
    const b = f.scriptBucket || STT_SCRIPT_BUCKET_V0.MIXED;
    if (b === STT_SCRIPT_BUCKET_V0.EMPTY) continue;
    const w = f.isFinal ? 1.5 : 1;
    votes.set(b, (votes.get(b) || 0) + w);
    total += w;
  }
  if (!total) return { bucket: STT_SCRIPT_BUCKET_V0.MIXED, coherence: 0 };
  let best = STT_SCRIPT_BUCKET_V0.MIXED;
  let bestW = 0;
  for (const [b, w] of votes) {
    if (w > bestW) {
      bestW = w;
      best = b;
    }
  }
  return { bucket: best, coherence: Number((bestW / total).toFixed(3)) };
}

/**
 * @param {object} frame
 * @param {number} rollingConf
 * @param {string} majorityBucket
 * @param {number} spikeThreshold
 */
function markSpikeFrameV0(frame, rollingConf, majorityBucket, spikeThreshold) {
  const conf = Number(frame.confidence);
  const text = String(frame.text || "");
  const len = text.trim().length;
  const bucket = frame.scriptBucket;

  const confSpike =
    Number.isFinite(conf) &&
    Number.isFinite(rollingConf) &&
    conf > rollingConf + spikeThreshold;

  const scriptSpike =
    majorityBucket &&
    majorityBucket !== STT_SCRIPT_BUCKET_V0.MIXED &&
    bucket !== majorityBucket &&
    (bucket === STT_SCRIPT_BUCKET_V0.ARABIC || bucket === STT_SCRIPT_BUCKET_V0.CYRILLIC) &&
    len <= 48;

  const rmsSpike =
    Number.isFinite(Number(frame.maxRms)) &&
    Number(frame.maxRms) < 0.018 &&
    len < 6 &&
    confSpike;

  return confSpike && (scriptSpike || rmsSpike || len < 5);
}

/**
 * @param {number} windowSize
 * @param {number} [nowMs]
 */
function pruneFrameBufferV0(windowSize, nowMs = Date.now()) {
  frameBuffer = frameBuffer.filter((f) => nowMs - f.atMs <= FRAME_TTL_MS_V0);
  while (frameBuffer.length > windowSize) {
    frameBuffer.shift();
  }
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   maxRms?: number,
 *   source?: string,
 *   isFinal?: boolean,
 *   band?: string,
 *   ambientScore?: number,
 *   noiseDetectedHigh?: boolean
 * }} meta
 */
export function ingestSttTemporalFrameV0(meta = {}) {
  const text = String(meta.text || "").trim();
  const atMs = Date.now();
  const profile = resolveSttTemporalProfileV0(meta, frameBuffer);
  pruneFrameBufferV0(profile.windowSize, atMs);

  const frame = Object.freeze({
    text,
    confidence: Number.isFinite(Number(meta.confidence)) ? Number(meta.confidence) : null,
    maxRms: Number.isFinite(Number(meta.maxRms)) ? Number(meta.maxRms) : null,
    source: String(meta.source || ""),
    isFinal: meta.isFinal !== false,
    scriptBucket: classifySttScriptBucketV0(text),
    band: meta.band || null,
    ambientScore: Number.isFinite(Number(meta.ambientScore)) ? Number(meta.ambientScore) : null,
    atMs
  });

  frameBuffer.push(frame);
  pruneFrameBufferV0(profile.windowSize, atMs);
  return recomputeSttTemporalAggregateV0(meta);
}

/**
 * @param {{
 *   band?: string,
 *   ambientScore?: number,
 *   maxRms?: number,
 *   text?: string,
 *   confidence?: number,
 *   source?: string,
 *   noiseDetectedHigh?: boolean
 * }} [meta]
 * @param {boolean} [includeLatestSpikeCheck]
 */
export function recomputeSttTemporalAggregateV0(meta = {}, includeLatestSpikeCheck = true) {
  const profile = resolveSttTemporalProfileV0(meta, frameBuffer);
  const frames = frameBuffer.slice(-profile.windowSize);
  const frameCount = frames.length;

  let rollingConf = rollingConfidenceV0(frames, profile.emaAlpha);
  const { bucket: majorityScript, coherence: scriptCoherence } = majorityScriptBucketV0(frames);

  const tagged = frames.map((f) => ({
    ...f,
    isSpike: markSpikeFrameV0(f, rollingConf, majorityScript, profile.spikeThreshold)
  }));

  frameBuffer = tagged;
  rollingConf = rollingConfidenceV0(tagged, profile.emaAlpha);

  const latest = tagged[tagged.length - 1] || null;
  const latestIsSpike = includeLatestSpikeCheck && latest?.isSpike === true;

  const suppress =
    latestIsSpike &&
    frameCount >= MIN_FRAMES_FOR_SPIKE_SUPPRESS_V0 &&
    scriptCoherence >= SCRIPT_COHERENCE_MIN_V0;

  const ready = frameCount >= WINDOW_MIN_V0;

  return Object.freeze({
    schema: STT_TEMPORAL_SMOOTHING_SCHEMA_V0,
    ready,
    suppress,
    smoothedConfidence: rollingConf,
    majorityScript,
    scriptCoherence,
    frameCount,
    windowSize: profile.windowSize,
    profileId: profile.id,
    profile,
    latestIsSpike: latestIsSpike === true,
    spikeFrameCount: tagged.filter((f) => f.isSpike).length,
    noiseDetectedHigh: profile.noiseDetectedHigh === true,
    noiseScore: profile.noiseScore,
    noiseReasons: profile.noiseReasons
  });
}

/**
 * @param {string} text
 * @param {ReturnType<typeof recomputeSttTemporalAggregateV0>} aggregate
 */
export function isTemporalScriptOutlierV0(text, aggregate) {
  if (!aggregate || aggregate.frameCount < 2) return false;
  if (aggregate.scriptCoherence < SCRIPT_COHERENCE_MIN_V0) return false;
  const bucket = classifySttScriptBucketV0(text);
  const majority = aggregate.majorityScript;
  if (majority === STT_SCRIPT_BUCKET_V0.LATIN_TR || majority === STT_SCRIPT_BUCKET_V0.LATIN) {
    return bucket === STT_SCRIPT_BUCKET_V0.ARABIC || bucket === STT_SCRIPT_BUCKET_V0.CYRILLIC;
  }
  return false;
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   maxRms?: number,
 *   source?: string,
 *   isFinal?: boolean,
 *   stage?: string,
 *   band?: string,
 *   ambientScore?: number,
 *   noiseDetectedHigh?: boolean
 * }} meta
 */
export function applySttTemporalSmoothingV0(meta = {}) {
  const aggregate = ingestSttTemporalFrameV0(meta);
  const text = String(meta.text || "").trim();
  const scriptOutlier = isTemporalScriptOutlierV0(text, aggregate);
  const rawBlend = aggregate.profile?.rawBlend ?? 0.35;

  const suppress = aggregate.suppress || (meta.isFinal !== false && scriptOutlier && aggregate.ready);

  const rawConf = Number(meta.confidence);
  const smoothed = aggregate.smoothedConfidence;
  const effectiveConfidence =
    Number.isFinite(smoothed) && aggregate.frameCount >= 1
      ? Number.isFinite(rawConf)
        ? Number(
            Math.min(1, Math.max(0, rawConf * rawBlend + smoothed * (1 - rawBlend))).toFixed(3)
          )
        : smoothed
      : Number.isFinite(rawConf)
        ? rawConf
        : undefined;

  const entry = Object.freeze({
    ...aggregate,
    suppress,
    scriptOutlier,
    effectiveConfidence,
    rawConfidence: Number.isFinite(rawConf) ? rawConf : null,
    fieldCalibration: aggregate.profile?.fieldCalibration || null
  });

  if (meta.isFinal !== false) {
    const fieldCal = recordSttTemporalFieldTurnV0({
      noiseScore: entry.noiseScore,
      profileId: entry.profileId,
      suppress: entry.suppress,
      scriptCoherence: entry.scriptCoherence,
      spikeThreshold: entry.profile?.spikeThreshold,
      source: meta.source
    });

    logVoiceInfoV0("STT_TEMPORAL", {
      stage: meta.stage || "",
      source: meta.source || "",
      profileId: entry.profileId,
      windowSize: entry.windowSize,
      emaAlpha: entry.profile?.emaAlpha,
      spikeThreshold: entry.profile?.spikeThreshold,
      fieldCalibration: fieldCal.enabled ? fieldCal : null,
      noiseDetectedHigh: entry.noiseDetectedHigh,
      noiseScore: entry.noiseScore,
      frameCount: entry.frameCount,
      smoothedConfidence: entry.smoothedConfidence,
      effectiveConfidence: entry.effectiveConfidence,
      majorityScript: entry.majorityScript,
      scriptCoherence: entry.scriptCoherence,
      suppress: entry.suppress,
      scriptOutlier: entry.scriptOutlier,
      preview: text.slice(0, 64)
    });
    if (suppress) {
      logVoiceWarnV0("STT_TEMPORAL_SUPPRESS", {
        reason: scriptOutlier ? "script_outlier" : "noise_spike",
        profileId: entry.profileId,
        majorityScript: entry.majorityScript,
        preview: text.slice(0, 64)
      });
    }
  }

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_STT_TEMPORAL__ = entry;
  }

  return entry;
}

/** Per-turn frame window only — keeps field calibration ring (last 20 turns). */
export function resetSttTemporalFrameBufferV0() {
  frameBuffer = [];
  activeProfileId = STT_TEMPORAL_PROFILE_ID_V0.QUIET;
  noisyStreak = 0;
  quietStreak = 0;
}

/** Full STT session reset (mic start) — frames + field telemetry. */
export function resetSttTemporalSmoothingV0() {
  resetSttTemporalFrameBufferV0();
  resetSttTemporalFieldCalibrationV0();
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_STT_TEMPORAL__;
    } catch {
      /* noop */
    }
  }
}

/** @internal vitest */
export function __getSttTemporalFrameBufferForTestV0() {
  return frameBuffer.slice();
}

/** @internal vitest */
export function __resetSttTemporalSmoothingForTestV0() {
  resetSttTemporalSmoothingV0();
}

/** @internal vitest */
export function __setSttTemporalActiveProfileForTestV0(id) {
  activeProfileId =
    id === STT_TEMPORAL_PROFILE_ID_V0.NOISY
      ? STT_TEMPORAL_PROFILE_ID_V0.NOISY
      : STT_TEMPORAL_PROFILE_ID_V0.QUIET;
}
