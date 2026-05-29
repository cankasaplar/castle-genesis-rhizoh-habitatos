/**
 * Epistemic counterfactual graph v0.1 — what could have caused differently (read-only).
 *
 * Branches from actual causality · per-flag interventions · minimal-fix paths
 * @see docs/RHIZOH_EPISTEMIC_COUNTERFACTUAL_GRAPH_V0.1.md
 */

import { resolveEpistemicStateV0 } from "./epistemicTickEngineV0.js";
import { getEpistemicTickLedgerV0 } from "./epistemicTickLedgerV0.js";
import { getLastEpistemicCausalityReportV0 } from "./epistemicCausalityGraphV0.js";
import { SYSTEM_STATE_V0 } from "./postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "./externalBoundaryValidationV0.js";

export const EPISTEMIC_COUNTERFACTUAL_GRAPH_SCHEMA_V0 =
  "castle.rhizoh.epistemic_counterfactual_graph.v0";

export const COUNTERFACTUAL_EDGE_KIND_V0 = Object.freeze({
  ALTERNATE: "alternate",
  NEGATED_CAUSE: "negated_cause",
  MINIMAL_FIX: "minimal_fix"
});

/** @readonly */
const COUNTERFACTUAL_FOR_FLAG_V0 = Object.freeze({
  boundary_diverged: Object.freeze({
    label: "boundary_aligned",
    intervention: { boundary_state: BOUNDARY_STATE_V0.ALIGNED },
    question: "What if client and gateway were within tolerance?"
  }),
  compound_fault: Object.freeze({
    label: "no_compound_fault",
    intervention: { compoundFault: false },
    question: "What if synthesis did not mark compound fault?"
  }),
  compound_fault_streak: Object.freeze({
    label: "break_compound_streak",
    intervention: { compoundFault: false },
    question: "What if compound fault streak ended here?"
  }),
  client_gateway_seq_drift: Object.freeze({
    label: "seq_resynced",
    intervention: { boundary_state: BOUNDARY_STATE_V0.ALIGNED },
    question: "What if gateway seq kept pace with client?"
  }),
  ordering_regression: Object.freeze({
    label: "ordering_ok",
    intervention: { playbook_state: SYSTEM_STATE_V0.LIVE_OK },
    question: "What if WAL / event ordering were consistent?"
  }),
  layer_trace_fail: Object.freeze({
    label: "layer_trace_ok",
    intervention: { playbook_state: SYSTEM_STATE_V0.LIVE_OK },
    question: "What if layer trace / provenance passed?"
  })
});

/** Flags that are effects, not levers — skipped for per-flag CF */
const SKIP_FLAG_COUNTERFACTUAL_V0 = new Set(["epistemic_state_regressed"]);

/** @type {object | null} */
let lastCounterfactualGraphV0 = null;
/** @type {object | null} */
let lastCounterfactualReportV0 = null;

/**
 * @param {import('./epistemicTickLedgerV0.js').EpistemicTickLedgerNodeV0} node
 * @param {object} intervention
 */
export function predictCounterfactualEpistemicStateV0(node, intervention) {
  const playbook = {
    system_state: intervention.playbook_state ?? node.playbook_state
  };
  const boundary = {
    boundary_state: intervention.boundary_state ?? node.boundary_state
  };
  const synthesis = {
    compoundFault:
      intervention.compoundFault !== undefined ? intervention.compoundFault : node.compoundFault
  };
  return resolveEpistemicStateV0(playbook, boundary, synthesis);
}

/**
 * Smallest merged intervention that reaches LIVE_OK (if possible).
 *
 * @param {import('./epistemicTickLedgerV0.js').EpistemicTickLedgerNodeV0} node
 */
export function deriveMinimalCounterfactualFixV0(node) {
  /** @type {object[]} */
  const steps = [];
  if (node.playbook_state !== SYSTEM_STATE_V0.LIVE_OK) {
    steps.push({ playbook_state: SYSTEM_STATE_V0.LIVE_OK });
  }
  if (node.boundary_state === BOUNDARY_STATE_V0.DIVERGED) {
    steps.push({ boundary_state: BOUNDARY_STATE_V0.ALIGNED });
  }
  if (node.compoundFault) {
    steps.push({ compoundFault: false });
  }

  /** @type {object} */
  let merged = {};
  for (const step of steps) {
    merged = { ...merged, ...step };
    const predicted = predictCounterfactualEpistemicStateV0(node, merged);
    if (predicted === SYSTEM_STATE_V0.LIVE_OK) {
      return Object.freeze({
        interventions: Object.freeze({ ...merged }),
        predicted,
        reachable: true
      });
    }
  }

  const finalPredicted = predictCounterfactualEpistemicStateV0(node, merged);
  return Object.freeze({
    interventions: Object.freeze(merged),
    predicted: finalPredicted,
    reachable: finalPredicted === SYSTEM_STATE_V0.LIVE_OK
  });
}

