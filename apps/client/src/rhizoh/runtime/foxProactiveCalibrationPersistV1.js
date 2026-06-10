/**
 * FOX_PROACTIVE_CALIBRATION_PERSIST_V1 — session-ötesi kalibrasyon (local continuity disk).
 */

export const FOX_PROACTIVE_CALIBRATION_DISK_SCHEMA_V1 =
  "castle.rhizoh.fox_proactive_calibration_disk.v1";

const LS_KEY_V1 = "rhizoh.fox_proactive_calibration.v1";
const CONTINUITY_KEY_V1 = "rhizoh.continuity.v1";
const OUTCOME_RING_MAX_V1 = 32;

/**
 * @param {unknown} raw
 */
export function coalesceFoxProactiveCalibrationDiskV1(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const cal = r.calibration && typeof r.calibration === "object" ? r.calibration : {};
  const history = Array.isArray(r.outcomeHistory) ? r.outcomeHistory : [];
  return Object.freeze({
    schema: FOX_PROACTIVE_CALIBRATION_DISK_SCHEMA_V1,
    calibration: Object.freeze({
      significanceThreshold: Number(cal.significanceThreshold) || 0.72,
      cooldownMinutes: Number(cal.cooldownMinutes) || 20,
      maxInitiationsPerHour: Math.max(1, Math.round(Number(cal.maxInitiationsPerHour) || 2)),
      dailyLimit: Math.max(1, Math.round(Number(cal.dailyLimit) || 10)),
      proactiveTolerance: Number(cal.proactiveTolerance) || 0.5,
      engagementRate: Number(cal.engagementRate) || 0,
      dismissRate: Number(cal.dismissRate) || 0
    }),
    outcomeHistory: Object.freeze(history.slice(-OUTCOME_RING_MAX_V1)),
    updatedAt: Number(r.updatedAt) || 0
  });
}

/**
 * @returns {ReturnType<typeof coalesceFoxProactiveCalibrationDiskV1> | null}
 */
export function hydrateFoxProactiveCalibrationDiskV1() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY_V1);
    if (raw) {
      return coalesceFoxProactiveCalibrationDiskV1(JSON.parse(raw));
    }
    const continuityRaw = localStorage.getItem(CONTINUITY_KEY_V1);
    if (!continuityRaw) return null;
    const parsed = JSON.parse(continuityRaw);
    const meta = parsed?.meta?.foxProactiveCalibration;
    if (!meta || typeof meta !== "object") return null;
    return coalesceFoxProactiveCalibrationDiskV1({
      calibration: meta.calibration || meta,
      outcomeHistory: meta.outcomeHistory || [],
      updatedAt: meta.updatedAt
    });
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   calibration: Record<string, unknown>,
 *   outcomeHistory?: unknown[]
 * }} state
 */
export function persistFoxProactiveCalibrationDiskV1(state = {}) {
  if (typeof localStorage === "undefined") return null;
  const disk = coalesceFoxProactiveCalibrationDiskV1({
    calibration: state.calibration,
    outcomeHistory: state.outcomeHistory,
    updatedAt: Date.now()
  });
  try {
    localStorage.setItem(LS_KEY_V1, JSON.stringify(disk));
  } catch {
    /* noop */
  }
  try {
    const continuityRaw = localStorage.getItem(CONTINUITY_KEY_V1);
    const parsed = continuityRaw ? JSON.parse(continuityRaw) : { turns: [], persona: {}, meta: {} };
    const meta = parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {};
    parsed.meta = {
      ...meta,
      foxProactiveCalibration: Object.freeze({
        schema: FOX_PROACTIVE_CALIBRATION_DISK_SCHEMA_V1,
        calibration: disk.calibration,
        outcomeHistory: disk.outcomeHistory,
        updatedAt: disk.updatedAt
      })
    };
    localStorage.setItem(CONTINUITY_KEY_V1, JSON.stringify(parsed));
  } catch {
    /* noop */
  }
  return disk;
}

/** @internal vitest */
export function __clearFoxProactiveCalibrationDiskForTestV1() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(LS_KEY_V1);
  } catch {
    /* noop */
  }
}
