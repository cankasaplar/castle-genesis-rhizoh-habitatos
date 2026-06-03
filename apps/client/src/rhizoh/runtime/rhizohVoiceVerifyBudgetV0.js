/**
 * Gray-zone verify budget — cap per voice session to prevent repeat-loop inflation.
 */

export const VOICE_VERIFY_BUDGET_MAX_PER_SESSION_V0 = 2;

/** @type {Map<string, number>} */
const verifyCountBySession = new Map();

/**
 * @param {string} [sessionId]
 */
export function getVoiceVerifyCountV0(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) return 0;
  return verifyCountBySession.get(id) || 0;
}

/**
 * @param {string} [sessionId]
 */
export function isVoiceVerifyBudgetExhaustedV0(sessionId) {
  return getVoiceVerifyCountV0(sessionId) >= VOICE_VERIFY_BUDGET_MAX_PER_SESSION_V0;
}

/**
 * @param {string} [sessionId]
 */
export function noteVoiceVerifyAttemptV0(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) return 0;
  const next = getVoiceVerifyCountV0(id) + 1;
  verifyCountBySession.set(id, next);
  return next;
}

/**
 * @param {string} [sessionId]
 */
export function resetVoiceVerifyBudgetV0(sessionId) {
  const id = String(sessionId || "").trim();
  if (id) verifyCountBySession.delete(id);
  else verifyCountBySession.clear();
}

export function __resetVoiceVerifyBudgetForTestV0() {
  verifyCountBySession.clear();
}
