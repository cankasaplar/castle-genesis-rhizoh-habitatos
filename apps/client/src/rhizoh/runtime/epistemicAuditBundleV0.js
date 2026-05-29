/**
 * Epistemic audit bundle v0.1 — Go-Live §6 evidence atom (single run, single correlationId).
 *
 * Unifies: violation-sim · §7 tick · observability · synthesis · boundary · ledger · stability
 * @see docs/RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md
 */

import {
  beginBreachCorrelationWindowV0,
  endBreachCorrelationWindowV0
} from "./breachCorrelationWindowV0.js";
import { synthesizeBreachCoherenceV0 } from "./breachCorrelationSynthesisV0.js";
import { runEpistemicTickV0 } from "./epistemicTickEngineV0.js";
import {
  buildEpistemicTickGraphV0,
  getEpistemicTickLedgerV0
} from "./epistemicTickLedgerV0.js";
import {
  evaluateEpistemicStabilityV0,
  getLastEpistemicStabilityReportV0
} from "./epistemicStabilityControllerV0.js";
import { SYSTEM_STATE_V0 } from "./postGoLiveIntegrityLoopV0.js";
import { getBreachObservationTraceV0 } from "./violationObservationLogV0.js";
import { runViolationSimulationSuiteV0 } from "./violationSimulationSuiteV0.js";

export const EPISTEMIC_AUDIT_BUNDLE_SCHEMA_V0 = "castle.rhizoh.epistemic_audit_bundle.v0";

const DEFAULT_LEDGER_SLICE_TICKS_V0 = 32;

/** @type {object | null} */
let lastAuditBundleV0 = null;

/**
 * One correlationId · one run · full §6 export snapshot (read-only).
 *
 * @param {{
 *   correlationId?: string,
 *   label?: string,
 *   collectSignals?: () => object,
 *   fetchExternal?: boolean,
 *   observe?: boolean,
 *   requireGateway?: boolean,
 *   timeoutMs?: number,
 *   runSimulation?: boolean,
 *   scenarioIds?: string[],
 *   recordLedger?: boolean,
 *   recordStability?: boolean,
 *   ledgerSliceTicks?: number,
 *   endCorrelationWindow?: boolean,
 *   stabilityOpts?: object
 * }} [opts]
 */
export async function runEpistemicAuditBundleV0(opts = {}) {
  const openedAtMs = Date.now();
  const correlationId =
    opts.correlationId ??
    beginBreachCorrelationWindowV0({ label: opts.label || "go_live_§6_audit_bundle" });

  /** @type {Awaited<ReturnType<typeof runViolationSimulationSuiteV0>> | null} */
  let simulation = null;
  if (opts.runSimulation !== false) {
    simulation = await runViolationSimulationSuiteV0({
      scenarioIds: opts.scenarioIds,
      print: false
    });
  }

  const tick = await runEpistemicTickV0({
    correlationId,
    collectSignals: opts.collectSignals,
    fetchExternal: opts.fetchExternal,
    observe: opts.observe,
    requireGateway: opts.requireGateway,
    timeoutMs: opts.timeoutMs,
    endCorrelationWindow: false,
    recordLedger: opts.recordLedger,
    recordStability: opts.recordStability,
    label: opts.label || "go_live_§6_audit_tick"
  });

  const trace = getBreachObservationTraceV0();
  const observabilitySlice = Object.freeze({
    schema: trace.schema,
    correlationId,
    entries: Object.freeze(trace.entries.filter((e) => e.correlationId === correlationId)),
    totalGlobal: trace.total,
    dropped: trace.dropped
  });

  const synthesis = synthesizeBreachCoherenceV0({ correlationId });
  const ledger = getEpistemicTickLedgerV0();
  const sliceTicks = Number(opts.ledgerSliceTicks) || DEFAULT_LEDGER_SLICE_TICKS_V0;
  const ledgerSlice = Object.freeze({
    sessionId: ledger.sessionId,
    total: ledger.total,
    dropped: ledger.dropped,
    nodes: Object.freeze(ledger.nodes.slice(-sliceTicks))
  });
  const tickGraph = buildEpistemicTickGraphV0();

  const stability =
    getLastEpistemicStabilityReportV0() ??
    evaluateEpistemicStabilityV0(opts.stabilityOpts || {});

  if (opts.endCorrelationWindow !== false) {
    endBreachCorrelationWindowV0();
  }

  const closedAtMs = Date.now();
  const simulationLawOk = simulation == null ? null : Boolean(simulation.allPassed);

  const bundle = Object.freeze({
    schema: EPISTEMIC_AUDIT_BUNDLE_SCHEMA_V0,
    version: "0.1",
    goLiveEvidenceAtom: true,
    goLiveSection: "§6",
    correlationId,
    bundleId: `audit_${correlationId}`,
    tickWindow: Object.freeze({
      openedAtMs,
      closedAtMs,
      durationMs: closedAtMs - openedAtMs
    }),
    simulation,
    tick: Object.freeze(sanitizeTickSnapshotV0(tick)),
    observability: observabilitySlice,
    synthesis: Object.freeze({ ...synthesis }),
    boundary: Object.freeze({
      boundary_state: tick.boundary.boundary_state,
      checks: tick.boundary.checks,
      client: tick.boundary.client,
      external: tick.boundary.external
    }),
    ledger: ledgerSlice,
    tickGraph,
    stability: Object.freeze({
      driftRiskScore: stability.driftRisk.driftRiskScore,
      band: stability.driftRisk.band,
      longTermBreaches: stability.longTermDivergence.breaches,
      a9A11SignalIds: stability.a9A11SignalCheck.signalIds,
      smoothedTailState:
        stability.smoothedGraph.series[stability.smoothedGraph.series.length - 1]
          ?.smoothed_epistemic_state ?? SYSTEM_STATE_V0.LIVE_OK
    }),
    epistemic_state: tick.epistemic_state,
    gateHints: Object.freeze({
      simulationLawOk,
      epistemicState: tick.epistemic_state,
      driftBand: stability.driftRisk.band,
      signalIdsNonEmpty: stability.a9A11SignalCheck.signalIdsNonEmpty,
      evidenceComplete:
        simulationLawOk !== false &&
        Boolean(tick.correlationId) &&
        Boolean(tickGraph.nodes?.length)
    }),
    centralizedArbitrationBus: false,
    interpretationOnly: true,
    readOnly: true
  });

  lastAuditBundleV0 = bundle;
  syncEpistemicAuditBundleWindowV0(bundle);

  if (opts.recordIdentity !== false) {
    try {
      const { evaluateEpistemicIdentityContinuityV0 } = await import(
        "./epistemicIdentityContinuityV0.js"
      );
      evaluateEpistemicIdentityContinuityV0({ bundle });
    } catch {
      /* identity must not break bundle */
    }
  }

  return bundle;
}

