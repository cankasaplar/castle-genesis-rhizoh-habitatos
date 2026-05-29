/**
 * Epistemic tick ledger v0.1 — cross-tick consistency (read-only history).
 *
 * tick graph · divergence over time · replayable epistemic history · A9 cross-tick closure
 * @see docs/RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md
 */

import { SYSTEM_STATE_V0 } from "./postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "./externalBoundaryValidationV0.js";

export const EPISTEMIC_TICK_LEDGER_SCHEMA_V0 = "castle.rhizoh.epistemic_tick_ledger.v0";
export const EPISTEMIC_TICK_LEDGER_NODE_SCHEMA_V0 = "castle.rhizoh.epistemic_tick_ledger_node.v0";

const MAX_LEDGER_TICKS_V0 = 512;

/** @type {readonly import('./epistemicTickLedgerV0.js').EpistemicTickLedgerNodeV0[]} */
let ledgerNodesV0 = [];
let ledgerDroppedV0 = 0;
let ledgerSessionIdV0 = `ledger_${Date.now()}`;

const STATE_RANK_V0 = Object.freeze({
  [SYSTEM_STATE_V0.LIVE_OK]: 0,
  [SYSTEM_STATE_V0.DEGRADED]: 1,
  [SYSTEM_STATE_V0.QUARANTINE]: 2
});

/**
 * @typedef {Object} EpistemicTickLedgerNodeV0
 * @property {string} schema
 * @property {number} tickSeq
 * @property {string} sessionId
 * @property {string} correlationId
 * @property {number} atMs
 * @property {string} epistemic_state
 * @property {string} playbook_state
 * @property {string} boundary_state
 * @property {boolean} compoundFault
 * @property {string} dominantResponseMode
 * @property {number|null} prevTickSeq
 * @property {string|null} stateDelta
 * @property {readonly string[]} divergenceFlags
 * @property {number|null} clientSeqHead
 * @property {number|null} gatewayLastAcceptedSeq
 * @property {number} observabilityEntryCount
 */

/**
 * @param {import('./epistemicTickEngineV0.js').EPISTEMIC_TICK_SCHEMA_V0 extends string ? Awaited<ReturnType<import('./epistemicTickEngineV0.js').runEpistemicTickV0>> : object} tick
 * @returns {EpistemicTickLedgerNodeV0}
 */
export function appendEpistemicTickToLedgerV0(tick) {
  const prev = ledgerNodesV0.length ? ledgerNodesV0[ledgerNodesV0.length - 1] : null;
  const tickSeq = (prev?.tickSeq ?? 0) + 1;
  const epistemic_state = String(tick.epistemic_state || SYSTEM_STATE_V0.LIVE_OK);
  const playbook_state = String(tick.playbook?.system_state || SYSTEM_STATE_V0.LIVE_OK);
  const boundary_state = String(tick.boundary?.boundary_state || BOUNDARY_STATE_V0.SKIPPED);

  const divergenceFlags = computeTickDivergenceFlagsV0(tick, prev);
  const stateDelta = prev ? `${prev.epistemic_state}->${epistemic_state}` : null;

  const node = Object.freeze({
    schema: EPISTEMIC_TICK_LEDGER_NODE_SCHEMA_V0,
    tickSeq,
    sessionId: ledgerSessionIdV0,
    correlationId: String(tick.correlationId || ""),
    atMs: Number(tick.tickWindow?.closedAtMs) || Date.now(),
    epistemic_state,
    playbook_state,
    boundary_state,
    compoundFault: Boolean(tick.synthesis?.compoundFault),
    dominantResponseMode: String(tick.synthesis?.dominantResponseMode || "quarantine"),
    prevTickSeq: prev?.tickSeq ?? null,
    stateDelta,
    divergenceFlags: Object.freeze(divergenceFlags),
    clientSeqHead: numOrNull(tick.boundary?.client?.clientSeqHead),
    gatewayLastAcceptedSeq: numOrNull(tick.boundary?.external?.lastAcceptedSeq),
    observabilityEntryCount: Number(tick.observability?.entries?.length) || 0
  });

  const next = [...ledgerNodesV0, node];
  if (next.length > MAX_LEDGER_TICKS_V0) {
    ledgerDroppedV0 += next.length - MAX_LEDGER_TICKS_V0;
    ledgerNodesV0 = Object.freeze(next.slice(-MAX_LEDGER_TICKS_V0));
  } else {
    ledgerNodesV0 = Object.freeze(next);
  }

  syncEpistemicTickLedgerWindowV0();

  void import("./epistemicIdentityContinuityV0.js")
    .then(({ touchEpistemicIdentityFromLedgerV0 }) => touchEpistemicIdentityFromLedgerV0())
    .catch(() => {
      /* identity touch must not break ledger */
    });

  return node;
}

