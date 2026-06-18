/**
 * Shadow Trace Ledger v0 — counterfactual evidence chain (not console log).
 * Pre-legality epistemic dry-run: observation graph without execution/UI effect.
 * RESEARCH-ONLY — never feeds drift detection or move selection.
 */

import { isRhizohLegalPendingHoldV0 } from "./rhizohLegalPendingWaitLoopV0.js";

export const RHIZOH_SHADOW_TRACE_LEDGER_SCHEMA_V0 = "castle.rhizoh.shadow_trace_ledger.v0";
export const RHIZOH_SHADOW_TRACE_EVENT_V0 = "rhizoh:shadow-trace-ledger-v0";

export const SHADOW_SOURCE_SYSTEM_V0 = Object.freeze({
  CHESS: "chess",
  MAP: "map",
  COUNCIL: "council",
  COMPLIANCE: "compliance",
  STREAM: "stream"
});

export const SHADOW_TRUST_CLASS_V0 = Object.freeze({
  TRUSTED: "trusted",
  UNTRUSTED: "untrusted",
  ADVERSARIAL: "adversarial"
});

/** Ledger rows must not close feedback loops into drift/policy/move paths. */
export const SHADOW_LEDGER_GOVERNANCE_V0 = Object.freeze({
  feedsDriftDetection: false,
  feedsMoveSelection: false,
  feedsPolicyDiff: false,
  executionEffect: false,
  uiEffect: false,
  epistemicRole: "shadow_trace"
});

const RING_MAX_V0 = 512;
let recordSeqV0 = 0;

/** @type {object[]} */
const ringV0 = [];

/**
 * Shadow Mode = parallel observation runtime without execution authority.
 * @returns {boolean}
 */
export function isRhizohShadowModeActiveV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.shadowMode?.force === true) {
    return true;
  }
  try {
    if (isRhizohLegalPendingHoldV0()) return true;
  } catch {
    /* noop */
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_SHADOW_MODE === "1") {
    return true;
  }
  return false;
}

/**
 * @param {{
 *   sourceSystem?: string,
 *   eventType?: string,
 *   entropyScore?: number|null,
 *   causalChainId?: string|null,
 *   policyContext?: object|null,
 *   hypotheticalOutcome?: string|null,
 *   trustClass?: string,
 *   matchId?: string|null,
 *   slotId?: number|null,
 *   payload?: object|null
 * }} row
 */
