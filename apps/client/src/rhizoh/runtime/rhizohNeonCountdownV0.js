/** Neon world-space countdown — 6:44 session anchor (v0). */

export const RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0 = (6 * 60 + 44) * 1000;

export const RHIZOH_NEON_COUNTDOWN_SESSION_KEY_V0 = "rhizoh_neon_countdown_deadline_v0";

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatRhizohNeonCountdownMsV0(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * @param {number} [nowMs]
 * @returns {number}
 */
export function readRhizohNeonCountdownDeadlineMsV0(nowMs = Date.now()) {
  if (typeof window === "undefined") return nowMs + RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0;
  try {
    const raw = window.sessionStorage.getItem(RHIZOH_NEON_COUNTDOWN_SESSION_KEY_V0);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > nowMs) return parsed;
  } catch {
    /* ignore */
  }
  return resetRhizohNeonCountdownDeadlineV0(nowMs);
}

/**
 * @param {number} [nowMs]
 * @returns {number}
 */
export function resetRhizohNeonCountdownDeadlineV0(nowMs = Date.now()) {
  const deadline = nowMs + RHIZOH_NEON_COUNTDOWN_DURATION_MS_V0;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(RHIZOH_NEON_COUNTDOWN_SESSION_KEY_V0, String(deadline));
    } catch {
      /* ignore */
    }
  }
  return deadline;
}

/**
 * @param {number} deadlineMs
 * @param {number} [nowMs]
 * @returns {number}
 */
export function resolveRhizohNeonCountdownRemainingMsV0(deadlineMs, nowMs = Date.now()) {
  return Math.max(0, deadlineMs - nowMs);
}

/**
 * Awakening plan deadline — never extends an active session back toward full 6:44.
 * @param {number} [nowMs]
 * @param {boolean} [resetSession]
 */
export function resolveRhizohNeonCountdownDeadlineForAwakeningV0(nowMs = Date.now(), resetSession = false) {
  if (resetSession) return resetRhizohNeonCountdownDeadlineV0(nowMs);
  return readRhizohNeonCountdownDeadlineMsV0(nowMs);
}

/**
 * @param {number} remainingMs
 * @returns {boolean}
 */
export function isRhizohNeonCountdownCompleteV0(remainingMs) {
  return remainingMs <= 0;
}
