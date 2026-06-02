/**
 * Voice Environment Profile Memory (VEPM) v0.1 — behavioral regulator override layer.
 * Pipeline: field calibration → temporal profile → VEPM override → final thresholds.
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { STT_TEMPORAL_PROFILE_ID_V0 } from "./sttTemporalSmoothingV0.js";
import {
  clearVoiceEnvProfilesFromIdbV0,
  readVoiceEnvProfileFromIdbV0,
  writeVoiceEnvProfileToIdbV0
} from "./voiceEnvironmentProfileIdbV0.js";

export const VOICE_ENV_PROFILE_MEMORY_SCHEMA_V0 = "castle.rhizoh.voice_env_profile_memory.v0";

const BOOTSTRAP_TURNS_V0 = 3;
const PROFILE_DECAY_HALF_LIFE_MS_V0 = 7 * 24 * 60 * 60 * 1000;
const DRIFT_ROOM_DISTANCE_V0 = 2;
const MIN_CONFIDENCE_FOR_FULL_OVERRIDE_V0 = 0.55;

/** @type {Map<string, object>} */
const memoryStore = new Map();

/** @type {{
 *   profileKey: string,
 *   profile: object,
 *   sessionTurns: number,
 *   driftMode: boolean,
 *   fingerprint: object
 * } | null} */
let activeSession = null;

/** @type {boolean | null} */
let vepmForceEnabledForTest = null;

function isVepmEnabledV0() {
  if (vepmForceEnabledForTest !== null) return vepmForceEnabledForTest;
  try {
    const raw = String(import.meta.env?.VITE_RHIZOH_VOICE_ENV_PROFILE ?? "0").trim();
    return raw === "1" || raw.toLowerCase() === "true";
  } catch {
    return false;
  }
}

