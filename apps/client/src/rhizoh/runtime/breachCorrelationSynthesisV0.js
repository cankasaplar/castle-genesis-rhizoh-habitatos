/**
 * Breach correlation & global synthesis v0.1 — READ-ONLY interpretation layer.
 *
 * trace → correlation → systemic understanding (no enforcement).
 * @see docs/RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md
 */

import {
  BREACH_RESPONSE_MODE_V0,
  getBreachObservationTraceV0
} from "./violationObservationLogV0.js";
import {
  beginBreachCorrelationWindowV0,
  endBreachCorrelationWindowV0,
  getActiveCorrelationIdV0,
  clearBreachCorrelationWindowForTestV0
} from "./breachCorrelationWindowV0.js";

export {
  beginBreachCorrelationWindowV0,
  endBreachCorrelationWindowV0,
  getActiveCorrelationIdV0,
  clearBreachCorrelationWindowForTestV0
};

export const BREACH_COHERENCE_REPORT_SCHEMA_V0 = "castle.rhizoh.breach_coherence_report.v0";

export const RESPONSE_MODE_PRECEDENCE_V0 = Object.freeze([
  BREACH_RESPONSE_MODE_V0.REVOKE,
  BREACH_RESPONSE_MODE_V0.QUARANTINE,
  BREACH_RESPONSE_MODE_V0.CORRECTION_CHAIN,
  BREACH_RESPONSE_MODE_V0.SHADOW
]);

/**
 * @param {string[]} modes
 * @returns {string}
 */
export function resolveDominantResponseModeV0(modes) {
  const set = new Set(modes.filter(Boolean));
  for (const mode of RESPONSE_MODE_PRECEDENCE_V0) {
    if (set.has(mode)) return mode;
  }
  return BREACH_RESPONSE_MODE_V0.QUARANTINE;
}

/**
 * @param {readonly { violationClass?: string, context?: object }[]} entries
 * @returns {string[]}
 */
function collectViolationClassesV0(entries) {
  const classes = new Set();
  for (const e of entries) {
    if (e.violationClass) classes.add(e.violationClass);
    const failed = /** @type {string[] | undefined} */ (e.context?.failedChecks);
    if (Array.isArray(failed)) {
      for (const f of failed) {
        if (f === "layerTrace") classes.add("DATA_INTEGRITY");
        if (f === "eventConsistency") classes.add("CAUSAL_INTEGRITY");
        if (f === "nodeHealthEcho") classes.add("PEER_INGRESS");
      }
    }
  }
  return [...classes];
}

/**
 * @param {{
 *   correlationId?: string | null,
 *   windowMs?: number,
 *   sinceSeq?: number
 * }} [opts]
 */
export function synthesizeBreachCoherenceV0(opts = {}) {
  const trace = getBreachObservationTraceV0();
  const nowMs = Date.now();
  const windowMs = Number(opts.windowMs) || 120_000;
  const sinceSeq = Number.isFinite(opts.sinceSeq) ? Number(opts.sinceSeq) : 0;

  let entries = trace.entries.filter((e) => e.seq >= sinceSeq);

  if (opts.correlationId) {
    entries = entries.filter((e) => e.correlationId === opts.correlationId);
  } else {
    entries = entries.filter((e) => nowMs - e.atMs <= windowMs);
  }

  const violationClasses = collectViolationClassesV0(entries);
  const modes = entries.map((e) => e.responseMode);
  const dominantResponseMode = resolveDominantResponseModeV0(modes);
  const compoundFault =
    entries.length >= 2 ||
    violationClasses.length >= 2 ||
    entries.some(
      (e) => Array.isArray(e.context?.failedChecks) && e.context.failedChecks.length >= 2
    );

  const captainRequired = entries.some((e) => e.captainRequired);
  const sources = [...new Set(entries.map((e) => e.source))];

  const systemicSummary = compoundFault
    ? `Compound breach: ${violationClasses.join(" + ") || "multi-signal"} across ${sources.length} source(s); dominant mode ${dominantResponseMode} (precedence interpretation).`
    : entries.length
      ? `Single breach trace (${entries.length}); dominant mode ${dominantResponseMode}.`
      : "No breach observations in scope.";

  const report = Object.freeze({
    schema: BREACH_COHERENCE_REPORT_SCHEMA_V0,
    version: "0.1",
    atMs: nowMs,
    correlationId: opts.correlationId ?? getActiveCorrelationIdV0(),
    entryCount: entries.length,
    entries: Object.freeze([...entries]),
    violationClasses: Object.freeze(violationClasses),
    compoundFault,
    dominantResponseMode,
    captainRequired,
    sources: Object.freeze(sources),
    systemicSummary,
    centralizedArbitrationBus: false,
    interpretationOnly: true
  });

  syncBreachSynthesisWindowV0(report);
  return report;
}

export function clearBreachCorrelationStateForTestV0() {
  clearBreachCorrelationWindowForTestV0();
  syncBreachSynthesisWindowV0(null);
}

function syncBreachSynthesisWindowV0(lastReport = null) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh.breachSynthesis = Object.freeze({
    activeCorrelationId: () => getActiveCorrelationIdV0(),
    beginWindow: beginBreachCorrelationWindowV0,
    endWindow: endBreachCorrelationWindowV0,
    coherence: (opts) => synthesizeBreachCoherenceV0(opts),
    lastReport: () => lastReport
  });
}
