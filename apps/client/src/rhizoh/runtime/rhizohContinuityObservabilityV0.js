/**
 * Continuity observability v0 — non-invasive telemetry (no execution feedback).
 * User felt presence proxy · CIS drift heatmap · first contact success rate.
 * @see docs/RHIZOH_CONTINUITY_OBSERVABILITY_V0.md
 */

import {
  CIS_PRODUCT_GATE_THRESHOLD_V0,
  sampleContinuityIntegrityScoreV0
} from "./rhizohContinuityIntegrityScoreV0.js";
import {
  getContinuitySessionOriginMsV0,
  getFirst3sCoherenceStabilityIndexV0,
  markContinuitySessionOriginV0,
  recordFirst3sCoherenceSampleV0
} from "./rhizohFirst3sCoherenceStabilityV0.js";

export const CONTINUITY_OBSERVABILITY_SCHEMA_V0 = "castle.rhizoh.continuity_observability.v0";

export const RHIZOH_CONTINUITY_OBSERVABILITY_EVENT_V0 = "rhizoh:continuity-observability-v0";

const RING_MAX_V0 = 64;
const FIRST_CONTACT_WINDOW_MS_V0 = 10_000;

/** @type {Array<ReturnType<typeof buildObservabilitySnapshotV0>>} */
const ring = [];

let firstContactRecorded = false;
let firstContactSuccess = false;
let voiceEntryAttempts = 0;
let voiceEntryDeferred = 0;
let sessionOriginMarked = false;

/** @type {ReturnType<typeof buildObservabilitySnapshotV0> | null} */
let lastSnapshot = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {Record<string, number>} heat
 * @param {string} key
 */
function bumpHeatmapV0(heat, key) {
  heat[key] = (heat[key] || 0) + 1;
}

/**
 * @param {ReturnType<typeof sampleContinuityIntegrityScoreV0>} cis
 * @param {{
 *   fieldState?: string,
 *   voiceReady?: boolean,
 *   voiceAdapterReady?: boolean,
 *   uiShowsListening?: boolean,
 *   voiceEntryDeferred?: boolean
 * }} ctx
 */
function deriveUserFeltPresenceScore01(cis, ctx = {}) {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const firstPaint = rh.continuityFirstPaint;
  const tdg = rh.temporalDriftGuard;
  const zeroLive = rh.continuityFirstPaint?.ok && !rh._lastZeroFrameFallback;

  let score = 0;
  if (firstPaint?.ok) score += 0.28;
  score += clamp01(cis?.cis01) * 0.3;
  if (tdg?.phase_coherence_ok !== false) score += 0.18;
  if (cis?.components?.voice_ready_coherent_ok) score += 0.12;
  if (ctx.voiceEntryDeferred !== true && voiceEntryAttempts > 0) score += 0.06;
  if (zeroLive) score += 0.06;
  return Number(clamp01(score).toFixed(4));
}

/**
 * @param {ReturnType<typeof sampleContinuityIntegrityScoreV0>} cis
 * @param {ReturnType<typeof getFirst3sCoherenceStabilityIndexV0>} cssi
 * @param {number} nowMs
 */
function updateFirstContactSuccessV0(cis, cssi, nowMs) {
  if (firstContactRecorded) return;
  markContinuitySessionOriginV0(nowMs);
  const origin = getContinuitySessionOriginMsV0();
  const elapsed = nowMs - origin;
  if (elapsed < FIRST_CONTACT_WINDOW_MS_V0) {
    const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
    if (
      rh.continuityFirstPaint?.ok &&
      cis?.product_gate_ok &&
      cssi?.stable !== false &&
      (cssi?.sample_count === 0 || cssi.cssi01 >= 0.5)
    ) {
      firstContactSuccess = true;
      firstContactRecorded = true;
    }
    return;
  }
  firstContactRecorded = true;
}

/**
 * @param {ReturnType<typeof sampleContinuityIntegrityScoreV0>} cis
 * @param {{
 *   fieldState?: string,
 *   voiceReady?: boolean,
 *   voiceAdapterReady?: boolean,
 *   uiShowsListening?: boolean,
 *   voiceEntryDeferred?: boolean,
 *   nowMs?: number
 * }} ctx
 */
