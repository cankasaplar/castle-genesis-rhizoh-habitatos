/**
 * SPECFLOW: CORE-ELIGIBLE — persona = behavior vector (not prompt template only).
 */

/** @typedef {{ personaId: string, respondInLocale: string, initiativeCap01: number, maxSentences: number, tempo: "slow"|"steady"|"snappy", register: string }} PersonaPackV0 */

/**
 * @param {{
 *   mode: string,
 *   detectedLocale: string,
 *   defaultLocale: string,
 *   register: string,
 *   audience: string,
 *   hostSurface: boolean,
 *   peerCount: number
 * }} ctx
 * @returns {PersonaPackV0}
 */
export function selectPersonaV0(ctx) {
  const mode = String(ctx.mode || "").toUpperCase();
  const detected = String(ctx.detectedLocale || "und");
  const def = String(ctx.defaultLocale || "tr").toLowerCase();
  const register = String(ctx.register || "unknown");
  const peerCount = Math.max(0, Number(ctx.peerCount) || 0);
  const hostSurface = !!ctx.hostSurface;

  let personaId = "RHIZOH_CORE";
  let initiativeCap01 = 0.35;
  let maxSentences = 4;
  let tempo = /** @type {"slow"|"steady"|"snappy"} */ ("steady");

  if (mode === "HOST" || (hostSurface && peerCount >= 1)) {
    personaId = "RHIZOH_HOST";
    initiativeCap01 = 0.72;
    maxSentences = 5;
    tempo = "steady";
  } else if (mode === "INTERPRETER" || (detected !== "und" && detected !== def && detected.length === 2)) {
    personaId = "RHIZOH_INTERPRETER";
    initiativeCap01 = 0.45;
    maxSentences = 4;
    tempo = "snappy";
  } else if (peerCount >= 1 || String(ctx.audience || "") === "group") {
    personaId = "RHIZOH_SOCIAL";
    initiativeCap01 = 0.55;
    maxSentences = 5;
    tempo = "steady";
  } else if (mode === "QUIET" || mode === "IDLE") {
    personaId = "RHIZOH_QUIET";
    initiativeCap01 = 0.2;
    maxSentences = 2;
    tempo = "slow";
  }

  if (register === "formal" && personaId === "RHIZOH_CORE") {
    initiativeCap01 = Math.max(initiativeCap01, 0.4);
    tempo = "steady";
  }

  const respondInLocale = detected !== "und" ? detected : def === "tr" ? "tr" : "en";

  return {
    personaId,
    respondInLocale,
    initiativeCap01: Math.round(Math.min(1, Math.max(0, initiativeCap01)) * 1000) / 1000,
    maxSentences: Math.max(1, Math.min(8, maxSentences)),
    tempo,
    register
  };
}
