/**
 * First 0–3s Coherence Stability Index (CSSI) — production hardening metric.
 * Observe-only; feeds continuity observability (no CCF/ECC feedback).
 * @see docs/RHIZOH_CONTINUITY_OBSERVABILITY_V0.md
 */

export const CSSI_WINDOW_MS_V0 = 3000;
export const CSSI_SCHEMA_V0 = "castle.rhizoh.first_3s_coherence_stability.v0";

/** @type {number} */
let sessionOriginMs = 0;
/** @type {Array<{ atMs: number, cis01: number, phaseOk: boolean, drift01: number, velocity01: number }>} */
const samples = [];

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

export function markContinuitySessionOriginV0(nowMs = Date.now()) {
  if (!sessionOriginMs) sessionOriginMs = Number(nowMs) || Date.now();
  return sessionOriginMs;
}

export function getContinuitySessionOriginMsV0() {
  if (!sessionOriginMs && typeof performance !== "undefined") {
    sessionOriginMs = Math.round(performance.timeOrigin || Date.now());
  }
  return sessionOriginMs || Date.now();
}

/**
 * @param {{
 *   cis01?: number,
 *   phase_coherence_ok?: boolean,
 *   drift_magnitude01?: number,
 *   narrative_velocity?: number,
 *   nowMs?: number
 * }} snap
 */
export function recordFirst3sCoherenceSampleV0(snap = {}) {
  markContinuitySessionOriginV0();
  const nowMs = Number(snap.nowMs) || Date.now();
  const elapsed = nowMs - getContinuitySessionOriginMsV0();
  if (elapsed > CSSI_WINDOW_MS_V0 + 500) return null;

  samples.push({
    atMs: nowMs,
    cis01: clamp01(snap.cis01),
    phaseOk: snap.phase_coherence_ok !== false,
    drift01: clamp01(snap.drift_magnitude01),
    velocity01: clamp01(snap.narrative_velocity)
  });
  if (samples.length > 48) samples.shift();
  return getFirst3sCoherenceStabilityIndexV0(nowMs);
}

/**
 * @param {number} [nowMs]
 */
export function getFirst3sCoherenceStabilityIndexV0(nowMs = Date.now()) {
  const origin = getContinuitySessionOriginMsV0();
  const elapsed = nowMs - origin;
  const inWindow = samples.filter((s) => s.atMs - origin <= CSSI_WINDOW_MS_V0);

  if (inWindow.length === 0) {
    return Object.freeze({
      schema: CSSI_SCHEMA_V0,
      atMs: nowMs,
      elapsed_ms: elapsed,
      sample_count: 0,
      cssi01: 0,
      stable: false,
      velocity_jitter01: 0,
      mean_cis01: 0,
      phase_ok_ratio01: 0
    });
  }

  const cisVals = inWindow.map((s) => s.cis01);
  const mean = cisVals.reduce((a, b) => a + b, 0) / cisVals.length;
  const variance =
    cisVals.reduce((a, v) => a + (v - mean) ** 2, 0) / cisVals.length;
  const cisStability01 = clamp01(1 - Math.sqrt(variance) * 2.2);

  const velocities = inWindow.map((s) => s.velocity01);
  let velJitter = 0;
  for (let i = 1; i < velocities.length; i++) {
    velJitter += Math.abs(velocities[i] - velocities[i - 1]);
  }
  const velocity_jitter01 = clamp01(
    velocities.length > 1 ? velJitter / (velocities.length - 1) : 0
  );

  const phase_ok_ratio01 = clamp01(
    inWindow.filter((s) => s.phaseOk).length / inWindow.length
  );
  const mean_drift01 =
    inWindow.reduce((a, s) => a + s.drift01, 0) / inWindow.length;

  const cssi01 = clamp01(
    mean * 0.38 +
      cisStability01 * 0.28 +
      phase_ok_ratio01 * 0.22 +
      (1 - velocity_jitter01) * 0.12 -
      mean_drift01 * 0.08
  );

  return Object.freeze({
    schema: CSSI_SCHEMA_V0,
    atMs: nowMs,
    elapsed_ms: elapsed,
    sample_count: inWindow.length,
    cssi01: Number(cssi01.toFixed(4)),
    stable: cssi01 >= 0.58 && phase_ok_ratio01 >= 0.7,
    velocity_jitter01: Number(velocity_jitter01.toFixed(4)),
    mean_cis01: Number(mean.toFixed(4)),
    phase_ok_ratio01: Number(phase_ok_ratio01.toFixed(4)),
    mean_drift01: Number(mean_drift01.toFixed(4))
  });
}

export function isWithinFirst3sContinuityWindowV0(nowMs = Date.now()) {
  return nowMs - getContinuitySessionOriginMsV0() < CSSI_WINDOW_MS_V0;
}

export function resetFirst3sCoherenceStabilityForTestV0() {
  sessionOriginMs = 0;
  samples.length = 0;
}
