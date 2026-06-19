/**
 * Ticket Memory Pipeline V0 — MutationRecord → TraceGraph Index → Drift Analytics → Signals.
 *
 * Causal Memory Organism perception chain (observational cognition runtime).
 * interpretationOnly · nonExecutive · DR-01 enforced throughout
 * @see docs/RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md
 * @see docs/RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md
 */

import { runDriftAnalyticsV0 } from "./driftAnalyticsEngineV0.js";
import { deriveReconcileProposalV0 } from "./ticketReconcileProposalV0.js";
import { commitProposedCubeDeltaV0 } from "./admissionCubeCommitV0.js";
import { optimizeTraceGraphIndexV0 } from "./traceGraphIndexOptimizerV0.js";
import { wireDriftSuggestionsToNervousNetworkV0 } from "./ticketDriftSignalWireV0.js";

export const TICKET_MEMORY_PIPELINE_SCHEMA_V0 = "castle.rhizoh.ticket_memory_pipeline.v0";

/**
 * @param {{
 *   records: object[],
 *   compress?: boolean,
 *   tombstoneTickets?: boolean,
 *   windowSize?: number,
 *   traceGraphLink?: string,
 *   ticketId?: string,
 *   wireSignals?: boolean,
 *   reconcile?: boolean,
 *   reconcileEpochId?: string,
 *   commit?: { subjectRef: string, cubeId: string, auditChain?: object, skipAdmissionCheck?: boolean }
 * }} input
 */
export function runTicketMemoryPipelineV0(input) {
  const records = input.records || [];
  const index = optimizeTraceGraphIndexV0({
    records,
    compress: input.compress,
    tombstoneTickets: input.tombstoneTickets,
    windowSize: input.windowSize
  });

  const analytics = runDriftAnalyticsV0({
    records,
    drift: index.drift
  });

  const wired =
    input.wireSignals !== false
      ? wireDriftSuggestionsToNervousNetworkV0({
          suggestions: analytics.suggestions.suggestions,
          traceGraphLink: input.traceGraphLink,
          ticketId: input.ticketId,
          dispatchEvent: false
        })
      : null;

  let reconcile = null;
  let commit = null;

  if (input.reconcile === true) {
    reconcile = deriveReconcileProposalV0({
      records,
      indexSnapshot: index.indexSnapshot,
      epochId: input.reconcileEpochId,
      ticketId: input.ticketId
    });

    if (input.commit && reconcile.proposedCubeDelta) {
      commit = commitProposedCubeDeltaV0({
        subjectRef: input.commit.subjectRef,
        cubeId: input.commit.cubeId,
        proposedCubeDelta: reconcile.proposedCubeDelta,
        auditChain: input.commit.auditChain,
        skipAdmissionCheck: input.commit.skipAdmissionCheck
      });
    }
  }

  return Object.freeze({
    schema: TICKET_MEMORY_PIPELINE_SCHEMA_V0,
    index,
    analytics,
    nervousSignals: wired,
    reconcile,
    commit,
    interpretationOnly: true,
    nonExecutive: true
  });
}