/**
 * @param {Awaited<ReturnType<typeof runEpistemicAuditBundleV0>>} [bundle]
 */
export function exportEpistemicAuditBundleJsonV0(bundle) {
  const payload = bundle ?? lastAuditBundleV0;
  if (!payload) {
    return JSON.stringify(
      { schema: EPISTEMIC_AUDIT_BUNDLE_SCHEMA_V0, error: "no_bundle_run_yet" },
      null,
      2
    );
  }
  return JSON.stringify(
    {
      ...payload,
      exportedAtMs: Date.now(),
      readOnly: true
    },
    null,
    2
  );
}

/**
 * Paste-ready block for docs/academic/SESSION_LOG.md
 *
 * @param {Awaited<ReturnType<typeof runEpistemicAuditBundleV0>>} bundle
 */
export function formatGoLiveSection6EvidenceMarkdownV0(bundle) {
  const sim = bundle.simulation;
  const lines = [
    "## Go-Live §6 — epistemic audit bundle",
    "",
    `- **bundleId:** \`${bundle.bundleId}\``,
    `- **correlationId:** \`${bundle.correlationId}\``,
    `- **at:** ${new Date(bundle.tickWindow.closedAtMs).toISOString()}`,
    `- **durationMs:** ${bundle.tickWindow.durationMs}`,
    "",
    "### Gate hints",
    "",
    `| Hint | Value |`,
    `|------|-------|`,
    `| simulationLawOk | ${bundle.gateHints.simulationLawOk} |`,
    `| epistemicState | ${bundle.gateHints.epistemicState} |`,
    `| driftBand | ${bundle.gateHints.driftBand} |`,
    `| driftRiskScore | ${bundle.stability.driftRiskScore} |`,
    `| evidenceComplete | ${bundle.gateHints.evidenceComplete} |`,
    ""
  ];

  if (sim) {
    lines.push(
      "### Violation simulation",
      "",
      `- **LAW:** ${sim.allPassed ? "LAW_OK" : "LAW_FAIL"} (${sim.passed}/${sim.total})`,
      ""
    );
  }

  lines.push(
    "### Boundary",
    "",
    `- **state:** ${bundle.boundary.boundary_state}`,
    "",
    "### Ledger slice",
    "",
    `- **ticks in slice:** ${bundle.ledger.nodes.length} (session \`${bundle.ledger.sessionId}\`)`,
    `- **graph nodes:** ${bundle.tickGraph.nodes.length}`,
    "",
    "### Full JSON",
    "",
    "```json",
    exportEpistemicAuditBundleJsonV0(bundle),
    "```",
    ""
  );

  return lines.join("\n");
}

export function getLastEpistemicAuditBundleV0() {
  return lastAuditBundleV0;
}

/** Test-only */
export function clearEpistemicAuditBundleForTestV0() {
  lastAuditBundleV0 = null;
  syncEpistemicAuditBundleWindowV0(null);
}

function sanitizeTickSnapshotV0(tick) {
  return {
    schema: tick.schema,
    version: tick.version,
    correlationId: tick.correlationId,
    tickWindow: tick.tickWindow,
    playbook: {
      system_state: tick.playbook.system_state,
      checks: tick.playbook.checks,
      schema: tick.playbook.schema,
      atMs: tick.playbook.atMs
    },
    boundary: {
      boundary_state: tick.boundary.boundary_state,
      checks: tick.boundary.checks,
      client: tick.boundary.client,
      external: tick.boundary.external
    },
    observability: {
      schema: tick.observability.schema,
      correlationId: tick.observability.correlationId,
      entries: tick.observability.entries,
      totalGlobal: tick.observability.totalGlobal,
      dropped: tick.observability.dropped
    },
    synthesis: {
      compoundFault: tick.synthesis.compoundFault,
      dominantResponseMode: tick.synthesis.dominantResponseMode,
      systemicSummary: tick.synthesis.systemicSummary
    },
    epistemic_state: tick.epistemic_state,
    centralizedArbitrationBus: tick.centralizedArbitrationBus,
    interpretationOnly: tick.interpretationOnly
  };
}

function syncEpistemicAuditBundleWindowV0(bundle) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_audit_bundle = bundle;
  window.__rhizoh.epistemicAuditBundle = Object.freeze({
    run: runEpistemicAuditBundleV0,
    last: () => lastAuditBundleV0,
    export: exportEpistemicAuditBundleJsonV0,
    formatSessionLog: formatGoLiveSection6EvidenceMarkdownV0
  });
}
