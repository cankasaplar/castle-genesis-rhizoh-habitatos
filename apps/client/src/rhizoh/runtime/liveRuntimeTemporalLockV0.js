/**
 * Live runtime temporal consistency lock (v0).
 *
 * **Boundary:** **Temporal ≠ Identity**, **Temporal ≠ Freeze**. This module adjusts **runtime
 * perception timing** (drift, lag estimates, tick normalization, render-sync **hints**) only.
 * It does **not** produce world state, touch identity, or implement projection tint/fog math
 * (that stays in `sceneProjectionAdapterV0` / `projectionSmoothingV0` / Cesium bridge).
 *
 * - **Tick drift:** önceki tick bitişi ile planlı `intervalMs` karşılaştırması.
 * - **Missed frame (tahmin):** drift / interval ile üst sınırlı sayım; Cesium için ekstra `requestRender` önerisi.
 * - **Lag compensation:** orchestrator `setTimeout` zinciri — tick süresi `interval`’dan kısaysa sonraki bekleme telafi edilir.
 * - **Frame lag EMA:** `tickWallMs` vs planlı interval — yumuşatılmış gecikme tahmini (gözlem / downstream ipucu).
 * - **Cesium sync lag:** projection DOM commit ile sink çağrısı arası + sink süresi ölçümü (gözlemlenebilirlik).
 *
 * @see docs/TEMPORAL_LAYER_BOUNDARY_V0.md
 * @see liveRuntimeOrchestratorV0.js
 */

export const LIVE_RUNTIME_TEMPORAL_SCHEMA_V0 = "liveRuntimeTemporal.v0";

/** Orchestrator tick clamp (aligns with `startLiveRuntimeOrchestratorV0` env bounds). */
export const LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MIN_MS = 500;
export const LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MAX_MS = 600_000;

/**
 * @param {number} ms
 * @returns {number}
 */
export function clampLiveRuntimeOrchestratorIntervalMsV0(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MIN_MS;
  return Math.min(LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MAX_MS, Math.max(LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MIN_MS, n));
}

/** Tab throttle gürültüsü altında missed sayma eşiği */
const TICK_GRACE_MS = 120;

/** EMA on tick-wall vs interval lag (perception timing only). */
const LAG_EMA_ALPHA = 0.18;
const LAG_EMA_DECAY = 0.92;

/** @type {number} */
let _lastTickCompleteAt = 0;
/** @type {number} */
let _lastDriftMs = 0;
/** @type {number} */
let _lastMissedFrames = 0;
/** @type {number} */
let _lastExtraCesiumSinks = 0;
/** @type {number} */
let _lastTickWallMs = 0;
/** @type {number} */
let _lastProjectionWallMs = 0;
/** @type {number} */
let _lastCesiumSinkWallMs = 0;
/** @type {number} */
let _lastCesiumSyncLagMs = 0;
/** @type {number} */
let _emaLagVsIntervalMs = 0;

export function resetLiveRuntimeTemporalLockForTestsV0() {
  _lastTickCompleteAt = 0;
  _lastDriftMs = 0;
  _lastMissedFrames = 0;
  _lastExtraCesiumSinks = 0;
  _lastTickWallMs = 0;
  _lastProjectionWallMs = 0;
  _lastCesiumSinkWallMs = 0;
  _lastCesiumSyncLagMs = 0;
  _emaLagVsIntervalMs = 0;
}

/**
 * Tick başı (planlı interval’a göre drift + kaçırılmış kare tahmini).
 * @param {number} intervalMs
 * @returns {{ driftMs: number, missedFrames: number, extraCesiumSinkInvocations: number }}
 */
export function beginLiveRuntimeOrchestratorTickTemporalV0(intervalMs) {
  const now = performance.now();
  let driftMs = 0;
  let missedFrames = 0;
  if (_lastTickCompleteAt > 0 && intervalMs > 0) {
    const elapsed = now - _lastTickCompleteAt;
    driftMs = Math.max(0, elapsed - intervalMs);
    if (driftMs > TICK_GRACE_MS) {
      missedFrames = Math.min(8, Math.floor(driftMs / intervalMs));
    }
  }
  _lastDriftMs = driftMs;
  _lastMissedFrames = missedFrames;
  const extraCesiumSinkInvocations = Math.min(2, missedFrames);
  _lastExtraCesiumSinks = extraCesiumSinkInvocations;
  return { driftMs, missedFrames, extraCesiumSinkInvocations };
}

/**
 * @param {{
 *   tickWallMs: number,
 *   projectionWallMs: number,
 *   cesiumSinkWallMs: number,
 *   cesiumSyncLagMs: number
 * }} m
 * @param {number} [intervalMsForLagEma] planned tick interval; when > 0, updates lag EMA from `tickWallMs`
 */
export function completeLiveRuntimeOrchestratorTickTemporalV0(m, intervalMsForLagEma = 0) {
  _lastTickCompleteAt = performance.now();
  _lastTickWallMs = m.tickWallMs;
  _lastProjectionWallMs = m.projectionWallMs;
  _lastCesiumSinkWallMs = m.cesiumSinkWallMs;
  _lastCesiumSyncLagMs = m.cesiumSyncLagMs;

  const interval = Number(intervalMsForLagEma);
  if (interval > 0 && m.tickWallMs > 0) {
    const raw = Math.max(0, m.tickWallMs - interval);
    if (raw > 0) {
      _emaLagVsIntervalMs =
        _emaLagVsIntervalMs <= 0 ? raw : _emaLagVsIntervalMs * (1 - LAG_EMA_ALPHA) + raw * LAG_EMA_ALPHA;
    } else {
      _emaLagVsIntervalMs *= LAG_EMA_DECAY;
      if (_emaLagVsIntervalMs < 0.5) _emaLagVsIntervalMs = 0;
    }
  }
}

/**
 * @param {number} intervalMs
 */
export function getLiveRuntimeTemporalSnapshotV0(intervalMs = 0) {
  const lagVsIntervalMs =
    intervalMs > 0 && _lastTickWallMs > 0 ? Math.max(0, _lastTickWallMs - intervalMs) : 0;
  return {
    schema: LIVE_RUNTIME_TEMPORAL_SCHEMA_V0,
    driftMsLast: _lastDriftMs,
    missedFramesLast: _lastMissedFrames,
    extraCesiumSinksLast: _lastExtraCesiumSinks,
    tickWallMsLast: _lastTickWallMs,
    lagVsIntervalMsLast: lagVsIntervalMs,
    frameLagEstimateMsLast: _emaLagVsIntervalMs,
    projectionWallMsLast: _lastProjectionWallMs,
    cesiumSinkWallMsLast: _lastCesiumSinkWallMs,
    cesiumSyncLagMsLast: _lastCesiumSyncLagMs
  };
}

/**
 * Read-only render-sync hints from temporal signals (no scene mutation).
 * @param {number} [intervalMs]
 */
export function getLiveRuntimeRenderSyncHintsV0(intervalMs = 0) {
  const interval = Number(intervalMs);
  const denom = interval > 0 ? interval : 1;
  const pressure = Math.min(1, Math.max(0, _emaLagVsIntervalMs / denom));
  return {
    schema: LIVE_RUNTIME_TEMPORAL_SCHEMA_V0,
    frameLagEstimateMs: _emaLagVsIntervalMs,
    /** 0–1: downstream may raise render priority / loosen throttles — does not change world state. */
    renderSyncPressure01: pressure
  };
}