/**
 * @param {object} tick
 * @param {EpistemicTickLedgerNodeV0 | null} prev
 * @returns {string[]}
 */
function computeTickDivergenceFlagsV0(tick, prev) {
  const flags = [];
  const epistemic = String(tick.epistemic_state || SYSTEM_STATE_V0.LIVE_OK);

  if (prev && stateRankV0(epistemic) > stateRankV0(prev.epistemic_state)) {
    flags.push("epistemic_state_regressed");
  }
  if (tick.boundary?.boundary_state === BOUNDARY_STATE_V0.DIVERGED) {
    flags.push("boundary_diverged");
  }
  if (tick.synthesis?.compoundFault) {
    flags.push("compound_fault");
  }
  if (prev?.compoundFault && tick.synthesis?.compoundFault) {
    flags.push("compound_fault_streak");
  }

  const clientSeq = numOrNull(tick.boundary?.client?.clientSeqHead);
  const gwSeq = numOrNull(tick.boundary?.external?.lastAcceptedSeq);
  const prevClient = prev?.clientSeqHead;
  const prevGw = prev?.gatewayLastAcceptedSeq;
  if (
    clientSeq != null &&
    gwSeq != null &&
    prevClient != null &&
    clientSeq > prevClient &&
    gwSeq <= (prevGw ?? gwSeq)
  ) {
    flags.push("client_gateway_seq_drift");
  }

  if (tick.playbook?.checks?.eventConsistency?.ok === false) {
    flags.push("ordering_regression");
  }
  if (tick.playbook?.checks?.layerTrace?.ok === false) {
    flags.push("layer_trace_fail");
  }

  return flags;
}

/**
 * @returns {{ schema: string, sessionId: string, nodes: readonly EpistemicTickLedgerNodeV0[], total: number, dropped: number }}
 */
export function getEpistemicTickLedgerV0() {
  return Object.freeze({
    schema: EPISTEMIC_TICK_LEDGER_SCHEMA_V0,
    version: "0.1",
    sessionId: ledgerSessionIdV0,
    nodes: ledgerNodesV0,
    total: ledgerNodesV0.length,
    dropped: ledgerDroppedV0
  });
}

/**
 * @returns {{ schema: string, nodes: object[], edges: object[] }}
 */
export function buildEpistemicTickGraphV0() {
  /** @type {object[]} */
  const nodes = ledgerNodesV0.map((n) =>
    Object.freeze({
      id: `tick:${n.tickSeq}`,
      tickSeq: n.tickSeq,
      correlationId: n.correlationId,
      epistemic_state: n.epistemic_state,
      compoundFault: n.compoundFault,
      atMs: n.atMs
    })
  );

  /** @type {object[]} */
  const edges = [];
  for (let i = 1; i < ledgerNodesV0.length; i++) {
    const prev = ledgerNodesV0[i - 1];
    const cur = ledgerNodesV0[i];
    edges.push(
      Object.freeze({
        kind: "sequential",
        from: `tick:${prev.tickSeq}`,
        to: `tick:${cur.tickSeq}`,
        stateDelta: cur.stateDelta
      })
    );
    if (prev.correlationId && prev.correlationId === cur.correlationId) {
      edges.push(
        Object.freeze({
          kind: "shared_correlation",
          from: `tick:${prev.tickSeq}`,
          to: `tick:${cur.tickSeq}`,
          correlationId: cur.correlationId
        })
      );
    }
  }

  return Object.freeze({
    schema: "castle.rhizoh.epistemic_tick_graph.v0",
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges)
  });
}

/**
 * Cross-tick divergence summary.
 */