export function appendShadowTraceRecordV0(row = {}) {
  if (!isRhizohShadowModeActiveV0()) return null;

  recordSeqV0 += 1;
  const record = Object.freeze({
    schema: RHIZOH_SHADOW_TRACE_LEDGER_SCHEMA_V0,
    recordId: `shadow_${recordSeqV0}_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    atMs: Date.now(),
    sourceSystem: String(row.sourceSystem || SHADOW_SOURCE_SYSTEM_V0.CHESS),
    eventType: String(row.eventType || "observation"),
    entropyScore:
      row.entropyScore == null ? null : Number(Number(row.entropyScore).toFixed(4)),
    causalChainId: row.causalChainId || null,
    policyContext: row.policyContext ? Object.freeze({ ...row.policyContext }) : null,
    hypotheticalOutcome: row.hypotheticalOutcome || null,
    trustClass: row.trustClass || SHADOW_TRUST_CLASS_V0.TRUSTED,
    matchId: row.matchId || null,
    slotId: row.slotId ?? null,
    payload: row.payload ? Object.freeze({ ...row.payload }) : null,
    governance: SHADOW_LEDGER_GOVERNANCE_V0,
    shadowMode: true
  });

  ringV0.push(record);
  while (ringV0.length > RING_MAX_V0) ringV0.shift();
  publishShadowTraceLedgerV0(record);
  return record;
}

function publishShadowTraceLedgerV0(lastRecord = null) {
  if (typeof window === "undefined") return;
  const snap = getShadowTraceLedgerSnapshotV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.shadowTraceLedger = snap;
  if (lastRecord) {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SHADOW_TRACE_EVENT_V0, { detail: lastRecord })
      );
    } catch {
      /* noop */
    }
  }
}

/**
 * @param {object} driftEnvelope — from buildChessDriftLogEnvelopeV0
 */
export function appendShadowTraceFromDriftEventV0(driftEnvelope) {
  if (!driftEnvelope || driftEnvelope.kind !== "DRIFT_EVENT") return null;
  const entropy = Number(driftEnvelope.entropyScore ?? driftEnvelope.driftMagnitude) || 0;
  const eventType = String(driftEnvelope.eventType || "TOPOLOGY_DRIFT");
  const severity = String(driftEnvelope.severity || "info");

  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.CHESS,
    eventType,
    entropyScore: entropy,
    causalChainId: driftEnvelope.causalChainId || null,
    matchId: driftEnvelope.matchId || null,
    slotId: driftEnvelope.slotId ?? driftEnvelope.clusterId ?? null,
    policyContext: Object.freeze({
      severity,
      canonicalPattern: driftEnvelope.canonicalPattern || null,
      mirrorPattern: driftEnvelope.mirrorPattern || null,
      playedFamily: driftEnvelope.playedFamily || null,
      expectedFamily: driftEnvelope.expectedFamily || null
    }),
    hypotheticalOutcome:
      severity === "warn"
        ? "If executed in live kernel: policy_diff would mark drifted; move path unchanged in shadow."
        : "If executed in live kernel: topology would remain locked; no execution branch taken.",
    payload: driftEnvelope
  });
}

/**
 * @param {object} councilObservation
 */
export function appendShadowTraceFromCouncilV0(councilObservation) {
  if (!councilObservation) return null;
  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.COUNCIL,
    eventType: "COUNCIL_EMIT_OBSERVATION",
    entropyScore: 0.5,
    causalChainId: `council_${councilObservation.sessionId || "na"}`,
    matchId: councilObservation.matchId || null,
    slotId: councilObservation.slotId ?? null,
    policyContext: Object.freeze({
      triggers: councilObservation.triggers || [],
      governance: councilObservation.governance || null
    }),
    hypotheticalOutcome:
      "If executed in live kernel: multi-lens annotation only — no move override, no drift feedback.",
    payload: councilObservation
  });
}

/**
 * @param {{ matchId?: string, fen?: string, movetimeMs?: number, depth?: number }} detail
 */
export function appendShadowTraceFromStockfishTimeoutV0(detail = {}) {
  return appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.CHESS,
    eventType: "STOCKFISH_TIMEOUT",
    entropyScore: 0.65,
    causalChainId: `stockfish_timeout_${String(detail.matchId || "na")}_${Date.now()}`,
    matchId: detail.matchId || null,
    policyContext: Object.freeze({
      movetimeMs: detail.movetimeMs ?? null,
      depth: detail.depth ?? null,
      fen: detail.fen ? String(detail.fen).slice(0, 48) : null
    }),
    hypotheticalOutcome:
      "If executed in live kernel: heuristic fallback move would play; clock continues; no UI mutation in shadow.",
    payload: detail
  });
}

/**
 * Compliance / YouTube-style deterministic snapshot boundary (state export, not video).
 * @param {string} [label]
 */
export function exportShadowComplianceSnapshotV0(label = "checkpoint") {
  const snap = getShadowTraceLedgerSnapshotV0();
  const driftRows = snap.recent.filter((r) =>
    String(r.eventType || "").includes("DRIFT")
  );
  const councilRows = snap.recent.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.COUNCIL);
  const timeoutRows = snap.recent.filter((r) => r.eventType === "STOCKFISH_TIMEOUT");

  const entropySum = driftRows.reduce((a, r) => a + (Number(r.entropyScore) || 0), 0);
  const entropyMean = driftRows.length ? entropySum / driftRows.length : 0;

  const checkpoint = Object.freeze({
    schema: "castle.rhizoh.shadow_compliance_snapshot.v0",
    snapshotId: `shadow_snap_${Date.now().toString(36)}`,
    label,
    atMs: Date.now(),
    shadowMode: isRhizohShadowModeActiveV0(),
    recordCount: snap.recordCount,
    entropySummary: Object.freeze({
      mean: Number(entropyMean.toFixed(4)),
      max: driftRows.reduce((m, r) => Math.max(m, Number(r.entropyScore) || 0), 0),
      driftEventCount: driftRows.length
    }),
    driftDeltaGraph: Object.freeze(
      driftRows.slice(-24).map((r) =>
        Object.freeze({
          causalChainId: r.causalChainId,
          entropyScore: r.entropyScore,
          slotId: r.slotId,
          eventType: r.eventType
        })
      )
    ),
    councilAggregate: Object.freeze({
      sessionHints: councilRows.length,
      lastTrigger: councilRows[councilRows.length - 1]?.policyContext?.triggers || []
    }),
    timeoutCount: timeoutRows.length,
    governance: SHADOW_LEDGER_GOVERNANCE_V0
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.shadowComplianceSnapshot = checkpoint;
  }

  return checkpoint;
}

export function getShadowTraceLedgerSnapshotV0() {
  const recent = Object.freeze([...ringV0].slice(-32));
  const bySource = Object.freeze({
    chess: ringV0.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.CHESS).length,
    council: ringV0.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.COUNCIL).length,
    map: ringV0.filter((r) => r.sourceSystem === SHADOW_SOURCE_SYSTEM_V0.MAP).length
  });

  return Object.freeze({
    schema: RHIZOH_SHADOW_TRACE_LEDGER_SCHEMA_V0,
    shadowMode: isRhizohShadowModeActiveV0(),
    recordCount: ringV0.length,
    bySource,
    recent,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetShadowTraceLedgerForTestV0() {
  ringV0.length = 0;
  recordSeqV0 = 0;
  if (typeof window !== "undefined") {
    delete window.__rhizoh?.shadowTraceLedger;
    delete window.__rhizoh?.shadowComplianceSnapshot;
  }
}