/**
 * @param {number} tickSeq
 */
export function enumerateCounterfactualsForTickV0(tickSeq) {
  const ledger = getEpistemicTickLedgerV0();
  const node = ledger.nodes.find((n) => n.tickSeq === tickSeq);
  if (!node) {
    return Object.freeze({
      schema: "castle.rhizoh.tick_counterfactuals.v0",
      tickSeq,
      found: false,
      branches: Object.freeze([])
    });
  }

  /** @type {object[]} */
  const branches = [];

  for (const flag of node.divergenceFlags) {
    if (SKIP_FLAG_COUNTERFACTUAL_V0.has(flag)) continue;
    const spec = COUNTERFACTUAL_FOR_FLAG_V0[flag];
    if (!spec) continue;

    const predicted = predictCounterfactualEpistemicStateV0(node, spec.intervention);
    branches.push(
      Object.freeze({
        id: `cf:tick:${tickSeq}:${spec.label}`,
        flag,
        question: spec.question,
        intervention: spec.intervention,
        actual_epistemic_state: node.epistemic_state,
        counterfactual_epistemic_state: predicted,
        wouldChange: predicted !== node.epistemic_state
      })
    );
  }

  const minimal = deriveMinimalCounterfactualFixV0(node);
  branches.push(
    Object.freeze({
      id: `cf:tick:${tickSeq}:minimal_fix`,
      flag: "minimal_fix",
      question: "What is the smallest joint fix to reach LIVE_OK?",
      intervention: minimal.interventions,
      actual_epistemic_state: node.epistemic_state,
      counterfactual_epistemic_state: minimal.predicted,
      wouldChange: minimal.predicted !== node.epistemic_state,
      reachableLiveOk: minimal.reachable
    })
  );

  return Object.freeze({
    schema: "castle.rhizoh.tick_counterfactuals.v0",
    tickSeq,
    found: true,
    branches: Object.freeze(branches)
  });
}

/**
 * Build alternate branches for all hot ticks.
 */
export function buildEpistemicCounterfactualGraphV0() {
  const ledger = getEpistemicTickLedgerV0();
  const causality = getLastEpistemicCausalityReportV0();

  /** @type {object[]} */
  const nodes = [];
  /** @type {object[]} */
  const edges = [];

  for (const n of ledger.nodes) {
    const hot = n.divergenceFlags.length > 0 || n.epistemic_state !== SYSTEM_STATE_V0.LIVE_OK;
    if (!hot) continue;

    const enumerated = enumerateCounterfactualsForTickV0(n.tickSeq);
    nodes.push(
      Object.freeze({
        id: `actual:tick:${n.tickSeq}`,
        kind: "actual",
        tickSeq: n.tickSeq,
        epistemic_state: n.epistemic_state
      })
    );

    for (const branch of enumerated.branches) {
      nodes.push(
        Object.freeze({
          id: branch.id,
          kind: "counterfactual",
          tickSeq: n.tickSeq,
          flag: branch.flag,
          question: branch.question,
          actual_epistemic_state: branch.actual_epistemic_state,
          counterfactual_epistemic_state: branch.counterfactual_epistemic_state,
          wouldChange: branch.wouldChange
        })
      );

      edges.push(
        Object.freeze({
          kind: COUNTERFACTUAL_EDGE_KIND_V0.ALTERNATE,
          from: `actual:tick:${n.tickSeq}`,
          to: branch.id,
          wouldChange: branch.wouldChange
        })
      );

      if (branch.flag !== "minimal_fix" && !SKIP_FLAG_COUNTERFACTUAL_V0.has(branch.flag)) {
        edges.push(
          Object.freeze({
            kind: COUNTERFACTUAL_EDGE_KIND_V0.NEGATED_CAUSE,
            from: `flag:${n.tickSeq}:${branch.flag}`,
            to: branch.id,
            negated: true
          })
        );
      }
      if (branch.flag === "minimal_fix") {
        edges.push(
          Object.freeze({
            kind: COUNTERFACTUAL_EDGE_KIND_V0.MINIMAL_FIX,
            from: `actual:tick:${n.tickSeq}`,
            to: branch.id,
            reachableLiveOk: branch.reachableLiveOk
          })
        );
      }
    }
  }

  const graph = Object.freeze({
    schema: EPISTEMIC_COUNTERFACTUAL_GRAPH_SCHEMA_V0,
    version: "0.1",
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    causalityRef: causality
      ? Object.freeze({ dominantWhy: causality.dominantWhy, topCause: causality.topCauses?.[0] ?? null })
      : null,
    interpretationOnly: true,
    counterfactual: true
  });

  lastCounterfactualGraphV0 = graph;
  return graph;
}

