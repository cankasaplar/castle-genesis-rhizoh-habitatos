import { initCastleGatewayOpenTelemetry } from "./infra/opentelemetryGateway.js";
import { renderRhizohPrometheusMetrics } from "./infra/rhizohEnterpriseMetrics.js";
import {
  RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
  RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION,
  getRhizohGatewayConstitutionalGovernanceContextForTurn,
  getRhizohGatewayConstitutionalFeedbackSummary,
  getRhizohGatewayConstitutionalRollbackQuick,
  recordRhizohGatewayConstitutionalFeedback
} from "./rhizohPolicyRuntimeGateway.js";
import { appendRhizohConstitutionalAuditChainLine } from "./rhizohOperationalAuditGateway.js";
import { buildRhizohExternalGroundTruthPayload } from "./rhizohExternalGroundTruthGateway.js";
import { ingestRhizohExternalLossBatchHttp } from "./rhizohExternalLossIngestGateway.js";
import {
  ingestRhizohProductOutcomeHttp,
  listRhizohProductOutcomeAggregates
} from "./rhizohProductOutcomeIngestGateway.js";
import { persistEpistemicLedgerBatch } from "./epistemicLedgerStore.js";
import { persistEpistemicForecastBatch } from "./epistemicForecastStore.js";

/**
 * Rhizoh production bootstrap - single gateway entry point.
 * Keeps production wiring centralized without forcing route ownership changes.
 */
export function initRhizoh() {
  const telemetry = {
    initOpenTelemetry: () => initCastleGatewayOpenTelemetry()
  };

  const policy = {
    version: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
    getTurnGovernanceContext: (traceId) => getRhizohGatewayConstitutionalGovernanceContextForTurn(traceId),
    getFeedbackSummary: () => getRhizohGatewayConstitutionalFeedbackSummary(),
    getRollbackQuick: () => getRhizohGatewayConstitutionalRollbackQuick(),
    recordFeedback: (snapshot) => recordRhizohGatewayConstitutionalFeedback(snapshot)
  };

  const governance = {
    policyVersion: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
    feedbackLoopVersion: RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION
  };

  const audit = {
    appendChainLine: (canonicalAuditBody) => appendRhizohConstitutionalAuditChainLine(canonicalAuditBody)
  };

  const cohort = {
    listOutcomeAggregates: (params) => listRhizohProductOutcomeAggregates(params || {})
  };

  const truth = {
    buildExternalGroundTruthPayload: (req) => buildRhizohExternalGroundTruthPayload(req),
    ingestProductOutcome: (body, meta) => ingestRhizohProductOutcomeHttp(body, meta),
    ingestExternalLossBatch: (body, meta) => ingestRhizohExternalLossBatchHttp(body, meta)
  };

  const replay = {
    persistEpistemicLedgerBatch: (uid, entries) => persistEpistemicLedgerBatch(uid, entries),
    persistEpistemicForecastBatch: (uid, entries) => persistEpistemicForecastBatch(uid, entries)
  };

  const metrics = {
    renderPrometheus: () => renderRhizohPrometheusMetrics()
  };

  const routes = {
    rhizohLlm: "/rhizoh/llm",
    externalTruth: "/rhizoh/product/external-truth",
    productOutcome: "/rhizoh/product/outcome",
    productOutcomeAggregate: "/rhizoh/product/outcome/aggregate",
    externalLossBatch: "/rhizoh/product/external-loss/batch",
    epistemicSeal: "/rhizoh/epistemic/seal",
    epistemicLogsBatch: "/rhizoh/epistemic/logs/batch",
    infraPrometheusMetrics: "/infra/metrics/prometheus"
  };

  return {
    telemetry,
    policy,
    governance,
    audit,
    cohort,
    truth,
    replay,
    metrics,
    routes
  };
}

