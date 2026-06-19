/**
 * Ticket Memory Pipeline V0 — MutationRecord → Live Index → Drift → Alerts → REC Cleanup.
 *
 * Hybrid causal memory organism:
 *   Live path  → incremental measurement (no truth mutation)
 *   Drift path → read-only snapshot + AlertPacket (suggest only)
 *   REC path   → deferred tombstone + soft compression
 *
 * interpretationOnly · nonExecutive · DR-01 enforced throughout
 * @see docs/RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md
 * @see docs/RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md
 */

import { runDriftAnalyticsV0 } from "./driftAnalyticsEngineV0.js";
import { detectDriftAnomaliesV0 } from "./driftAnomalyDetectorV0.js";
import { exportLearningFeatureVectorV0 } from "./learningFeatureVectorExportV0.js";
import { deriveReconcileProposalV0 } from "./ticketReconcileProposalV0.js";
import { commitProposedCubeDeltaV0 } from "./admissionCubeCommitV0.js";
import { optimizeTraceGraphIndexV0 } from "./traceGraphIndexOptimizerV0.js";
import { wireDriftSuggestionsToNervousNetworkV0 } from "./ticketDriftSignalWireV0.js";
import { bindCognitiveVisualizationV0 } from "./cognitiveVisualizationBindingV0.js";

export const TICKET_MEMORY_PIPELINE_SCHEMA_V0 = "castle.rhizoh.ticket_memory_pipeline.v0";

/**
 * @param {{
 *   records: object[],
 *   recCycle?: boolean,
 *   epochId?: string,
 *   tombstoneTickets?: boolean,
 *   windowSize?: number,
 *   traceGraphLink?: string,
 *   ticketId?: string,
 *   wireSignals?: boolean,
 *   detectAnomalies?: boolean,
 *   baselineShares?: Record<string, number>,
 *   exportFeatureVector?: boolean,
 *   bindVisualization?: boolean,
 *   reconcile?: boolean,
 *   reconcileEpochId?: string,
 *   commit?: { subjectRef: string, cubeId: string, auditChain?: object, skipAdmissionCheck?: boolean }
 * }} input
 */
export function runTicketMemoryPipelineV0(input) {
  const records = input.records || [];
  const index = optimizeTraceGraphIndexV0({
    records,
    recCycle: input.recCycle,
    epochId: input.epochId ?? input.reconcileEpochId,
    tombstoneTickets: input.tombstoneTickets,
    windowSize: input.windowSize
  });

  const analytics = runDriftAnalyticsV0({
    records,
    drift: index.drift
  });

  const anomalies =
    input.detectAnomalies !== false
      ? detectDriftAnomaliesV0({
          categoryCounts: index.drift.categoryCounts || {},
          total: index.drift.windowSize || records.length,
          epochId: input.epochId ?? input.reconcileEpochId,
          baselineShares: input.baselineShares
        })
      : null;

  const featureVector =
    input.exportFeatureVector !== false
      ? exportLearningFeatureVectorV0({
          records,
          indexSnapshot: index.indexSnapshot,
          drift: index.drift,
          analytics,
          alerts: anomalies
        })
      : null;

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
      epochId: input.reconcileEpochId ?? input.epochId,
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
    anomalies,
    featureVector,
    nervousSignals: wired,
    reconcile,
    commit,
    cognitiveBinding:
      input.bindVisualization !== false
        ? bindCognitiveVisualizationV0({
            pipeline: {
              index,
              analytics,
              anomalies,
              reconcile,
              commit,
              admission: null
            },
            dispatchEvent: false
          })
        : null,
    interpretationOnly: true,
    nonExecutive: true
  });
}
