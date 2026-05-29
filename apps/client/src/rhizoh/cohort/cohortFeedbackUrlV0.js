/**
 * Cohort session feedback URLs — human-facing only (no seq/ingress in copy).
 */

export function ensureCohortSessionRefV0() {
  if (typeof sessionStorage === "undefined") return `cs_${Date.now()}`;
  const key = "rhizoh.cohort.session_ref.v0";
  try {
    const existing = String(sessionStorage.getItem(key) || "").trim();
    if (existing) return existing;
    const ref = `cs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, ref);
    return ref;
  } catch {
    return `cs_${Date.now()}`;
  }
}

function pageOrigin() {
  if (typeof window === "undefined") return "https://rhizoh.com";
  return String(window.location?.origin || "https://rhizoh.com").replace(/\/+$/, "");
}

/**
 * @param {{ reviewerId?: string, sessionRef?: string }} [opts]
 */
export function buildCohortFeedbackUrlV0(opts = {}) {
  const reviewer = String(opts.reviewerId || "metehan").trim().toLowerCase();
  const sessionRef = String(opts.sessionRef || ensureCohortSessionRefV0()).trim();
  const u = new URL("/", pageOrigin());
  u.searchParams.set("cohort", "feedback");
  u.searchParams.set("reviewer", reviewer);
  if (sessionRef) u.searchParams.set("session", sessionRef);
  return u.toString();
}

export function isCohortFeedbackRouteV0() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("cohort") === "feedback";
  } catch {
    return false;
  }
}

export function readCohortFeedbackParamsFromUrlV0() {
  if (typeof window === "undefined") {
    return { reviewerId: "metehan", sessionRef: "" };
  }
  try {
    const q = new URLSearchParams(window.location.search);
    return {
      reviewerId: String(q.get("reviewer") || "metehan").trim().toLowerCase(),
      sessionRef: String(q.get("session") || "").trim()
    };
  } catch {
    return { reviewerId: "metehan", sessionRef: "" };
  }
}
