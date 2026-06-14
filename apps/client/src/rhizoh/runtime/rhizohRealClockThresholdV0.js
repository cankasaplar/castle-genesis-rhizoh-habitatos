/** Real-local-clock wave thresholds — 06:44 dawn · 18:44 dusk (v0). */

export const RHIZOH_REAL_CLOCK_THRESHOLD_SCHEMA_V0 = "rhizoh.real_clock_threshold.v0";

export const RHIZOH_CLOCK_THRESHOLDS_V0 = Object.freeze([
  Object.freeze({ id: "dawn", hour: 6, minute: 44, label: "06:44" }),
  Object.freeze({ id: "dusk", hour: 18, minute: 44, label: "18:44" })
]);

/**
 * @param {number} [nowMs]
 * @returns {{ id: "dawn"|"dusk", hour: number, minute: number, label: string, deadlineMs: number }}
 */
export function resolveRhizohNextClockThresholdV0(nowMs = Date.now()) {
  const now = new Date(nowMs);
  /** @type {{ id: "dawn"|"dusk", hour: number, minute: number, label: string, deadlineMs: number }[]} */
  const candidates = [];

  for (const threshold of RHIZOH_CLOCK_THRESHOLDS_V0) {
    const d = new Date(now);
    d.setSeconds(0, 0);
    d.setHours(threshold.hour, threshold.minute, 0, 0);
    if (d.getTime() <= nowMs) {
      d.setDate(d.getDate() + 1);
    }
    candidates.push({
      id: threshold.id,
      hour: threshold.hour,
      minute: threshold.minute,
      label: threshold.label,
      deadlineMs: d.getTime()
    });
  }

  candidates.sort((a, b) => a.deadlineMs - b.deadlineMs);
  return candidates[0];
}

/**
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function isRhizohRealClockThresholdMomentV0(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const h = d.getHours();
  const m = d.getMinutes();
  return RHIZOH_CLOCK_THRESHOLDS_V0.some((t) => t.hour === h && t.minute === m);
}

/**
 * @param {number} deadlineMs
 * @param {number} [nowMs]
 * @returns {number}
 */
export function resolveRhizohClockThresholdRemainingMsV0(deadlineMs, nowMs = Date.now()) {
  return Math.max(0, deadlineMs - nowMs);
}

/**
 * @param {{ remainingMs?: number, thresholdId?: string, nowMs?: number }} [opts]
 * @returns {"counting"|"dawn"|"dusk"}
 */
export function resolveRhizohRealClockWavePhaseV0(opts = {}) {
  const nowMs = opts.nowMs ?? Date.now();
  const remainingMs = opts.remainingMs ?? 0;
  const d = new Date(nowMs);

  if (remainingMs <= 0) {
    return opts.thresholdId === "dusk" ? "dusk" : "dawn";
  }

  if (d.getHours() === 18 && d.getMinutes() === 44) return "dusk";
  if (d.getHours() === 6 && d.getMinutes() === 44) return "dawn";
  return "counting";
}

/**
 * @param {"counting"|"dawn"|"dusk"} phase
 * @returns {{ accent: string, glow: string, panelBg: string, border: string }}
 */
export function resolveRhizohRealClockWaveVisualV0(phase) {
  if (phase === "dusk") {
    return Object.freeze({
      accent: "#ff8800",
      glow: "rgba(255, 136, 0, 0.55)",
      panelBg: "rgba(18, 10, 4, 0.94)",
      border: "rgba(255, 136, 0, 0.5)"
    });
  }
  if (phase === "dawn") {
    return Object.freeze({
      accent: "#fbbf24",
      glow: "rgba(251, 191, 36, 0.55)",
      panelBg: "rgba(18, 12, 4, 0.94)",
      border: "rgba(251, 191, 36, 0.5)"
    });
  }
  return Object.freeze({
    accent: "#67e8f9",
    glow: "rgba(34, 211, 238, 0.55)",
    panelBg: "rgba(3, 12, 22, 0.94)",
    border: "rgba(34, 211, 238, 0.45)"
  });
}