function clampV0(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function lerpV0(a, b, t) {
  return a + (b - a) * clampV0(t, 0, 1);
}

/**
 * @param {string} s
 */
function hashStringV0(s) {
  let h = 2166136261;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * @param {{
 *   maxRms?: number,
 *   profileId?: string,
 *   scriptCoherence?: number,
 *   majorityScript?: string
 * }} [turn]
 */
export function buildVoiceEnvironmentRoomHintV0(turn = {}) {
  const rms = Number(turn.maxRms);
  const rmsBucket = Number.isFinite(rms) ? Math.min(5, Math.floor(rms * 120)) : 0;
  const pid = String(turn.profileId || "");
  const noisyRateBucket = pid === STT_TEMPORAL_PROFILE_ID_V0.NOISY ? 2 : pid === STT_TEMPORAL_PROFILE_ID_V0.QUIET ? 0 : 1;
  const coh = Number(turn.scriptCoherence);
  const scriptEntropyBucket = coh >= 0.8 ? 0 : coh >= 0.55 ? 1 : 2;
  const majority = String(turn.majorityScript || "mixed").slice(0, 12);
  return Object.freeze({ rmsBucket, noisyRateBucket, scriptEntropyBucket, majority });
}

/**
 * @param {ReturnType<typeof buildVoiceEnvironmentRoomHintV0>} a
 * @param {ReturnType<typeof buildVoiceEnvironmentRoomHintV0>} b
 */
export function measureRoomHintDistanceV0(a, b) {
  if (!a || !b) return 0;
  return (
    Math.abs(a.rmsBucket - b.rmsBucket) +
    Math.abs(a.noisyRateBucket - b.noisyRateBucket) +
    Math.abs(a.scriptEntropyBucket - b.scriptEntropyBucket)
  );
}

/**
 * @param {{
 *   userId?: string,
 *   micDeviceId?: string,
 *   roomHint?: ReturnType<typeof buildVoiceEnvironmentRoomHintV0>
 * }} ctx
 */
export function buildVoiceEnvironmentFingerprintV0(ctx = {}) {
  const userId = String(ctx.userId || "anon").slice(0, 64);
  const micHash = hashStringV0(String(ctx.micDeviceId || "default-mic"));
  const room = ctx.roomHint || buildVoiceEnvironmentRoomHintV0({});
  const profileKey = hashStringV0(
    `${userId}|${micHash}|${room.rmsBucket}:${room.noisyRateBucket}:${room.scriptEntropyBucket}`
  );
  return Object.freeze({
    userId,
    micHash,
    roomHint: room,
    profileKey
  });
}

/**
 * @param {object} profile
 * @param {number} [nowMs]
 */
function applyProfileTimeDecayV0(profile, nowMs = Date.now()) {
  const last = Number(profile.lastUpdatedAtMs) || nowMs;
  const ageMs = Math.max(0, nowMs - last);
  const decay = Math.pow(0.5, ageMs / PROFILE_DECAY_HALF_LIFE_MS_V0);
  const confidence = clampV0(Number(profile.confidence || 0.5) * (0.85 + 0.15 * decay), 0.15, 1);
  return { ...profile, confidence: Number(confidence.toFixed(3)), decayFactor: Number(decay.toFixed(3)) };
}

function createEmptyProfileV0(fingerprint) {
  return Object.freeze({
    schema: VOICE_ENV_PROFILE_MEMORY_SCHEMA_V0,
    profileKey: fingerprint.profileKey,
    fingerprint,
    preferredProfileId: STT_TEMPORAL_PROFILE_ID_V0.QUIET,
    noiseScoreEnter: 3,
    spikeThresholdQuiet: 0.22,
    spikeThresholdNoisy: 0.18,
    windowSize: 3,
    emaAlpha: 0.42,
    medianNoiseScore: 2,
    suppressRate: 0.1,
    scriptEntropy: 0.2,
    sampleCount: 0,
    confidence: 0.35,
    lastUpdatedAtMs: Date.now(),
    lastRoomHint: fingerprint.roomHint
  });
}

/**
 * @param {object} profile
 * @param {object} sample
 * @param {number} weight
 */
function updateProfileFromTurnV0(profile, sample, weight) {
  const w = clampV0(weight, 0.05, 1);
  const noisy = String(sample.profileId) === STT_TEMPORAL_PROFILE_ID_V0.NOISY;
  const noisyVotes = (profile.noisyVoteEma || 0) * (1 - w) + (noisy ? 1 : 0) * w;

  const next = {
    ...profile,
    medianNoiseScore: lerpV0(Number(profile.medianNoiseScore) || 2, Number(sample.noiseScore) || 0, w),
    suppressRate: lerpV0(Number(profile.suppressRate) || 0, sample.suppress ? 1 : 0, w),
    scriptEntropy: lerpV0(
      Number(profile.scriptEntropy) || 0.3,
      1 - (Number(sample.scriptCoherence) || 0.5),
      w
    ),
    noisyVoteEma: noisyVotes,
    preferredProfileId:
      noisyVotes >= 0.55 ? STT_TEMPORAL_PROFILE_ID_V0.NOISY : STT_TEMPORAL_PROFILE_ID_V0.QUIET,
    noiseScoreEnter: Math.round(
      clampV0(
        lerpV0(profile.noiseScoreEnter, sample.noiseScore >= 4 ? 2 : sample.noiseScore <= 1.5 ? 4 : 3, w),
        2,
        5
      )
    ),
    spikeThresholdQuiet: Number(
      lerpV0(profile.spikeThresholdQuiet, sample.suppress ? 0.17 : 0.23, w * 0.5).toFixed(3)
    ),
    spikeThresholdNoisy: Number(
      lerpV0(profile.spikeThresholdNoisy, sample.suppress ? 0.16 : 0.19, w * 0.5).toFixed(3)
    ),
    windowSize: noisyVotes >= 0.55 ? 7 : 3,
    emaAlpha: noisyVotes >= 0.55 ? 0.25 : 0.42,
    sampleCount: (Number(profile.sampleCount) || 0) + 1,
    confidence: clampV0(
      (Number(profile.confidence) || 0.35) + (sample.suppress ? -0.02 : 0.04) * w,
      0.2,
      0.95
    ),
    lastUpdatedAtMs: Date.now(),
    lastRoomHint: sample.roomHint || profile.lastRoomHint
  };
  return next;
}

/**
 * @param {{
 *   userId?: string,
 *   micDeviceId?: string,
 *   roomHint?: object
 * }} ctx
 */
export async function primeVoiceEnvironmentProfileV0(ctx = {}) {
  if (!isVepmEnabledV0()) return null;

  const fingerprint = buildVoiceEnvironmentFingerprintV0(ctx);
  let stored = memoryStore.get(fingerprint.profileKey) || null;
  if (!stored && typeof indexedDB !== "undefined") {
    try {
      stored = await readVoiceEnvProfileFromIdbV0(fingerprint.profileKey);
      if (stored) memoryStore.set(fingerprint.profileKey, stored);
    } catch {
      /* noop */
    }
  }

  const profile = applyProfileTimeDecayV0(stored || createEmptyProfileV0(fingerprint));
  const roomDistance = measureRoomHintDistanceV0(profile.lastRoomHint, fingerprint.roomHint);
  const driftMode = roomDistance >= DRIFT_ROOM_DISTANCE_V0 && profile.sampleCount >= 4;

  activeSession = {
    profileKey: fingerprint.profileKey,
    profile,
    sessionTurns: 0,
    driftMode,
    fingerprint
  };

  if (driftMode) {
    logVoiceWarnV0("VEPM_DRIFT_DETECTED", {
      profileKey: fingerprint.profileKey,
      roomDistance,
      confidence: profile.confidence
    });
  }

  logVoiceInfoV0("VEPM_PRIME", {
    profileKey: fingerprint.profileKey,
    preferredProfileId: profile.preferredProfileId,
    confidence: profile.confidence,
    driftMode,
    sampleCount: profile.sampleCount
  });

  publishVepmSnapshotV0();
  return profile;
}

/**
 * @returns {number}
 */
function sessionOverrideWeightV0() {
  if (!activeSession) return 0;
  const turns = activeSession.sessionTurns;
  const conf = Number(activeSession.profile?.confidence) || 0;
  const driftPenalty = activeSession.driftMode ? 0.45 : 1;
  if (turns < BOOTSTRAP_TURNS_V0) {
    return ((0.2 + (turns / BOOTSTRAP_TURNS_V0) * 0.35) * conf * driftPenalty);
  }
  return clampV0(conf * driftPenalty, 0, 1);
}

/**
 * Behavioral regulator — overrides calibration + temporal after both ran.
 * @param {{
 *   fieldCalibration?: object,
 *   temporalProfile?: object,
 *   noiseScore?: number
 * }} ctx
 */
export function applyVoiceEnvironmentThresholdOverrideV0(ctx = {}) {
  if (!isVepmEnabledV0() || !activeSession?.profile) {
    return Object.freeze({
      enabled: false,
      source: "vepm_off",
      overrideWeight: 0
    });
  }

  const fieldCal = ctx.fieldCalibration || {};
  const temporal = ctx.temporalProfile || {};
  const profile = activeSession.profile;
  const w = sessionOverrideWeightV0();
  const pid =
    temporal.id && temporal.id !== "fixed"
      ? temporal.id
      : profile.preferredProfileId || STT_TEMPORAL_PROFILE_ID_V0.QUIET;

  const baseNoiseEnter = fieldCal.enabled
    ? fieldCal.noiseScoreEnter
    : Number(profile.noiseScoreEnter) || 3;
  const baseSpikeQuiet = fieldCal.enabled
    ? fieldCal.spikeThresholdQuiet
    : temporal.spikeThreshold || 0.22;
  const baseSpikeNoisy = fieldCal.enabled ? fieldCal.spikeThresholdNoisy : 0.18;

  const override = Object.freeze({
    enabled: w > 0.05,
    source: "vepm_regulator",
    overrideWeight: Number(w.toFixed(3)),
    bootstrapTurn: activeSession.sessionTurns,
    driftMode: activeSession.driftMode === true,
    profileConfidence: profile.confidence,
    preferredProfileId: profile.preferredProfileId,
    profileKey: activeSession.profileKey,
    noiseScoreEnter: Math.round(lerpV0(baseNoiseEnter, profile.noiseScoreEnter, w)),
    spikeThresholdQuiet: Number(lerpV0(baseSpikeQuiet, profile.spikeThresholdQuiet, w).toFixed(3)),
    spikeThresholdNoisy: Number(lerpV0(baseSpikeNoisy, profile.spikeThresholdNoisy, w).toFixed(3)),
    windowSize: Math.round(lerpV0(temporal.windowSize || 5, profile.windowSize, w)),
    emaAlpha: Number(lerpV0(temporal.emaAlpha || 0.38, profile.emaAlpha, w).toFixed(3)),
    activeProfileId:
      w >= MIN_CONFIDENCE_FOR_FULL_OVERRIDE_V0 && !activeSession.driftMode
        ? profile.preferredProfileId
        : pid
  });

  return override;
}

/**
 * @param {{
 *   noiseScore?: number,
 *   profileId?: string,
 *   suppress?: boolean,
 *   scriptCoherence?: number,
 *   majorityScript?: string,
 *   maxRms?: number,
 *   fieldCalibration?: object
 * }} sample
 */
export async function recordVoiceEnvironmentTurnV0(sample = {}) {
  if (!isVepmEnabledV0()) return null;

  const roomHint = buildVoiceEnvironmentRoomHintV0(sample);
  if (!activeSession) {
    await primeVoiceEnvironmentProfileV0({
      userId: sample.userId,
      micDeviceId: sample.micDeviceId,
      roomHint
    });
  }
  if (!activeSession) return null;

  activeSession.sessionTurns += 1;
  const w =
    activeSession.sessionTurns <= BOOTSTRAP_TURNS_V0
      ? 0.35 + activeSession.sessionTurns * 0.15
      : 0.65;

  const updated = updateProfileFromTurnV0(activeSession.profile, { ...sample, roomHint }, w);
  activeSession.profile = updated;
  memoryStore.set(activeSession.profileKey, updated);

  try {
    await writeVoiceEnvProfileToIdbV0(updated);
  } catch {
    /* noop */
  }

  const driftNow =
    measureRoomHintDistanceV0(updated.lastRoomHint, roomHint) >= DRIFT_ROOM_DISTANCE_V0;
  if (driftNow && !activeSession.driftMode && activeSession.sessionTurns > BOOTSTRAP_TURNS_V0) {
    activeSession.driftMode = true;
    activeSession.sessionTurns = 0;
    logVoiceWarnV0("VEPM_DRIFT_REBOOTSTRAP", { profileKey: activeSession.profileKey });
  }

  publishVepmSnapshotV0();
  return updated;
}

function publishVepmSnapshotV0() {
  if (typeof window === "undefined") return;
  const regulator = applyVoiceEnvironmentThresholdOverrideV0({
    fieldCalibration: typeof window.__CASTLE_RHIZOH_STT_TEMPORAL_CALIBRATION__ === "object"
      ? window.__CASTLE_RHIZOH_STT_TEMPORAL_CALIBRATION__
      : null,
    temporalProfile:
      typeof window.__CASTLE_RHIZOH_STT_TEMPORAL__ === "object"
        ? window.__CASTLE_RHIZOH_STT_TEMPORAL__?.profile
        : null
  });
  if (isVepmEnabledV0()) {
    window.resetCastleRhizohVoiceEnvProfileV0 = () => resetVoiceEnvironmentProfilesV0();
  }
  window.__CASTLE_RHIZOH_VOICE_ENV_PROFILE__ = Object.freeze({
    schema: VOICE_ENV_PROFILE_MEMORY_SCHEMA_V0,
    enabled: isVepmEnabledV0(),
    session: activeSession
      ? Object.freeze({
          profileKey: activeSession.profileKey,
          sessionTurns: activeSession.sessionTurns,
          driftMode: activeSession.driftMode,
          profile: activeSession.profile
        })
      : null,
    regulator
  });
}

export async function resetVoiceEnvironmentProfilesV0() {
  activeSession = null;
  memoryStore.clear();
  try {
    await clearVoiceEnvProfilesFromIdbV0();
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_VOICE_ENV_PROFILE__;
    } catch {
      /* noop */
    }
  }
}

export function getActiveVoiceEnvironmentSessionV0() {
  return activeSession;
}

/** @internal vitest */
export function __resetVoiceEnvironmentMemoryForTestV0() {
  activeSession = null;
  memoryStore.clear();
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_VOICE_ENV_PROFILE__;
    } catch {
      /* noop */
    }
  }
}

/** @internal vitest */
export function __setVepmEnabledForTestV0(enabled) {
  vepmForceEnabledForTest = enabled === true;
}