/**
 * How many branches would flip epistemic state per layer.
 */
export function evaluateCounterfactualSensitivityV0() {
  const ledger = getEpistemicTickLedgerV0();
  /** @type {Record<string, { total: number, wouldChange: number }>} */
  const byLayer = {};

  for (const n of ledger.nodes) {
    const branches = enumerateCounterfactualsForTickV0(n.tickSeq).branches;
    for (const b of branches) {
      if (b.flag === "minimal_fix") continue;
      const spec = COUNTERFACTUAL_FOR_FLAG_V0[b.flag];
      const layer =
        b.flag === "boundary_diverged" || b.flag === "client_gateway_seq_drift"
          ? "boundary"
          : b.flag === "compound_fault" || b.flag === "compound_fault_streak"
            ? "synthesis"
            : spec
              ? "playbook"
              : "unknown";
      if (!byLayer[layer]) byLayer[layer] = { total: 0, wouldChange: 0 };
      byLayer[layer].total += 1;
      if (b.wouldChange) byLayer[layer].wouldChange += 1;
    }
  }

  return Object.freeze({
    schema: "castle.rhizoh.counterfactual_sensitivity.v0",
    byLayer: Object.freeze(
      Object.fromEntries(
        Object.entries(byLayer).map(([layer, v]) => [
          layer,
          Object.freeze({
            ...v,
            sensitivity: v.total ? round4(v.wouldChange / v.total) : 0
          })
        ])
      )
    ),
    interpretationOnly: true,
    counterfactual: true
  });
}

/**
 * Unified counterfactual report.
 */
export function evaluateEpistemicCounterfactualV0() {
  const graph = buildEpistemicCounterfactualGraphV0();
  const sensitivity = evaluateCounterfactualSensitivityV0();
  const ledger = getEpistemicTickLedgerV0();
  const tail = ledger.nodes[ledger.nodes.length - 1];
  const tailBranches = tail ? enumerateCounterfactualsForTickV0(tail.tickSeq).branches : [];

  const changeBranches = graph.nodes.filter((n) => n.kind === "counterfactual" && n.wouldChange);
  const pivotal = changeBranches[0] ?? null;

  const report = Object.freeze({
    schema: "castle.rhizoh.epistemic_counterfactual_report.v0",
    version: "0.1",
    atMs: Date.now(),
    graph: Object.freeze({
      nodeCount: graph.nodeCount,
      edgeCount: graph.edgeCount,
      alternateBranchCount: graph.nodes.filter((n) => n.kind === "counterfactual").length
    }),
    sensitivity,
    tailCounterfactuals: Object.freeze(tailBranches),
    pivotalAlternate: pivotal,
    headline:
      pivotal?.question ??
      "No hot ticks — counterfactual surface empty (actual path only).",
    centralizedArbitrationBus: false,
    interpretationOnly: true,
    counterfactual: true,
    readOnly: true
  });

  lastCounterfactualReportV0 = report;
  syncEpistemicCounterfactualWindowV0(graph, report);
  return report;
}

export function refreshEpistemicCounterfactualGraphV0() {
  return evaluateEpistemicCounterfactualV0();
}

export function getLastEpistemicCounterfactualGraphV0() {
  return lastCounterfactualGraphV0;
}

export function getLastEpistemicCounterfactualReportV0() {
  return lastCounterfactualReportV0;
}

export function exportEpistemicCounterfactualGraphJsonV0() {
  return JSON.stringify(
    {
      graph: lastCounterfactualGraphV0 ?? buildEpistemicCounterfactualGraphV0(),
      report: lastCounterfactualReportV0,
      exportedAtMs: Date.now(),
      readOnly: true,
      counterfactual: true
    },
    null,
    2
  );
}

/** Test-only */
export function clearEpistemicCounterfactualForTestV0() {
  lastCounterfactualGraphV0 = null;
  lastCounterfactualReportV0 = null;
  syncEpistemicCounterfactualWindowV0(null, null);
}

function round4(n) {
  return Math.round(n * 10_000) / 10_000;
}

function syncEpistemicCounterfactualWindowV0(graph, report) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_counterfactual = report;
  window.__rhizoh.epistemicCounterfactual = Object.freeze({
    build: buildEpistemicCounterfactualGraphV0,
    evaluate: evaluateEpistemicCounterfactualV0,
    refresh: refreshEpistemicCounterfactualGraphV0,
    enumerateTick: enumerateCounterfactualsForTickV0,
    sensitivity: evaluateCounterfactualSensitivityV0,
    predict: predictCounterfactualEpistemicStateV0,
    minimalFix: deriveMinimalCounterfactualFixV0,
    export: exportEpistemicCounterfactualGraphJsonV0
  });
}