export function analyzeCrossTickDivergenceV0() {
  const nodes = ledgerNodesV0;
  const flags = new Set();
  let worstState = SYSTEM_STATE_V0.LIVE_OK;
  let boundaryDivergedTicks = 0;
  let compoundStreakMax = 0;
  let compoundStreak = 0;

  for (const n of nodes) {
    for (const f of n.divergenceFlags) flags.add(f);
    if (stateRankV0(n.epistemic_state) > stateRankV0(worstState)) {
      worstState = n.epistemic_state;
    }
    if (n.boundary_state === BOUNDARY_STATE_V0.DIVERGED) boundaryDivergedTicks += 1;
    if (n.compoundFault) {
      compoundStreak += 1;
      compoundStreakMax = Math.max(compoundStreakMax, compoundStreak);
    } else {
      compoundStreak = 0;
    }
  }

  return Object.freeze({
    schema: "castle.rhizoh.cross_tick_divergence.v0",
    tickCount: nodes.length,
    worstEpistemicState: worstState,
    uniqueDivergenceFlags: Object.freeze([...flags]),
    boundaryDivergedTicks,
    compoundStreakMax,
    diverging: flags.size > 0 || worstState !== SYSTEM_STATE_V0.LIVE_OK,
    interpretationOnly: true
  });
}

/**
 * A9 cross-tick correlation closure — multi-tick compound / multi-class incidents.
 */
export function analyzeA9CrossTickCorrelationV0() {
  const nodes = ledgerNodesV0;
  /** @type {object[]} */
  const incidents = [];
  let incidentId = 0;

  /** @type {typeof nodes} */
  let buffer = [];

  const flush = () => {
    if (buffer.length < 2) {
      buffer = [];
      return;
    }
    const flags = new Set();
    let compoundCount = 0;
    for (const n of buffer) {
      for (const f of n.divergenceFlags) flags.add(f);
      if (n.compoundFault) compoundCount += 1;
    }
    incidents.push(
      Object.freeze({
        incidentId: `a9_${++incidentId}`,
        tickSeqFrom: buffer[0].tickSeq,
        tickSeqTo: buffer[buffer.length - 1].tickSeq,
        tickCount: buffer.length,
        compoundTicks: compoundCount,
        crossTickCompound: compoundCount >= 2 || flags.size >= 3,
        divergenceFlags: Object.freeze([...flags]),
        worstState: buffer.reduce(
          (w, n) => (stateRankV0(n.epistemic_state) > stateRankV0(w) ? n.epistemic_state : w),
          SYSTEM_STATE_V0.LIVE_OK
        )
      })
    );
    buffer = [];
  };

  for (const n of nodes) {
    const hot =
      n.epistemic_state !== SYSTEM_STATE_V0.LIVE_OK ||
      n.compoundFault ||
      n.divergenceFlags.length > 0;
    if (hot) {
      buffer.push(n);
    } else {
      flush();
    }
  }
  flush();

  return Object.freeze({
    schema: "castle.rhizoh.a9_cross_tick_correlation.v0",
    incidentCount: incidents.length,
    incidents: Object.freeze(incidents),
    a9Closed: incidents.some((i) => i.crossTickCompound),
    interpretationOnly: true
  });
}

/**
 * Replayable export (full ledger + graph + analyses).
 */
export function exportEpistemicTickHistoryJsonV0() {
  return JSON.stringify(
    {
      schema: EPISTEMIC_TICK_LEDGER_SCHEMA_V0,
      version: "0.1",
      exportedAtMs: Date.now(),
      ledger: getEpistemicTickLedgerV0(),
      graph: buildEpistemicTickGraphV0(),
      crossTickDivergence: analyzeCrossTickDivergenceV0(),
      a9CrossTick: analyzeA9CrossTickCorrelationV0(),
      readOnly: true
    },
    null,
    2
  );
}

/** Test-only */
export function clearEpistemicTickLedgerForTestV0() {
  ledgerNodesV0 = [];
  ledgerDroppedV0 = 0;
  ledgerSessionIdV0 = `ledger_${Date.now()}`;
  syncEpistemicTickLedgerWindowV0();
}

export function resetEpistemicTickLedgerSessionV0() {
  ledgerSessionIdV0 = `ledger_${Date.now()}`;
  ledgerNodesV0 = [];
  ledgerDroppedV0 = 0;
  syncEpistemicTickLedgerWindowV0();
}

function stateRankV0(state) {
  return STATE_RANK_V0[state] ?? 0;
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function syncEpistemicTickLedgerWindowV0() {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_tick_ledger = getEpistemicTickLedgerV0();
  window.__rhizoh.epistemicTickLedger = Object.freeze({
    ledger: getEpistemicTickLedgerV0,
    graph: buildEpistemicTickGraphV0,
    crossTickDivergence: analyzeCrossTickDivergenceV0,
    a9: analyzeA9CrossTickCorrelationV0,
    exportHistory: exportEpistemicTickHistoryJsonV0,
    resetSession: resetEpistemicTickLedgerSessionV0
  });
}
