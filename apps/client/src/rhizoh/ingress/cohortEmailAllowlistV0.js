/**
 * Kohort e-posta listesi — iki katman:
 * - Sunucu kapısı (`VITE_RHIZOH_COHORT_SERVER_GATE=1` + `cohortGateV0`) → yetki kaynağı; build-time env ile bypass edilemez.
 * - İstemci listesi (`VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST`) → yalnızca sunucu kapısı kapalıyken uygulanır (UX / hızlı dev).
 *
 * SpiralMMO / simülasyon katmanı bu modüle veya kohort auth akışına import etmemelidir.
 */

/** @param {unknown} env */
function readRawAllowlist(env) {
  if (!env || typeof env !== "object") return "";
  const v = /** @type {Record<string, unknown>} */ (env).VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST;
  return typeof v === "string" ? v : "";
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
export function parseCohortEmailAllowlistV0(raw) {
  const s = String(raw || "").trim();
  if (!s) return [];
  return s
    .split(/[,;\n\r]+/)
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean);
}

/** @param {unknown} [env] */
export function getCohortEmailAllowlistV0(env) {
  const e = env ?? (typeof import.meta !== "undefined" ? import.meta.env : {});
  return parseCohortEmailAllowlistV0(readRawAllowlist(e));
}

/** Build-time listede en az bir e-posta var mı (bilgi / UX; tek başına yetki değil). */
export function isCohortEmailAllowlistConfiguredV0(env) {
  return getCohortEmailAllowlistV0(env).length > 0;
}

export function isCohortServerGateEnabledV0(env) {
  const e = env ?? (typeof import.meta !== "undefined" ? import.meta.env : {});
  return e?.VITE_RHIZOH_COHORT_SERVER_GATE === "1";
}

/**
 * Sunucu kapısı yokken istemcide allowlist uygulanır.
 * Sunucu kapısı açıkken VITE listesi yetki için kullanılmaz (yalnızca sunucu `COHORT_EMAIL_ALLOWLIST`).
 */
export function isCohortEmailAllowlistActiveV0(env) {
  if (isCohortServerGateEnabledV0(env)) return false;
  return isCohortEmailAllowlistConfiguredV0(env);
}

/**
 * @param {string} email
 * @param {unknown} [env]
 */
export function isEmailAllowedOnCohortAllowlistV0(email, env) {
  const list = getCohortEmailAllowlistV0(env);
  if (!list.length) return true;
  const norm = String(email || "").trim().toLowerCase();
  if (!norm) return false;
  return list.includes(norm);
}

export function isInviteOnlyGoogleModeV0() {
  if (typeof import.meta === "undefined") return false;
  return import.meta.env?.VITE_RHIZOH_INVITE_ONLY_GOOGLE === "1";
}

/** Sunucu kökü + path; boşsa `window.location.origin + /api/cohortGateV0`. */
export function resolveCohortGateUrlV0(env) {
  const e = env ?? (typeof import.meta !== "undefined" ? import.meta.env : {});
  const explicit = String(e?.VITE_RHIZOH_COHORT_GATE_URL || "").trim();
  if (explicit) return explicit;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/cohortGateV0`;
  }
  return "";
}
