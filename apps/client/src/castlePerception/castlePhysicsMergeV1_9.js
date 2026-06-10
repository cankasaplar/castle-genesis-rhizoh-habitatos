/**
 * Castle Physics Merge v1.9 — cognitive reconciliation (not overwrite).
 * Cloud is never truth source; merge resolves divergent device projections.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9.md
 */

import { MODALITY_V1_7, TIME_BUCKET_V1_7 } from "./castleStabilityMemoryGraphV1_7.js";

export const CASTLE_PHYSICS_MERGE_SCHEMA_V1_9 = "castle.physics_merge.v1.9";

const MERGE_EMA_BASE_V1_9 = 0.42;
const DRIFT_RING_MAX_V1_9 = 48;
const DRIFT_DECAY_MS_V1_9 = 14 * 24 * 60 * 60 * 1000;

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function num(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export function computeProfileConfidenceV1_9(profile = {}) {
  const observations = num(profile.observationCount, 0);
  const overrideRate = num(profile.contextSwitchLatencyProfile?.overrideRate, 0);
  const driftCount = Array.isArray(profile.driftEvents) ? profile.driftEvents.length : 0;
  const observationConf = clamp01(observations / 24);
  const stabilityConf = clamp01(1 - overrideRate * 0.35);
  const driftPenalty = clamp01(driftCount / 20) * 0.12;
  return Number(clamp01(observationConf * stabilityConf - driftPenalty).toFixed(4));
}

function weightPairV1_9(localConf, remoteConf) {
  const total = localConf + remoteConf || 1;
  return Object.freeze({
    local: localConf / total,
    remote: remoteConf / total
  });
}

export function weightedEMAV1_9(localMap, remoteMap, localConf, remoteConf) {
  const weights = weightPairV1_9(localConf, remoteConf);
  const keys = new Set([...Object.keys(localMap || {}), ...Object.keys(remoteMap || {})]);
  const next = Object.create(null);
  for (const key of keys) {
    const a = num(localMap?.[key], num(remoteMap?.[key], 0.5));
    const b = num(remoteMap?.[key], a);
    const rate = MERGE_EMA_BASE_V1_9 + Math.abs(a - b) * 0.18;
    next[key] = Number((a + (b - a) * rate * weights.remote).toFixed(4));
  }
  return Object.freeze(next);
}

export function conflictAwareBlendV1_9(localGraph, remoteGraph, localConf, remoteConf) {
  const next = Object.create(null);
  for (const modality of Object.values(MODALITY_V1_7)) {
    const a = localGraph?.[modality];
    const b = remoteGraph?.[modality];
    if (!a && !b) continue;
    if (!a) {
      next[modality] = Object.freeze({ ...b });
      continue;
    }
    if (!b) {
      next[modality] = Object.freeze({ ...a });
      continue;
    }
    const conflict =
      Math.abs(num(a.speechPriority) - num(b.speechPriority)) +
      Math.abs(num(a.phaseIndex) - num(b.phaseIndex));
    const conflictDamp = clamp01(conflict / 1.2);
    const localWeight = localConf / (localConf + remoteConf || 1);
    const remoteWeight = 1 - localWeight;
    const blendRate = 0.35 + conflictDamp * 0.25;
    const pick = (field) => {
      const av = num(a[field], 0.5);
      const bv = num(b[field], av);
      if (conflictDamp > 0.55) {
        return Number((av * localWeight + bv * remoteWeight).toFixed(4));
      }
      return Number((av + (bv - av) * blendRate * remoteWeight).toFixed(4));
    };
    next[modality] = Object.freeze({
      focusBias: pick("focusBias"),
      speechPriority: pick("speechPriority"),
      memoryPriority: pick("memoryPriority"),
      phaseIndex: pick("phaseIndex")
    });
  }
  return Object.freeze(next);
}

export function unionWithDecayV1_9(localEvents = [], remoteEvents = [], atMs = Date.now()) {
  const seen = new Set();
  const merged = [];
  for (const evt of [...(localEvents || []), ...(remoteEvents || [])]) {
    if (!evt) continue;
    const key = evt.id || `${evt.atMs}:${evt.modality}:${evt.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const ageMs = atMs - num(evt.atMs, atMs);
    const decay = ageMs > DRIFT_DECAY_MS_V1_9 ? 0.35 : 1;
    if (decay < 0.5) continue;
    merged.push(Object.freeze({ ...evt, mergeDecay: decay }));
  }
  merged.sort((x, y) => num(x.atMs) - num(y.atMs));
  return Object.freeze(merged.slice(-DRIFT_RING_MAX_V1_9));
}

export function mergePhysicsProfilesV1_9(localProfile = {}, remoteProfile = {}, options = {}) {
  const atMs = num(options.atMs, Date.now());
  const localConf = computeProfileConfidenceV1_9(localProfile);
  const remoteConf = computeProfileConfidenceV1_9(remoteProfile);
  const confidence = Number(Math.min(localConf, remoteConf).toFixed(4));

  const merged = Object.freeze({
    ...localProfile,
    stabilityPreferenceCurve: weightedEMAV1_9(
      localProfile.stabilityPreferenceCurve,
      remoteProfile.stabilityPreferenceCurve,
      localConf,
      remoteConf
    ),
    interruptionToleranceMap: weightedEMAV1_9(
      localProfile.interruptionToleranceMap,
      remoteProfile.interruptionToleranceMap,
      localConf,
      remoteConf
    ),
    modalityBiasGraph: conflictAwareBlendV1_9(
      localProfile.modalityBiasGraph,
      remoteProfile.modalityBiasGraph,
      localConf,
      remoteConf
    ),
    contextSwitchLatencyProfile: Object.freeze({
      meanMs: Math.round(
        num(localProfile.contextSwitchLatencyProfile?.meanMs, 4800) * localConf +
          num(remoteProfile.contextSwitchLatencyProfile?.meanMs, 4800) * remoteConf
      ),
      overrideRate: weightedEMAV1_9(
        localProfile.contextSwitchLatencyProfile || {},
        remoteProfile.contextSwitchLatencyProfile || {},
        localConf,
        remoteConf
      ).overrideRate ?? 0,
      sampleCount: Math.max(
        num(localProfile.contextSwitchLatencyProfile?.sampleCount, 0),
        num(remoteProfile.contextSwitchLatencyProfile?.sampleCount, 0)
      ),
      lastOverrideAtMs:
        Math.max(
          num(localProfile.contextSwitchLatencyProfile?.lastOverrideAtMs, 0),
          num(remoteProfile.contextSwitchLatencyProfile?.lastOverrideAtMs, 0)
        ) || null
    }),
    driftEvents: unionWithDecayV1_9(localProfile.driftEvents, remoteProfile.driftEvents, atMs),
    observationCount: Math.max(
      num(localProfile.observationCount, 0),
      num(remoteProfile.observationCount, 0)
    ),
    personalityPhysicsActive: true,
    lastActiveAtMs: atMs,
    mergeConfidence: confidence,
    lifecycleSchema: "castle.stability_physics_lifecycle.v1.9"
  });

  return Object.freeze({
    schema: CASTLE_PHYSICS_MERGE_SCHEMA_V1_9,
    profile: merged,
    confidence,
    localConfidence: localConf,
    remoteConfidence: remoteConf,
    reconciliation: "cognitive_merge_v1_9"
  });
}

/** Alias for spec naming */
export const mergePhysicsProfiles = mergePhysicsProfilesV1_9;

/** @internal vitest */
export function __resetPhysicsMergeForTestV1_9() {
  /* stateless */
}
