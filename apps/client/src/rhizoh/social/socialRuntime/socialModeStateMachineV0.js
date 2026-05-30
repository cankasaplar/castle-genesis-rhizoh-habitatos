/**
 * SPECFLOW: CORE-ELIGIBLE — global social mode authority (client policy, not execution).
 */

export const SOCIAL_MODE_V0 = Object.freeze({
  IDLE: "IDLE",
  AWARE: "AWARE",
  SOCIAL_ACTIVE: "SOCIAL_ACTIVE",
  INTERPRETER: "INTERPRETER",
  HOST: "HOST",
  QUIET: "QUIET"
});

/**
 * @param {{
 *   prevMode: string,
 *   userMessageNonEmpty: boolean,
 *   silenceMs: number,
 *   localeConfidence: number,
 *   detectedLocale: string,
 *   defaultLocale: string,
 *   hostSurface: boolean,
 *   silenceIntent: boolean,
 *   peerCount: number
 * }} input
 * @returns {string}
 */
export function transitionSocialModeV0(input) {
  const prev = String(input.prevMode || SOCIAL_MODE_V0.IDLE).toUpperCase();
  const hasText = !!input.userMessageNonEmpty;
  const silenceMs = Math.max(0, Number(input.silenceMs) || 0);
  const loc = String(input.detectedLocale || "und");
  const def = String(input.defaultLocale || "tr").toLowerCase();
  const locConf = Math.min(1, Math.max(0, Number(input.localeConfidence) || 0));
  const hostSurface = !!input.hostSurface;
  const silenceIntent = !!input.silenceIntent;
  const peerCount = Math.max(0, Number(input.peerCount) || 0);

  if (silenceIntent && !hasText) {
    return SOCIAL_MODE_V0.QUIET;
  }

  if (hostSurface || peerCount >= 2) {
    if (hasText) return SOCIAL_MODE_V0.HOST;
    if (silenceMs < 180_000 && (prev === SOCIAL_MODE_V0.HOST || prev === SOCIAL_MODE_V0.SOCIAL_ACTIVE)) return SOCIAL_MODE_V0.HOST;
  }

  if (hasText) {
    const foreign =
      loc !== "und" &&
      loc !== def &&
      locConf >= 0.55 &&
      (loc === "en" || loc === "ja" || loc === "zh" || loc === "ru");
    if (foreign) return SOCIAL_MODE_V0.INTERPRETER;
    return SOCIAL_MODE_V0.SOCIAL_ACTIVE;
  }

  if (silenceMs > 240_000 && (prev === SOCIAL_MODE_V0.SOCIAL_ACTIVE || prev === SOCIAL_MODE_V0.INTERPRETER)) {
    return SOCIAL_MODE_V0.IDLE;
  }

  if (silenceMs > 45_000 && prev !== SOCIAL_MODE_V0.IDLE) {
    return SOCIAL_MODE_V0.AWARE;
  }

  if (prev === SOCIAL_MODE_V0.QUIET && !hasText) return SOCIAL_MODE_V0.IDLE;

  return hasText ? SOCIAL_MODE_V0.AWARE : prev === SOCIAL_MODE_V0.IDLE ? SOCIAL_MODE_V0.IDLE : SOCIAL_MODE_V0.AWARE;
}
