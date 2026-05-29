/**
 * Epistemic causality graph v0.1 — explicit why-over-time structure (read-only).
 *
 * Links divergence flags · layer checks · tick transitions · identity / fingerprint shifts
 * @see docs/RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md
 */

import {
  analyzeA9CrossTickCorrelationV0,
  analyzeCrossTickDivergenceV0,
  buildEpistemicTickGraphV0,
  getEpistemicTickLedgerV0
} from "./epistemicTickLedgerV0.js";
import { getLastEpistemicIdentityContinuityReportV0 } from "./epistemicIdentityContinuityV0.js";
import { SYSTEM_STATE_V0 } from "./postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "./externalBoundaryValidationV0.js";

export const EPISTEMIC_CAUSALITY_GRAPH_SCHEMA_V0 = "castle.rhizoh.epistemic_causality_graph.v0";

export const CAUSAL_NODE_KIND_V0 = Object.freeze({
  TICK: "tick",
  DIVERGENCE_FLAG: "divergence_flag",
  LAYER: "layer",
  IDENTITY: "identity",
  BUNDLE: "bundle"
});

export const CAUSAL_EDGE_KIND_V0 = Object.freeze({
  SEQUENTIAL: "sequential",
  CAUSED: "caused",
  ESCALATED: "escalated",
  CONTRIBUTED: "contributed"
});

const FLAG_CAUSE_HINTS_V0 = Object.freeze({
  epistemic_state_regressed: {
    layer: "playbook",
    summary: "Epistemic state rank increased vs prior tick"
  },
  boundary_diverged: {
    layer: "boundary",
    summary: "Client vs gateway boundary entered DIVERGED"
  },
  compound_fault: {
    layer: "synthesis",
    summary: "Breach synthesis marked compound fault"
  },
  compound_fault_streak: {
    layer: "synthesis",
    summary: "Compound fault persisted across consecutive ticks"
  },
  client_gateway_seq_drift: {
    layer: "boundary",
    summary: "Client seq advanced while gateway seq stalled"
  },
  ordering_regression: {
    layer: "playbook",
    summary: "Event ordering / WAL consistency check failed"
  },
  layer_trace_fail: {
    layer: "playbook",
    summary: "Layer trace / provenance check failed"
  }
});

/** @type {object | null} */
let lastCausalityGraphV0 = null;
/** @type {object | null} */
let lastCausalityReportV0 = null;

/**
 * Build explicit cause → effect graph from ledger + identity context.
 */
