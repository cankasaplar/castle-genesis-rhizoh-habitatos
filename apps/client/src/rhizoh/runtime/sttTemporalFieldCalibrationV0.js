/**
 * Field telemetry calibration — last N voice turns → median noise / spike tuning.
 */

export const STT_TEMPORAL_FIELD_CALIBRATION_SCHEMA_V0 =
  "castle.rhizoh.stt_temporal_field_calibration.v0";

const TURN_RING_MAX_V0 = 20;
const MIN_SAMPLES_FOR_CALIBRATION_V0 = 6;

const NOISE_ENTER_MIN_V0 = 2;
const NOISE_ENTER_MAX_V0 = 5;
const NOISE_ENTER_DEFAULT_V0 = 3;

const SPIKE_QUIET_MIN_V0 = 0.16;
const SPIKE_QUIET_MAX_V0 = 0.28;
const SPIKE_NOISY_MIN_V0 = 0.14;
const SPIKE_NOISY_MAX_V0 = 0.24;

/** @type {Array<object>} */
let turnRing = [];

function isFieldCalibrationEnabledV0() {
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_STT_TEMPORAL_CALIBRATION ?? "1").trim();
    return raw !== "0" && raw.toLowerCase() !== "false";
  } catch {
    return true;
  }
}

/**
 * @param {number[]} vals
 */
function medianOfV0(vals) {
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clampV0(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {number} medianNoise
 * @param {number} suppressRate
 */
function deriveNoiseScoreEnterV0(medianNoise, suppressRate) {
  let enter = NOISE_ENTER_DEFAULT_V0;
  if (medianNoise >= 4) enter -= 1;
  else if (medianNoise <= 1.5) enter += 1;
  if (suppressRate > 0.35) enter -= 0.5;
  if (suppressRate < 0.05 && medianNoise <= 2) enter += 0.5;
  return Math.round(clampV0(enter, NOISE_ENTER_MIN_V0, NOISE_ENTER_MAX_V0));
}

/**
 * @param {number} medianNoise
 * @param {number} suppressRate
 * @param {number} base
 * @param {number} min
 * @param {number} max
 */
function deriveSpikeThresholdV0(medianNoise, suppressRate, base, min, max) {
  let t = base;
  if (medianNoise >= 3.5) t -= 0.02;
  if (medianNoise <= 1.5) t += 0.02;
  if (suppressRate > 0.3) t -= 0.02;
  if (suppressRate < 0.08) t += 0.01;
  return Number(clampV0(t, min, max).toFixed(3));
}

/**
 * @returns {{
 *   enabled: boolean,
 *   sampleCount: number,
 *   noiseScoreEnter: number,
 *   spikeThresholdQuiet: number,
 *   spikeThresholdNoisy: number,
 *   medianNoiseScore: number | null,
 *   suppressRate: number | null
 * }}
 */
export function getSttTemporalFieldCalibrationV0() {
  if (!isFieldCalibrationEnabledV0() || turnRing.length < MIN_SAMPLES_FOR_CALIBRATION_V0) {
    return Object.freeze({
      schema: STT_TEMPORAL_FIELD_CALIBRATION_SCHEMA_V0,
      enabled: false,
      sampleCount: turnRing.length,
      noiseScoreEnter: NOISE_ENTER_DEFAULT_V0,
      spikeThresholdQuiet: null,
      spikeThresholdNoisy: null,
      medianNoiseScore: null,
      suppressRate: null
    });
  }

  const noiseScores = turnRing.map((t) => Number(t.noiseScore)).filter((n) => Number.isFinite(n));
  const medianNoise = medianOfV0(noiseScores);
  const suppressRate = turnRing.filter((t) => t.suppress === true).length / turnRing.length;

  const noiseScoreEnter = deriveNoiseScoreEnterV0(medianNoise, suppressRate);
  const spikeThresholdQuiet = deriveSpikeThresholdV0(
    medianNoise,
    suppressRate,
    0.22,
    SPIKE_QUIET_MIN_V0,
    SPIKE_QUIET_MAX_V0
  );
  const spikeThresholdNoisy = deriveSpikeThresholdV0(
    medianNoise,
    suppressRate,
    0.18,
    SPIKE_NOISY_MIN_V0,
    SPIKE_NOISY_MAX_V0
  );

  const cal = Object.freeze({
    schema: STT_TEMPORAL_FIELD_CALIBRATION_SCHEMA_V0,
    enabled: true,
    sampleCount: turnRing.length,
    noiseScoreEnter,
    spikeThresholdQuiet,
    spikeThresholdNoisy,
    medianNoiseScore: Number.isFinite(medianNoise) ? Number(medianNoise.toFixed(2)) : null,
    suppressRate: Number(suppressRate.toFixed(3))
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_STT_TEMPORAL_CALIBRATION__ = cal;
  }

  return cal;
}

/**
 * @param {{
 *   noiseScore?: number,
 *   profileId?: string,
 *   suppress?: boolean,
 *   scriptCoherence?: number,
 *   spikeThreshold?: number,
 *   source?: string
 * }} sample
 */
export function recordSttTemporalFieldTurnV0(sample = {}) {
  if (!isFieldCalibrationEnabledV0()) return getSttTemporalFieldCalibrationV0();

  turnRing.push(
    Object.freeze({
      atMs: Date.now(),
      noiseScore: Number.isFinite(Number(sample.noiseScore)) ? Number(sample.noiseScore) : 0,
      profileId: String(sample.profileId || ""),
      suppress: sample.suppress === true,
      scriptCoherence: Number.isFinite(Number(sample.scriptCoherence))
        ? Number(sample.scriptCoherence)
        : null,
      spikeThreshold: Number.isFinite(Number(sample.spikeThreshold))
        ? Number(sample.spikeThreshold)
        : null,
      source: String(sample.source || "")
    })
  );
  while (turnRing.length > TURN_RING_MAX_V0) {
    turnRing.shift();
  }
  return getSttTemporalFieldCalibrationV0();
}

export function resetSttTemporalFieldCalibrationV0() {
  turnRing = [];
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_STT_TEMPORAL_CALIBRATION__;
    } catch {
      /* noop */
    }
  }
}

/** @internal vitest */
export function __resetSttTemporalFieldCalibrationForTestV0() {
  resetSttTemporalFieldCalibrationV0();
}

/** @internal vitest */
export function __getSttTemporalFieldTurnRingForTestV0() {
  return turnRing.slice();
}
