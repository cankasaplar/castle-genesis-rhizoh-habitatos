/**
 * OLP output mismatch telemetry — catches TR instant ack / LLM leak under EN policy.
 */

import { detectInputLanguageV0, MF0_DETECTED_LANGUAGE_V0 } from "./rhizohMeaningFrameV0.js";
import { detectRhizohMultilingualLocaleV0 } from "./rhizohMultilingualBridgeV0.js";
import {
  OLP_MODE_V0,
  readOutputLanguagePolicyV0,
  resolveOutputLanguageCodeV0
} from "./rhizohOutputLanguagePolicyV0.js";

export const LANGUAGE_VIOLATION_SCHEMA_V0 = "castle.rhizoh.language_violation.v0";

const LOG_MAX = 24;
/** @type {Readonly<Record<string, unknown>>[]} */
let violationLog = [];

/**
 * @param {{
 *   expected: string,
 *   actual: string,
 *   source: string,
 *   severity?: "soft_repair" | "hard_rewrite",
 *   preview?: string
 * }} row
 */
export function reportLanguageViolationV0(row) {
  const entry = Object.freeze({
    schema: LANGUAGE_VIOLATION_SCHEMA_V0,
    atMs: Date.now(),
    expected: String(row.expected || ""),
    actual: String(row.actual || ""),
    source: String(row.source || "unknown"),
    severity: row.severity === "hard_rewrite" ? "hard_rewrite" : "soft_repair",
    preview: String(row.preview || "").slice(0, 120)
  });
  violationLog = [...violationLog, entry].slice(-LOG_MAX);
  if (typeof window !== "undefined") {
    window.__RHIZOH_LANGUAGE_VIOLATIONS__ = Object.freeze([...violationLog]);
    window.__CASTLE_LANGUAGE_VIOLATION_LAST__ = entry;
  }
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[Rhizoh LANGUAGE_VIOLATION_DETECTED]", entry);
  }
  return entry;
}

/**
 * @param {string} text
 * @param {string} source — instant_ack | tts | llm
 * @returns {{ ok: boolean, expected?: string, actual?: string }}
 */
export function checkTextMatchesOutputLanguageV0(text, source) {
  const sample = String(text || "").trim();
  if (!sample) return { ok: true };
  const olp = readOutputLanguagePolicyV0();
  if (olp.mode !== OLP_MODE_V0.UI_LOCKED_OUTPUT) return { ok: true };

  const expected = resolveOutputLanguageCodeV0();
  const mf = detectInputLanguageV0(sample);
  let detected =
    mf !== MF0_DETECTED_LANGUAGE_V0.UNKNOWN && mf !== MF0_DETECTED_LANGUAGE_V0.MIXED
      ? String(mf)
      : detectRhizohMultilingualLocaleV0(sample.slice(0, 600), "").code;
  if (/[ğıüşöçİĞÜŞÖÇ]/.test(sample)) detected = "tr";
  if (/\b(tamam|dinliyorum|anladım|merhaba|nasılsın|buradayız)\b/i.test(sample)) {
    detected = "tr";
  }
  if (detected === expected || detected === "und" || detected === "mixed") {
    return { ok: true };
  }

  reportLanguageViolationV0({
    expected,
    actual: detected,
    source,
    severity: "soft_repair",
    preview: sample
  });
  return { ok: false, expected, actual: detected };
}

/** @internal vitest */
export function __resetLanguageViolationsForTestV0() {
  violationLog = [];
  if (typeof window !== "undefined") {
    try {
      delete window.__RHIZOH_LANGUAGE_VIOLATIONS__;
      delete window.__CASTLE_LANGUAGE_VIOLATION_LAST__;
    } catch {
      /* noop */
    }
  }
}