export function buildObservabilitySnapshotV0(cis, ctx = {}) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  if (!sessionOriginMarked) {
    markContinuitySessionOriginV0(nowMs);
    sessionOriginMarked = true;
  }

  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const tdg = rh.temporalDriftGuard;
  const ecc = rh.experienceContinuity;

  if (ctx.voiceEntryDeferred === true) voiceEntryDeferred += 1;
  if (ctx.voiceEntryAttempt === true) voiceEntryAttempts += 1;

  const cssi = recordFirst3sCoherenceSampleV0({
    cis01: cis?.cis01,
    phase_coherence_ok: tdg?.phase_coherence_ok,
    drift_magnitude01: tdg?.drift_magnitude01,
    narrative_velocity: ecc?.narrative_velocity,
    nowMs
  }) || getFirst3sCoherenceStabilityIndexV0(nowMs);

  updateFirstContactSuccessV0(cis, cssi, nowMs);

  const user_felt_presence_score01 = deriveUserFeltPresenceScore01(cis, ctx);

  /** @type {Record<string, number>} */
  const heatCounts = {
    drift_none: 0,
    frame_motion_slip: 0,
    motion_without_frame: 0,
    velocity_jump: 0,
    compound: 0
  };
  for (const entry of ring) {
    const cls = entry?.heatmap_peak_class || "drift_none";
    bumpHeatmapV0(heatCounts, cls);
  }
  const driftClass = String(tdg?.drift_class || "none");
  const heatKey =
    driftClass === "none"
      ? "drift_none"
      : driftClass.includes("compound")
        ? "compound"
        : driftClass;
  bumpHeatmapV0(heatCounts, heatKey);

  /** @type {Record<string, number>} */
  const bySecond = {};
  for (const entry of ring) {
    const sec = String(Math.floor((entry.atMs - markContinuitySessionOriginV0()) / 1000));
    bySecond[sec] =
      (bySecond[sec] || 0) + Number(entry.cis_snapshot?.cis01 ? 1 - entry.cis_snapshot.cis01 : 0.1);
  }
  const secNow = String(Math.floor((nowMs - markContinuitySessionOriginV0()) / 1000));
  bySecond[secNow] =
    (bySecond[secNow] || 0) + Number(tdg?.drift_magnitude01 || 0);

  const heatmap = Object.freeze({
    drift_none: heatCounts.drift_none,
    frame_motion_slip: heatCounts.frame_motion_slip,
    motion_without_frame: heatCounts.motion_without_frame,
    velocity_jump: heatCounts.velocity_jump,
    compound: heatCounts.compound,
    by_elapsed_second: Object.freeze(bySecond)
  });

  const first_contact_success_rate01 = firstContactRecorded
    ? firstContactSuccess
      ? 1
      : 0
    : clamp01(cis?.product_gate_ok ? 0.5 : 0.2);

  const voice_entry_success_rate01 =
    voiceEntryAttempts > 0
      ? clamp01(1 - voiceEntryDeferred / voiceEntryAttempts)
      : 1;

  return Object.freeze({
    schema: CONTINUITY_OBSERVABILITY_SCHEMA_V0,
    atMs: nowMs,
    non_invasive: true,
    user_felt_presence_score01,
    continuity_integrity_drift_heatmap: heatmap,
    heatmap_peak_class: heatKey,
    first_contact_success: firstContactSuccess,
    first_contact_success_rate01: Number(first_contact_success_rate01.toFixed(4)),
    first_contact_window_ms: FIRST_CONTACT_WINDOW_MS_V0,
    voice_entry_success_rate01: Number(voice_entry_success_rate01.toFixed(4)),
    voice_entry_attempts: voiceEntryAttempts,
    voice_entry_deferred: voiceEntryDeferred,
    cssi,
    cis_snapshot: Object.freeze({
      cis01: cis?.cis01,
      product_gate_ok: cis?.product_gate_ok,
      threshold: CIS_PRODUCT_GATE_THRESHOLD_V0
    }),
    observe_only: true
  });
}

/**
 * Sample CIS + observability ring (App tick).
 * @param {Parameters<typeof sampleContinuityIntegrityScoreV0>[0]} ctx
 */
export function recordContinuityObservabilitySampleV0(ctx = {}) {
  const cis = sampleContinuityIntegrityScoreV0(ctx);
  const snap = buildObservabilitySnapshotV0(cis, {
    ...ctx,
    nowMs: cis?.atMs || Date.now()
  });

  ring.push(snap);
  if (ring.length > RING_MAX_V0) ring.shift();
  lastSnapshot = snap;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.continuityObservability = snap;
    window.__rhizoh.continuityObservabilityRing = Object.freeze([...ring]);
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CONTINUITY_OBSERVABILITY_EVENT_V0, {
          detail: Object.freeze({ observability: snap })
        })
      );
    } catch {
      /* noop */
    }
  }
  return snap;
}

export function readContinuityObservabilityRingV0() {
  return Object.freeze([...ring]);
}

export function readLastContinuityObservabilityV0() {
  return lastSnapshot;
}

export function noteVoiceEntryObservabilityV0({ deferred = false } = {}) {
  voiceEntryAttempts += 1;
  if (deferred) voiceEntryDeferred += 1;
}

export function resetContinuityObservabilityForTestV0() {
  ring.length = 0;
  lastSnapshot = null;
  firstContactRecorded = false;
  firstContactSuccess = false;
  voiceEntryAttempts = 0;
  voiceEntryDeferred = 0;
  sessionOriginMarked = false;
  import("./rhizohFirst3sCoherenceStabilityV0.js").then((m) =>
    m.resetFirst3sCoherenceStabilityForTestV0()
  );
}
