/**
 * Client cohort pin — passive context.cohortId only (no schema selection).
 */

const LS_COHORT_ID = "castle.rhizoh.cohortId.v1";

/**
 * Cohort id for gateway routing — env wins, then optional dev storage.
 * Client MUST NOT map cohort → schema locally.
 */
export function getRhizohCohortIdForRequestV0() {
  const env = typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_COHORT_ID : "";
  const fromEnv = String(env || "").trim();
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(LS_COHORT_ID) || "").trim();
  } catch {
    return "";
  }
}

/**
 * Dev-only — does not affect schema resolution on client.
 * @param {string} cohortId
 */
export function writeRhizohCohortIdDevV0(cohortId) {
  if (typeof window === "undefined") return;
  try {
    const id = String(cohortId || "").trim();
    if (id) window.localStorage.setItem(LS_COHORT_ID, id);
    else window.localStorage.removeItem(LS_COHORT_ID);
  } catch {
    /* noop */
  }
}
