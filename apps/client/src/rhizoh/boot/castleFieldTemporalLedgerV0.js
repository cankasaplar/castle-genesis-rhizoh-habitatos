/**
 * Policy decision ledger + coherence gap ring (v0).
 * Records non-execution (backpressure, errors) and execution with suppressed alternatives.
 */

export const CASTLE_LEDGER_RING_CAP = 128;

/**
 * @typedef {object} CoherenceGapRecord
 * @property {string} kind
 * @property {string} detail
 * @property {string} [nonExecutionClass]
 * @property {unknown} [suppressedSnapshot]
 */

/**
 * @typedef {object} CastlePolicyLedgerEntry
 * @property {string} policyDecisionId
 * @property {number} tickIndex
 * @property {number} at
 * @property {'executed'|'skipped'|'suppressed'|'deferred'} executionStatus
 * @property {string} reason
 * @property {string[]} competingPolicies
 * @property {string|null} winnerPolicy
 * @property {number} gapSeverity
 * @property {CoherenceGapRecord|null} coherenceGap
 * @property {string[]} [deferredLanes]
 * @property {{ tceePhase?: string, presenceSeq?: number|null }|null} [canonicalSummary]
 */

/** @type {CastlePolicyLedgerEntry[]} */
let _ring = [];

/**
 * @param {number} tickIndex
 * @param {number} at
 */
export function createPolicyDecisionId(tickIndex, at = Date.now()) {
  const t = Math.max(0, Math.floor(Number(tickIndex) || 0));
  const a = Math.floor(Number(at) || Date.now());
  const r = Math.random().toString(36).slice(2, 8);
  return `pd_${t}_${a.toString(36)}_${r}`;
}

/**
 * @param {CastlePolicyLedgerEntry} entry
 */
export function appendCastleTemporalLedgerEntry(entry) {
  if (!entry || typeof entry !== "object") return;
  _ring.unshift(entry);
  if (_ring.length > CASTLE_LEDGER_RING_CAP) {
    _ring.length = CASTLE_LEDGER_RING_CAP;
  }
}

/**
 * @param {number} [limit]
 * @returns {CastlePolicyLedgerEntry[]}
 */
export function getCastleTemporalLedgerSnapshot(limit = 32) {
  const n = Math.max(1, Math.min(CASTLE_LEDGER_RING_CAP, Number(limit) || 32));
  return _ring.slice(0, n);
}

/** Test / hot reload hygiene */
export function clearCastleTemporalLedgerForTests() {
  _ring = [];
}

/**
 * @param {{
 *   tickIndex: number,
 *   basePlan: { memoryIdentity?: boolean, consolidation?: boolean },
 *   out: { canonical?: object } | null,
 *   canonical: object | null,
 *   backpressure?: { skipped?: number, lastPhysicsMs?: number } | null,
 *   physicsError?: Error | null,
 *   deferredLanes?: string[]
 * }} args
 * @returns {CastlePolicyLedgerEntry}
 */
export function buildPolicyLedgerEntryV0(args) {
  const at = Date.now();
  const tickIndex = Math.max(0, Math.floor(Number(args.tickIndex) || 0));
  const policyDecisionId = createPolicyDecisionId(tickIndex, at);
  const bp = args.backpressure && typeof args.backpressure === "object" ? args.backpressure : {};
  const skipped = Math.max(0, Number(bp.skipped) || 0);
  const deferredLanes = Array.isArray(args.deferredLanes) ? args.deferredLanes.filter(Boolean) : [];

  if (args.physicsError) {
    const err = args.physicsError;
    return {
      policyDecisionId,
      tickIndex,
      at,
      executionStatus: "suppressed",
      reason: "physics_tick_threw",
      competingPolicies: ["temporal_spine", "error_boundary"],
      winnerPolicy: "error_boundary",
      gapSeverity: Math.min(1, 0.55),
      coherenceGap: {
        kind: "non_execution",
        detail: String(err?.message || err || "physics error").slice(0, 240),
        nonExecutionClass: "exception"
      },
      deferredLanes: []
    };
  }

  const canonical = args.canonical && typeof args.canonical === "object" ? args.canonical : null;
  if (!args.out || !canonical) {
    return {
      policyDecisionId,
      tickIndex,
      at,
      executionStatus: "skipped",
      reason: "physics_backpressure_reentrant",
      competingPolicies: ["temporal_spine", "fairness_guard"],
      winnerPolicy: "fairness_guard",
      gapSeverity: Math.min(1, 0.12 + skipped * 0.025),
      coherenceGap: {
        kind: "non_execution",
        detail:
          "Physics lane did not run: backpressure guard (prior physics still marked busy or re-entrant tick).",
        nonExecutionClass: "backpressure"
      },
      deferredLanes: []
    };
  }

  const suppressed = Array.isArray(canonical.suppressed) ? canonical.suppressed : [];
  const gapSeverity = Math.min(1, suppressed.length * 0.07 + (deferredLanes.length ? 0.04 : 0));
  const competing = ["stride_clock", "phase_coherence"];
  if (canonical.policy?.wakeTemporalConstraint) competing.push("wake_temporal_lock");

  return {
    policyDecisionId,
    tickIndex,
    at,
    executionStatus: "executed",
    reason: "physics_committed",
    competingPolicies: competing,
    winnerPolicy: "temporal_spine",
    gapSeverity,
    coherenceGap:
      suppressed.length > 0
        ? {
            kind: "lane_suppressed",
            detail: `${suppressed.length} lane alternative(s) not taken this tick (stride or phase).`,
            suppressedSnapshot: suppressed.slice(0, 10)
          }
        : null,
    deferredLanes,
    canonicalSummary: {
      tceePhase: String(canonical.tceePhase || ""),
      presenceSeq: canonical.presenceSeq != null ? Number(canonical.presenceSeq) : null
    }
  };
}

/**
 * Compact bias string for LLM / router (counterfactual temporal index).
 * @param {{ limit?: number }} [opts]
 */
export function getSuppressedRealityIndexForPromptV0(opts = {}) {
  const limit = Math.max(4, Math.min(32, Number(opts.limit) || 12));
  const rows = _ring.slice(0, limit);
  if (!rows.length) {
    return {
      version: 1,
      summaryLine: "temporal_ledger: empty (no recent ticks recorded).",
      entries: []
    };
  }
  const lines = rows.map((e) => {
    const gap = e.coherenceGap;
    const gapBit = gap ? `gap=${gap.kind}` : "gap=—";
    return `t${e.tickIndex}:${e.executionStatus}:${e.reason}:${gapBit}:sev=${e.gapSeverity.toFixed(2)}`;
  });
  return {
    version: 1,
    summaryLine: lines.join(" | "),
    entries: rows.map((e) => ({
      id: e.policyDecisionId,
      tickIndex: e.tickIndex,
      executionStatus: e.executionStatus,
      reason: e.reason,
      gapSeverity: e.gapSeverity,
      coherenceKind: e.coherenceGap?.kind ?? null,
      deferredLanes: e.deferredLanes || []
    }))
  };
}
