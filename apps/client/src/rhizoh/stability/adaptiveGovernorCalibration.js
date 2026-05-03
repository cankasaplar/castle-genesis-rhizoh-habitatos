/**
 * Drift telemetrisinden yavaş governor ayarı — kontrol döngüsü kazancı düşük tutulur
 * (personality flattening / aşırı smoothing riski).
 */

function clamp(a, b, x) {
  return Math.max(a, Math.min(b, x));
}

export const DEFAULT_GOVERNOR_CALIBRATION = Object.freeze({
  pullScalePre: 1,
  pullScalePost: 1,
  /** >1 → duygu bandı genişler (daha az keskin clamp). */
  driftBandScale: 1,
  memoryMaxTopShare: 0.38,
  updatedAt: 0,
  calibrationSteps: 0
});

/**
 * @param {unknown} raw
 */
export function normalizeGovernorCalibration(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  return {
    pullScalePre: clamp(0.88, 1.12, Number(d.pullScalePre) || 1),
    pullScalePost: clamp(0.88, 1.12, Number(d.pullScalePost) || 1),
    driftBandScale: clamp(0.94, 1.06, Number(d.driftBandScale) || 1),
    memoryMaxTopShare: clamp(0.32, 0.44, Number(d.memoryMaxTopShare) || 0.38),
    updatedAt: Number(d.updatedAt) || 0,
    calibrationSteps: Math.max(0, Number(d.calibrationSteps) || 0)
  };
}

/**
 * Son drift kayıtlarına göre bir adım güncelle (her drift append sonrası çağrılabilir).
 * @param {Record<string, unknown>} meta — rhizohDriftLog + rhizohGovernorCalibration içeren
 */
export function stepGovernorCalibrationFromDriftLog(meta) {
  const prev = normalizeGovernorCalibration(meta?.rhizohGovernorCalibration);
  const log = Array.isArray(meta?.rhizohDriftLog) ? meta.rhizohDriftLog : [];
  const recent = log
    .slice(-12)
    .filter((e) => e && typeof e === "object" && Number.isFinite(Number(e.governorCorrection)));

  if (recent.length < 4) {
    return prev;
  }

  const avg =
    recent.reduce((s, e) => s + Number(e.governorCorrection), 0) / recent.length;
  const next = { ...prev };
  const STEP = 0.012;
  const HIGH = 0.2;
  const LOW = 0.065;

  if (avg > HIGH) {
    next.pullScalePost = clamp(0.88, 1.12, next.pullScalePost - STEP);
    next.pullScalePre = clamp(0.88, 1.12, next.pullScalePre - STEP * 0.65);
    next.driftBandScale = clamp(0.94, 1.06, next.driftBandScale + STEP * 0.75);
    next.memoryMaxTopShare = clamp(0.32, 0.44, next.memoryMaxTopShare + 0.006);
  } else if (avg < LOW) {
    next.pullScalePost = clamp(0.88, 1.12, next.pullScalePost + STEP * 0.55);
    next.pullScalePre = clamp(0.88, 1.12, next.pullScalePre + STEP * 0.4);
    next.driftBandScale = clamp(0.94, 1.06, next.driftBandScale - STEP * 0.45);
    next.memoryMaxTopShare = clamp(0.32, 0.44, next.memoryMaxTopShare - 0.004);
  }

  next.calibrationSteps = prev.calibrationSteps + 1;
  next.updatedAt = Date.now();
  return next;
}
