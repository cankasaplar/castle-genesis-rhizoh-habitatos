/**
 * Founder Circle interest registration v0 — local-only until billing READY.
 * RESEARCH-ONLY · interpretation-only export.
 */

export const FOUNDER_CIRCLE_INTEREST_SCHEMA_V0 = "castle.rhizoh.founder_circle_interest.v0";
const STORAGE_KEY_V0 = "rhizoh.founder_circle_interest.v0";

let founderCircleConsoleMountedV0 = false;

/**
 * @returns {object[]}
 */
export function listFounderCircleInterestV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {{ email?: string, note?: string, locale?: string, source?: string }} input
 */
export function recordFounderCircleInterestV0(input = {}) {
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("founder_circle_interest_invalid_email");
  }
  const entry = Object.freeze({
    schema: FOUNDER_CIRCLE_INTEREST_SCHEMA_V0,
    recordedAtMs: Date.now(),
    email,
    note: input.note ? String(input.note).slice(0, 500) : null,
    locale: input.locale ? String(input.locale).slice(0, 8) : "en",
    source: input.source ? String(input.source).slice(0, 80) : "founder_circle_page",
    interpretationOnly: true,
    nonExecutive: true
  });
  const prev = listFounderCircleInterestV0();
  const next = [entry, ...prev.filter((row) => row?.email !== email)].slice(0, 40);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(next));
  }
  return entry;
}

export function exportFounderCircleInterestJsonV0() {
  return Object.freeze({
    schema: FOUNDER_CIRCLE_INTEREST_SCHEMA_V0,
    exportedAtMs: Date.now(),
    rows: listFounderCircleInterestV0(),
    interpretationOnly: true
  });
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildFounderCircleMailtoV0(opts = {}) {
  const tr = opts.locale === "tr";
  const subject = encodeURIComponent(
    tr ? "Rhizoh Founder Circle — ilgi kaydı" : "Rhizoh Founder Circle — interest"
  );
  const body = encodeURIComponent(
    tr
      ? "Merhaba,\n\nFounder Circle için ilgi kaydı oluşturmak istiyorum.\n\nE-posta:\nKısa not (isteğe bağlı):\n\n—\nObservation ≠ Execution"
      : "Hello,\n\nI would like to register interest in the Founder Circle.\n\nEmail:\nShort note (optional):\n\n—\nObservation ≠ Execution"
  );
  return `mailto:cankasaplar@gmail.com?subject=${subject}&body=${body}`;
}

export function resetFounderCircleInterestConsoleV0() {
  founderCircleConsoleMountedV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh?.founderCircle) {
    delete window.__rhizoh.founderCircle;
  }
}

export function mountFounderCircleConsoleV0() {
  if (typeof window === "undefined" || founderCircleConsoleMountedV0) return;
  founderCircleConsoleMountedV0 = true;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.founderCircle = Object.freeze({
    interest: recordFounderCircleInterestV0,
    list: listFounderCircleInterestV0,
    export: exportFounderCircleInterestJsonV0,
    mailto: buildFounderCircleMailtoV0
  });
}
