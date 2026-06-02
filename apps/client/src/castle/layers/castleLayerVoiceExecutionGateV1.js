/**
 * Castle Layer voice execution gate v1.1 — observation + execution drop with full trace.
 */

import {
  buildCastleLayerDecisionPathV1,
  buildCastleLayerDecisionTraceV1,
  deriveCastleLayerDecisionOutcomeV1,
  recordCastleLayerDecisionTraceV1
} from "./castleLayerDecisionTraceV1.js";
import {
  resolveCastleLayerVoiceContextV1,
  shouldDropVoiceExecutionForScopeV1
} from "./castleLayerRuntimeResolverV1.js";

/**
 * @param {{
 *   eventTag?: string,
 *   uiDomain?: string,
 *   preview?: string,
 *   source?: string,
 *   eligibility?: {
 *     hasText?: boolean,
 *     scopeMatch?: boolean,
 *     sanityAccepted?: boolean,
 *     sanityReason?: string,
 *     routerAccepted?: boolean,
 *     routerReason?: string,
 *     commitmentAllowed?: boolean,
 *     commitmentReason?: string,
 *     dedupOk?: boolean,
 *     dedupReason?: string
 *   }
 * }} input
 */
export function evaluateCastleLayerVoiceExecutionV1(input = {}) {
  const eligibility = input.eligibility || {};
  const voiceContext = resolveCastleLayerVoiceContextV1({
    eventTag: input.eventTag,
    uiDomain: input.uiDomain,
    executionAccepted: eligibility.routerAccepted !== false && eligibility.sanityAccepted !== false
  });

  const mergedEligibility = {
    ...eligibility,
    scopeMatch: eligibility.scopeMatch !== false && voiceContext.scopeMatch
  };

  const decisionPath = buildCastleLayerDecisionPathV1(mergedEligibility, voiceContext);
  const outcome = deriveCastleLayerDecisionOutcomeV1(decisionPath, voiceContext);
  const trace = buildCastleLayerDecisionTraceV1({
    voiceContext,
    decisionPath,
    outcome,
    eventTag: input.eventTag,
    preview: input.preview,
    source: input.source
  });
  recordCastleLayerDecisionTraceV1(trace);

  const scopeDrop = shouldDropVoiceExecutionForScopeV1(voiceContext);
  const allowExecution = outcome === "execute" && !scopeDrop;

  return Object.freeze({
    allowExecution,
    outcome: allowExecution ? "execute" : outcome,
    trace,
    voiceContext,
    scopeDrop
  });
}
