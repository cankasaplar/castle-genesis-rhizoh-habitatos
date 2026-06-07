/**
 * Transcript acceptance ledger — STT heard vs pipeline accepted vs turn-bound.
 * Observation-only; never blocks execution.
 */

export const RHIZOH_TRANSCRIPT_ACCEPTANCE_LEDGER_SCHEMA_V0 =
  "rhizoh.transcript_acceptance_ledger.v0";

const RING_MAX_V0 = 24;

/** @type {{ accepted: number, rejected: number, deferred: number, reasonCounts: Record<string, number>, ring: object[] }} */
const ledgerStateV0 = {
  accepted: 0,
  rejected: 0,
  deferred: 0,
  reasonCounts: {},
  ring: []
};

function bumpReasonV0(reason) {
  const key = String(reason || "unknown").trim() || "unknown";
  ledgerStateV0.reasonCounts[key] = (ledgerStateV0.reasonCounts[key] || 0) + 1;
}

function pushRingV0(row) {
  ledgerStateV0.ring = [...ledgerStateV0.ring.slice(-(RING_MAX_V0 - 1)), Object.freeze(row)];
}

function publishWindowV0() {
  if (typeof window === "undefined") return;
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.transcriptAcceptance = getTranscriptAcceptanceSnapshotV0();
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   text?: string,
 *   reason?: string,
 *   dropKind?: string,
 *   source?: string,
 *   sessionId?: string,
 *   confidence?: number,
 *   band?: string,
 *   pipelinePath?: string
 * }} opts
 */
export function recordTranscriptRejectedV0(opts = {}) {
  ledgerStateV0.rejected += 1;
  const reason = String(opts.reason || "rejected").trim() || "rejected";
  bumpReasonV0(reason);
  const row = Object.freeze({
    outcome: "rejected",
    atMs: Date.now(),
    reason,
    dropKind: opts.dropKind ? String(opts.dropKind) : undefined,
    preview: String(opts.text || "").slice(0, 96),
    source: opts.source ? String(opts.source) : undefined,
    sessionId: opts.sessionId ? String(opts.sessionId) : undefined,
    confidence: Number.isFinite(Number(opts.confidence)) ? Number(opts.confidence) : undefined,
    band: opts.band ? String(opts.band) : undefined,
    pipelinePath: opts.pipelinePath ? String(opts.pipelinePath) : undefined
  });
  pushRingV0(row);
  publishWindowV0();
  return row;
}

/**
 * @param {{
 *   text?: string,
 *   source?: string,
 *   sessionId?: string,
 *   confidence?: number,
 *   band?: string,
 *   pipelinePath?: string,
 *   turnBound?: boolean
 * }} opts
 */
export function recordTranscriptAcceptedV0(opts = {}) {
  ledgerStateV0.accepted += 1;
  const row = Object.freeze({
    outcome: "accepted",
    atMs: Date.now(),
    reason: "accepted_transcript",
    preview: String(opts.text || "").slice(0, 96),
    source: opts.source ? String(opts.source) : undefined,
    sessionId: opts.sessionId ? String(opts.sessionId) : undefined,
    confidence: Number.isFinite(Number(opts.confidence)) ? Number(opts.confidence) : undefined,
    band: opts.band ? String(opts.band) : undefined,
    pipelinePath: opts.pipelinePath ? String(opts.pipelinePath) : undefined,
    turnBound: opts.turnBound === true
  });
  pushRingV0(row);
  publishWindowV0();
  return row;
}

/**
 * @param {{ text?: string, reason?: string, source?: string, sessionId?: string }} opts
 */
export function recordTranscriptDeferredV0(opts = {}) {
  ledgerStateV0.deferred += 1;
  const reason = String(opts.reason || "hold").trim() || "hold";
  bumpReasonV0(reason);
  const row = Object.freeze({
    outcome: "deferred",
    atMs: Date.now(),
    reason,
    preview: String(opts.text || "").slice(0, 96),
    source: opts.source ? String(opts.source) : undefined,
    sessionId: opts.sessionId ? String(opts.sessionId) : undefined
  });
  pushRingV0(row);
  publishWindowV0();
  return row;
}

export function getTranscriptAcceptanceSnapshotV0() {
  const reasons = Object.entries(ledgerStateV0.reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => Object.freeze({ reason, count }));

  return Object.freeze({
    schema: RHIZOH_TRANSCRIPT_ACCEPTANCE_LEDGER_SCHEMA_V0,
    accepted: ledgerStateV0.accepted,
    rejected: ledgerStateV0.rejected,
    deferred: ledgerStateV0.deferred,
    rejectionReasons: Object.freeze(reasons),
    last: ledgerStateV0.ring.length ? ledgerStateV0.ring[ledgerStateV0.ring.length - 1] : null,
    tail: Object.freeze(ledgerStateV0.ring.slice(-5)),
    turnGap: ledgerStateV0.rejected + ledgerStateV0.deferred > 0 && ledgerStateV0.accepted === 0
  });
}

export function __resetTranscriptAcceptanceLedgerForTestV0() {
  ledgerStateV0.accepted = 0;
  ledgerStateV0.rejected = 0;
  ledgerStateV0.deferred = 0;
  ledgerStateV0.reasonCounts = {};
  ledgerStateV0.ring = [];
  publishWindowV0();
}