export function buildEpistemicCausalityGraphV0() {
  const ledger = getEpistemicTickLedgerV0();
  const tickGraph = buildEpistemicTickGraphV0();
  const identity = getLastEpistemicIdentityContinuityReportV0();

  /** @type {object[]} */
  const nodes = [];
  /** @type {object[]} */
  const edges = [];
  /** @type {Map<string, object>} */
  const nodeById = new Map();

  const addNode = (node) => {
    if (nodeById.has(node.id)) return nodeById.get(node.id);
    nodeById.set(node.id, node);
    nodes.push(node);
    return node;
  };

  const addEdge = (edge) => {
    edges.push(Object.freeze(edge));
  };

  for (const n of ledger.nodes) {
    addNode(
      Object.freeze({
        id: `tick:${n.tickSeq}`,
        kind: CAUSAL_NODE_KIND_V0.TICK,
        tickSeq: n.tickSeq,
        epistemic_state: n.epistemic_state,
        playbook_state: n.playbook_state,
        boundary_state: n.boundary_state,
        compoundFault: n.compoundFault,
        atMs: n.atMs
      })
    );
  }

  for (let i = 1; i < ledger.nodes.length; i++) {
    const prev = ledger.nodes[i - 1];
    const cur = ledger.nodes[i];

    addEdge(
      Object.freeze({
        kind: CAUSAL_EDGE_KIND_V0.SEQUENTIAL,
        from: `tick:${prev.tickSeq}`,
        to: `tick:${cur.tickSeq}`,
        stateDelta: cur.stateDelta
      })
    );

    if (cur.stateDelta && cur.stateDelta !== `${prev.epistemic_state}->${cur.epistemic_state}`) {
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.ESCALATED,
          from: `tick:${prev.tickSeq}`,
          to: `tick:${cur.tickSeq}`,
          effect: "epistemic_state_change",
          stateDelta: cur.stateDelta
        })
      );
    }

    for (const flag of cur.divergenceFlags) {
      const flagId = `flag:${cur.tickSeq}:${flag}`;
      const hint = FLAG_CAUSE_HINTS_V0[flag] || { layer: "unknown", summary: flag };
      addNode(
        Object.freeze({
          id: flagId,
          kind: CAUSAL_NODE_KIND_V0.DIVERGENCE_FLAG,
          tickSeq: cur.tickSeq,
          flag,
          layer: hint.layer,
          summary: hint.summary
        })
      );
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CAUSED,
          from: flagId,
          to: `tick:${cur.tickSeq}`,
          effect: "divergence_signal"
        })
      );

      const layerId = `layer:${hint.layer}`;
      addNode(
        Object.freeze({
          id: layerId,
          kind: CAUSAL_NODE_KIND_V0.LAYER,
          layer: hint.layer
        })
      );
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CONTRIBUTED,
          from: layerId,
          to: flagId,
          effect: "layer_signal"
        })
      );

      if (flag === "boundary_diverged" || flag === "client_gateway_seq_drift") {
        addEdge(
          Object.freeze({
            kind: CAUSAL_EDGE_KIND_V0.ESCALATED,
            from: flagId,
            to: `tick:${cur.tickSeq}`,
            effect: "boundary_epistemic_coupling"
          })
        );
      }
      if (flag === "compound_fault" || flag === "compound_fault_streak") {
        addEdge(
          Object.freeze({
            kind: CAUSAL_EDGE_KIND_V0.ESCALATED,
            from: flagId,
            to: `tick:${cur.tickSeq}`,
            effect: "synthesis_epistemic_coupling"
          })
        );
      }
    }

    if (cur.compoundFault && !prev.compoundFault) {
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CAUSED,
          from: `layer:synthesis`,
          to: `tick:${cur.tickSeq}`,
          effect: "compound_fault_onset"
        })
      );
    }
    if (cur.boundary_state === BOUNDARY_STATE_V0.DIVERGED && prev.boundary_state !== BOUNDARY_STATE_V0.DIVERGED) {
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CAUSED,
          from: `layer:boundary`,
          to: `tick:${cur.tickSeq}`,
          effect: "boundary_diverged_onset"
        })
      );
    }
  }

  if (identity?.fingerprintEvolution?.head) {
    const fp = identity.fingerprintEvolution.head.fingerprint;
    const bundleId = `bundle:${fp}`;
    addNode(
      Object.freeze({
        id: bundleId,
        kind: CAUSAL_NODE_KIND_V0.BUNDLE,
        fingerprint: fp,
        epistemic_state: identity.fingerprintEvolution.head.epistemic_state
      })
    );
    const tail = ledger.nodes[ledger.nodes.length - 1];
    if (tail) {
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CONTRIBUTED,
          from: bundleId,
          to: `tick:${tail.tickSeq}`,
          effect: "audit_bundle_snapshot"
        })
      );
    }
  }

  if (identity?.verdict) {
    const idNode = `identity:${identity.verdict}`;
    addNode(
      Object.freeze({
        id: idNode,
        kind: CAUSAL_NODE_KIND_V0.IDENTITY,
        verdict: identity.verdict,
        graphDrift: identity.tickGraphDrift?.graphDriftDetected ?? false
      })
    );
    if (identity.tickGraphDrift?.graphDriftDetected) {
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CAUSED,
          from: `tick:${ledger.nodes[ledger.nodes.length - 1]?.tickSeq ?? 0}`,
          to: idNode,
          effect: "graph_drift_identity"
        })
      );
    }
    if (!identity.fingerprintEvolution?.repro?.reproConsistent) {
      addEdge(
        Object.freeze({
          kind: CAUSAL_EDGE_KIND_V0.CAUSED,
          from: `bundle:${identity.fingerprintEvolution?.repro?.fingerprintHead ?? "unknown"}`,
          to: idNode,
          effect: "fingerprint_evolution_identity"
        })
      );
    }
  }

  const graph = Object.freeze({
    schema: EPISTEMIC_CAUSALITY_GRAPH_SCHEMA_V0,
    version: "0.1",
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    tickGraphRef: Object.freeze({
      nodeCount: tickGraph.nodes.length,
      edgeCount: tickGraph.edges.length
    }),
    interpretationOnly: true
  });

  lastCausalityGraphV0 = graph;
  return graph;
}

/**
 * Why did this tick's epistemic state change?
 *
 * @param {number} tickSeq
 */
export function explainTickStateChangeV0(tickSeq) {
  const ledger = getEpistemicTickLedgerV0();
  const node = ledger.nodes.find((n) => n.tickSeq === tickSeq);
  if (!node) {
    return Object.freeze({
      schema: "castle.rhizoh.tick_state_explanation.v0",
      tickSeq,
      found: false
    });
  }

  const prev = ledger.nodes.find((n) => n.tickSeq === node.prevTickSeq);
  const incoming = lastCausalityGraphV0?.edges?.filter((e) => e.to === `tick:${tickSeq}`) ?? [];

  /** @type {object[]} */
  const primaryCauses = [];
  for (const flag of node.divergenceFlags) {
    const hint = FLAG_CAUSE_HINTS_V0[flag];
    primaryCauses.push(
      Object.freeze({
        flag,
        layer: hint?.layer ?? "unknown",
        summary: hint?.summary ?? flag
      })
    );
  }

  return Object.freeze({
    schema: "castle.rhizoh.tick_state_explanation.v0",
    tickSeq,
    found: true,
    fromState: prev?.epistemic_state ?? null,
    toState: node.epistemic_state,
    stateDelta: node.stateDelta,
    primaryCauses: Object.freeze(primaryCauses),
    incomingEdges: Object.freeze(incoming),
    interpretationOnly: true
  });
}

/**
 * BFS causal path between graph node ids.
 *
 * @param {string} fromId
 * @param {string} toId
 */
export function traceCausalPathV0(fromId, toId) {
  const graph = lastCausalityGraphV0 ?? buildEpistemicCausalityGraphV0();
  /** @type {Map<string, string[]>} */
  const adj = new Map();
  for (const e of graph.edges) {
    const list = adj.get(e.from) || [];
    list.push(e.to);
    adj.set(e.from, list);
  }

  const queue = [[fromId]];
  const visited = new Set();
  while (queue.length) {
    const path = queue.shift();
    const tip = path[path.length - 1];
    if (tip === toId) {
      return Object.freeze({
        schema: "castle.rhizoh.causal_path.v0",
        from: fromId,
        to: toId,
        found: true,
        path: Object.freeze(path)
      });
    }
    if (visited.has(tip)) continue;
    visited.add(tip);
    for (const next of adj.get(tip) || []) {
      queue.push([...path, next]);
    }
  }

  return Object.freeze({
    schema: "castle.rhizoh.causal_path.v0",
    from: fromId,
    to: toId,
    found: false,
    path: Object.freeze([])
  });
}

/**
 * Aggregate top causes + cross-tick context.
 */
export function evaluateEpistemicCausalityV0() {
  const graph = buildEpistemicCausalityGraphV0();
  const crossTick = analyzeCrossTickDivergenceV0();
  const a9 = analyzeA9CrossTickCorrelationV0();
  const ledger = getEpistemicTickLedgerV0();
  const tail = ledger.nodes[ledger.nodes.length - 1];

  /** @type {Record<string, number>} */
  const causeHistogram = {};
  for (const n of graph.nodes) {
    if (n.kind !== CAUSAL_NODE_KIND_V0.DIVERGENCE_FLAG) continue;
    causeHistogram[n.flag] = (causeHistogram[n.flag] || 0) + 1;
  }

  const topCauses = Object.entries(causeHistogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([flag, count]) =>
      Object.freeze({
        flag,
        count,
        layer: FLAG_CAUSE_HINTS_V0[flag]?.layer ?? "unknown",
        summary: FLAG_CAUSE_HINTS_V0[flag]?.summary ?? flag
      })
    );

  const lastTransition = tail ? explainTickStateChangeV0(tail.tickSeq) : null;

  const report = Object.freeze({
    schema: "castle.rhizoh.epistemic_causality_report.v0",
    version: "0.1",
    atMs: Date.now(),
    graph: Object.freeze({
      nodeCount: graph.nodeCount,
      edgeCount: graph.edgeCount
    }),
    topCauses: Object.freeze(topCauses),
    lastTransition,
    crossTickDivergence: crossTick,
    a9Incidents: a9.incidentCount,
    dominantWhy:
      topCauses[0]?.summary ??
      (tail?.stateDelta ? `Last transition: ${tail.stateDelta}` : "No causal signals yet"),
    centralizedArbitrationBus: false,
    interpretationOnly: true,
    readOnly: true
  });

  lastCausalityReportV0 = report;
  syncEpistemicCausalityWindowV0(graph, report);

  void import("./epistemicCounterfactualGraphV0.js")
    .then(({ refreshEpistemicCounterfactualGraphV0 }) => refreshEpistemicCounterfactualGraphV0())
    .catch(() => {
      /* counterfactual must not break causality */
    });

  return report;
}

export function refreshEpistemicCausalityGraphV0() {
  return evaluateEpistemicCausalityV0();
}

export function getLastEpistemicCausalityGraphV0() {
  return lastCausalityGraphV0;
}

export function getLastEpistemicCausalityReportV0() {
  return lastCausalityReportV0;
}

export function exportEpistemicCausalityGraphJsonV0() {
  const graph = lastCausalityGraphV0 ?? buildEpistemicCausalityGraphV0();
  const report = lastCausalityReportV0;
  return JSON.stringify(
    {
      graph,
      report,
      exportedAtMs: Date.now(),
      readOnly: true
    },
    null,
    2
  );
}

/** Test-only */
export function clearEpistemicCausalityForTestV0() {
  lastCausalityGraphV0 = null;
  lastCausalityReportV0 = null;
  syncEpistemicCausalityWindowV0(null, null);
}

function syncEpistemicCausalityWindowV0(graph, report) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_causality = report;
  window.__rhizoh.epistemicCausality = Object.freeze({
    build: buildEpistemicCausalityGraphV0,
    evaluate: evaluateEpistemicCausalityV0,
    refresh: refreshEpistemicCausalityGraphV0,
    explainTick: explainTickStateChangeV0,
    tracePath: traceCausalPathV0,
    lastGraph: () => lastCausalityGraphV0,
    lastReport: () => lastCausalityReportV0,
    export: exportEpistemicCausalityGraphJsonV0
  });
}
