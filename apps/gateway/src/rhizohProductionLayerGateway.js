/**
 * Gateway injection — R1–R4 constitutional production pipeline (execution boundary).
 * Kernel/IR değiştirmez; LLM çıktısı üzerinde gözlemlenebilir, geri alınabilir zarf.
 *
 * R2: Tam IR opcode tablosu constitutionalCostFieldV1 içinde; gateway burada yalnızca
 * dönüş maliyeti için yanıt + spine özetine dayalı hafif bir relative cost üretir (IR bağımlılığı yok).
 */
import { evaluateRhizohConstitutionalEthicalPriority } from "../../client/src/rhizoh/constitution/constitutionalValueLayerV1.js";
import {
  createRhizohConstitutionalRecoveryCheckpoint,
  snapRhizohThetaToSafeAttractor
} from "../../client/src/rhizoh/constitution/constitutionalRecoveryEngineV1.js";
import {
  RHIZOH_CONSTITUTIONAL_PRODUCT_API_SCHEMA_VERSION,
  RHIZOH_CONSTITUTIONAL_PRODUCT_DEFAULT_LATENCY_BUDGET_MS_V1,
  buildRhizohConstitutionalProductEnvelope,
  assertRhizohConstitutionalLatencyBudget,
  exportRhizohConstitutionalObservableMetrics
} from "../../client/src/rhizoh/constitution/constitutionalProductInterfaceV1.js";
import { synthesizeRhizohConstitutionalProductionDecision, shouldProceedRhizohConstitutionalProduction } from "../../client/src/rhizoh/constitution/constitutionalDecisionLayerV1.js";
import { resolveRhizohThetaPhase } from "../../client/src/rhizoh/constitution/thetaPhaseTransitionV1.js";
import { RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION } from "../../client/src/rhizoh/constitution/constitutionalFeedbackLearningLoopV1.js";
import { RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION } from "../../client/src/rhizoh/constitution/constitutionalPolicyGovernanceV1.js";
import {
  getRhizohGatewayConstitutionalGovernanceContextForTurn,
  recordRhizohGatewayConstitutionalFeedback,
  compareRhizohGatewayShadowDecisions,
  getRhizohGatewayConstitutionalRollbackQuick,
  getRhizohGatewayConstitutionalFeedbackSummary
} from "./rhizohPolicyRuntimeGateway.js";
import {
  RHIZOH_OPERATIONAL_HARDENING_VERSION,
  buildRhizohConstitutionalObservabilityEnvelope,
  buildRhizohConstitutionalReplayHarnessSeed,
  fingerprintRhizohConstitutionalDecision,
  fingerprintRhizohConstitutionalThresholdMap,
  synthesizeRhizohConstitutionalMultiRegionPolicySync,
  buildRhizohConstitutionalAuditPayload,
  canonicalRhizohOperationalJson
} from "../../client/src/rhizoh/constitution/constitutionalOperationalHardeningV1.js";
import { appendRhizohConstitutionalAuditChainLine } from "./rhizohOperationalAuditGateway.js";
import {
  RHIZOH_CONSTITUTIONAL_REGIONAL_QUORUM_VERSION,
  computeRhizohConstitutionalRegionalQuorum
} from "../../client/src/rhizoh/constitution/constitutionalRegionalQuorumV1.js";

export const RHIZOH_GATEWAY_PRODUCTION_LAYER_PIPELINE_VERSION = "1.3.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {Record<string, unknown>} result queryRhizohLlm + θ filter sonrası
 * @param {{ spinePhaseCount?: number }} meta
 */
export function estimateRhizohGatewayTurnCost(result, meta = {}) {
  const replyLen = String(result?.reply ?? "").length;
  const intents = Array.isArray(result?.intents) ? result.intents.length : 0;
  const phases = Math.max(0, Math.floor(Number(meta.spinePhaseCount ?? 0)));
  const total = 1.2 + Math.log1p(replyLen) * 0.12 + intents * 0.35 + phases * 0.25;
  return {
    mode: "gateway_response_relative_v1",
    totalRelativeCost: Math.round(total * 1000) / 1000,
    breakdown: {
      replyChars: replyLen,
      intentCount: intents,
      spinePhases: phases
    },
    model: result?.model ?? null
  };
}

/**
 * @param {Record<string, unknown>} result — mutate edilir (rhizohProduction eklenir)
 * @param {{
 *   traceId: string,
 *   turnLatencyMs: number,
 *   turnT0: number,
 *   fullContext?: Record<string, unknown>,
 *   safePayload?: Record<string, unknown>,
 *   thetaProbe: number | null,
 *   spinePhases?: ReadonlyArray<{ name: string, ms: number }>
 * }} context
 */
export function applyRhizohProductionLayer(result, context) {
  if (process.env.CASTLE_RHIZOH_PRODUCTION_LAYER === "0") {
    return result;
  }

  const thetaRaw = result.constitutionalTheta != null ? Number(result.constitutionalTheta) : context.thetaProbe;
  const theta = clamp01(Number.isFinite(Number(thetaRaw)) ? Number(thetaRaw) : 0.46);
  const phaseReadout = resolveRhizohThetaPhase(theta);

  const stressBump = clamp01(Number(result.constitutionalThetaStressBump ?? 0));
  const fb = result.constitutionalThetaStressFeedbackHint;
  const hintStress =
    fb && typeof fb === "object" && fb.estimatedStressAfter != null
      ? clamp01(Number(fb.estimatedStressAfter))
      : stressBump;

  const ethicalState = {
    theta,
    stressIndex: Math.max(stressBump, hintStress * 0.85),
    deceptionRisk: clamp01(Number(context.fullContext?.deceptionRisk ?? 0)),
    manipulationRisk: clamp01(Number(context.fullContext?.manipulationRisk ?? 0)),
    uncertainty: clamp01(Number(context.fullContext?.uncertainty ?? context.fullContext?.llmUncertainty ?? 0.35)),
    organismThrottleFactor: clamp01(
      Number(context.fullContext?.organismThrottleFactor ?? context.safePayload?.organismThrottleFactor ?? 1)
    ),
    trust: clamp01(Number(context.fullContext?.trust ?? 0.55)),
    evidenceStrength: clamp01(Number(context.fullContext?.evidenceStrength ?? 0.5)),
    llmHedgePressure: clamp01(Number(context.fullContext?.llmHedgePressure ?? 0.25))
  };

  const action = {
    directive: result.directive,
    kernelActionId: context.safePayload?.kernelActionId ?? context.fullContext?.kernelActionId,
    claimConfidence: context.safePayload?.claimConfidence ?? context.fullContext?.claimConfidence,
    membraneFloorEscalation: context.safePayload?.membraneFloorEscalation === true,
    overrideUserPreference: context.safePayload?.overrideUserPreference === true,
    assertDominance: context.safePayload?.assertDominance === true
  };

  const ethics = evaluateRhizohConstitutionalEthicalPriority(ethicalState, action);

  const spinePhaseCount = Array.isArray(context.spinePhases) ? context.spinePhases.length : 0;
  const cost = estimateRhizohGatewayTurnCost(result, { spinePhaseCount });

  const checkpoint = createRhizohConstitutionalRecoveryCheckpoint({
    thetaEffective: theta,
    phase: phaseReadout.phase,
    stressIndex: ethicalState.stressIndex,
    traceTailHash: context.traceId ? String(context.traceId).slice(0, 36) : null
  });

  const attractorSnap = snapRhizohThetaToSafeAttractor(theta, { blend: 0.18 });

  const budgetRaw =
    context.fullContext?.latencyBudgetMs ??
    context.safePayload?.latencyBudgetMs ??
    process.env.CASTLE_RHIZOH_LATENCY_BUDGET_MS;
  const latencyBudgetMs = Number.isFinite(Number(budgetRaw))
    ? Math.max(0, Number(budgetRaw))
    : RHIZOH_CONSTITUTIONAL_PRODUCT_DEFAULT_LATENCY_BUDGET_MS_V1;

  const latencyAssertion = assertRhizohConstitutionalLatencyBudget(context.turnT0, latencyBudgetMs);

  const constitutionalVersions = {
    gatewayProductionPipeline: RHIZOH_GATEWAY_PRODUCTION_LAYER_PIPELINE_VERSION,
    R1_value: ethics.valueLayerVersion,
    R2_cost: cost.mode,
    R3_recovery: checkpoint.version,
    R4_product_schema: RHIZOH_CONSTITUTIONAL_PRODUCT_API_SCHEMA_VERSION,
    R6_feedback_loop: RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION,
    R7_governance: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION
  };

  const kernelLike = {
    runtimeTheta: theta,
    runtimeThetaPhase: phaseReadout,
    tick: {
      dynamicsVersion: null,
      constitutionalAdaptation: { thetaEffective: theta, thetaNext: attractorSnap.thetaAfter },
      constitutionalPotential: { stressIndex: ethicalState.stressIndex },
      thetaPhase: phaseReadout,
      organismStress: {},
      executionEnvelope: { allowExecution: ethics.recommendProceed === true }
    },
    extensions: {},
    layers: {},
    irVm: {}
  };
  const metrics = exportRhizohConstitutionalObservableMetrics(kernelLike);

  const innerPayload = {
    ethics,
    cost,
    recovery: {
      checkpoint,
      attractorSnap
    },
    latencyAssertion,
    metrics
  };

  const envelopeLatencyWithinBudget =
    context.turnLatencyMs != null && Number.isFinite(Number(context.turnLatencyMs))
      ? Number(context.turnLatencyMs) <= latencyBudgetMs
      : latencyAssertion.ok === true;

  const governanceCtx = getRhizohGatewayConstitutionalGovernanceContextForTurn(context.traceId);
  constitutionalVersions.R7_primary_policy = governanceCtx.primaryPolicyVersion;

  const decisionInput = {
    ...innerPayload,
    envelopeWithinLatencyBudget: envelopeLatencyWithinBudget
  };

  const decision = synthesizeRhizohConstitutionalProductionDecision(decisionInput, {
    policyId: governanceCtx.primaryPolicyId,
    thresholds: governanceCtx.primaryThresholds
  });

  /** @type {Record<string, unknown> | null} */
  let shadowDecision = null;
  /** @type {Record<string, unknown> | null} */
  let shadowComparison = null;
  if (governanceCtx.shadowThresholds != null) {
    shadowDecision = synthesizeRhizohConstitutionalProductionDecision(decisionInput, {
      policyId: governanceCtx.shadowPolicyId,
      thresholds: governanceCtx.shadowThresholds
    });
    shadowComparison = compareRhizohGatewayShadowDecisions(decision, shadowDecision);
  }

  constitutionalVersions.R5_decision = decision.decisionLayerVersion;
  constitutionalVersions.operational_hardening = RHIZOH_OPERATIONAL_HARDENING_VERSION;

  const thresholdsFingerprint = fingerprintRhizohConstitutionalThresholdMap(governanceCtx.primaryThresholds);
  const replayHarness = buildRhizohConstitutionalReplayHarnessSeed(decisionInput, {
    primaryPolicyId: governanceCtx.primaryPolicyId,
    primaryPolicyVersion: governanceCtx.primaryPolicyVersion,
    thresholdsFingerprint,
    theta,
    phase: phaseReadout.phase
  });
  const decisionFingerprint = fingerprintRhizohConstitutionalDecision(decision);

  /** @type {Record<string, unknown> | null} */
  let multiRegionSync = null;
  try {
    const mrRaw = String(process.env.CASTLE_RHIZOH_MULTI_REGION_PEERS_JSON || "").trim();
    if (mrRaw) {
      const peers = JSON.parse(mrRaw);
      if (Array.isArray(peers)) multiRegionSync = synthesizeRhizohConstitutionalMultiRegionPolicySync(peers);
    }
  } catch {
    /* opsiyonel çok-bölge JSON bozuksa sessiz */
  }

  const observability = buildRhizohConstitutionalObservabilityEnvelope({
    traceId: context.traceId,
    turnLatencyMs: context.turnLatencyMs,
    pipelineVersion: RHIZOH_GATEWAY_PRODUCTION_LAYER_PIPELINE_VERSION,
    decisionAction: decision.action,
    shouldProceed: shouldProceedRhizohConstitutionalProduction(decision),
    region: process.env.CASTLE_DEPLOY_REGION || null,
    deployment: process.env.CASTLE_DEPLOYMENT_NAME || null
  });

  const envelope = buildRhizohConstitutionalProductEnvelope(innerPayload, {
    traceId: context.traceId,
    latencyMs: context.turnLatencyMs,
    latencyBudgetMs,
    constitutionalVersions,
    contractId: "rhizoh.gateway.production.v1"
  });

  recordRhizohGatewayConstitutionalFeedback({
    traceId: context.traceId,
    decision,
    ethics,
    cost,
    latencyAssertion,
    envelopeWithinLatencyBudget: envelopeLatencyWithinBudget,
    outcomeLabel:
      context.safePayload?.constitutionalFeedbackOutcome ??
      context.fullContext?.constitutionalFeedbackOutcome ??
      null
  });

  const rollbackSignals = getRhizohGatewayConstitutionalRollbackQuick();

  /** @type {Record<string, unknown>} */
  const governance = {
    governanceVersion: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
    feedbackLoopVersion: RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION,
    primaryPolicyVersion: governanceCtx.primaryPolicyVersion,
    primaryLifecycleStatus: governanceCtx.primaryLifecycleStatus,
    primaryPolicyId: governanceCtx.primaryPolicyId,
    useCanary: governanceCtx.useCanary,
    shadowPolicyVersion: governanceCtx.shadowPolicyVersion,
    shadowComparison,
    rollbackSignals
  };
  if (shadowDecision != null) governance.shadowDecision = shadowDecision;
  if (process.env.CASTLE_RHIZOH_FEEDBACK_SUMMARY === "1") {
    governance.feedbackLearning = getRhizohGatewayConstitutionalFeedbackSummary();
  }

  try {
    const qRaw = String(process.env.CASTLE_RHIZOH_QUORUM_VOTES_JSON || "").trim();
    if (qRaw) {
      const votes = JSON.parse(qRaw);
      if (Array.isArray(votes)) {
        /** @type {Record<string, unknown>} */
        const quorumOpts = {};
        try {
          const lp = String(process.env.CASTLE_RHIZOH_QUORUM_LATENCY_POLICY_JSON || "").trim();
          if (lp) Object.assign(quorumOpts, JSON.parse(lp));
        } catch {
          /* CASTLE_RHIZOH_QUORUM_LATENCY_POLICY_JSON geçersizse yok say */
        }
        const maxAge = process.env.CASTLE_RHIZOH_QUORUM_MAX_VOTE_AGE_MS;
        if (maxAge != null && String(maxAge).trim() !== "") {
          const n = Number(maxAge);
          if (Number.isFinite(n) && n > 0) quorumOpts.maxVoteAgeMs = n;
        }
        const cap = process.env.CASTLE_RHIZOH_QUORUM_WAIT_CAP_MS;
        if (cap != null && String(cap).trim() !== "") {
          const n = Number(cap);
          if (Number.isFinite(n) && n >= 0) quorumOpts.waitCapMs = n;
        }
        if (process.env.CASTLE_RHIZOH_QUORUM_HOLD_ON_STALE === "1") quorumOpts.holdOnStaleExcluded = true;

        governance.enterpriseQuorum = computeRhizohConstitutionalRegionalQuorum(votes, quorumOpts);
        constitutionalVersions.enterprise_quorum = RHIZOH_CONSTITUTIONAL_REGIONAL_QUORUM_VERSION;
      }
    }
  } catch {
    /* CASTLE_RHIZOH_QUORUM_VOTES_JSON isteğe bağlı */
  }

  /** @type {Record<string, unknown>} */
  const operational = {
    hardeningVersion: RHIZOH_OPERATIONAL_HARDENING_VERSION,
    observability,
    replayHarness,
    decisionFingerprint,
    thresholdsFingerprint,
    multiRegionSync
  };

  result.rhizohProduction = {
    pipelineVersion: RHIZOH_GATEWAY_PRODUCTION_LAYER_PIPELINE_VERSION,
    envelope,
    ...innerPayload,
    decision,
    shouldProceed: shouldProceedRhizohConstitutionalProduction(decision),
    governance,
    operational
  };

  if (process.env.CASTLE_RHIZOH_DECISION_ENFORCE === "1" && decision.action === "reject") {
    result.reply = String(
      process.env.CASTLE_RHIZOH_REJECT_FALLBACK_REPLY ??
        "[Rhizoh] Bu yanıt anayasal politika nedeniyle iletilmedi."
    );
    result.directive = "NONE";
    result.rhizohProduction.enforcement = { applied: true, reason: "reject", policyId: decision.policyId };
  }

  const auditWire = buildRhizohConstitutionalAuditPayload({
    traceId: context.traceId,
    decisionAction: String(decision.action ?? ""),
    policyId: governanceCtx.primaryPolicyId,
    policyVersion: governanceCtx.primaryPolicyVersion,
    enforcementApplied: !!(result.rhizohProduction.enforcement && result.rhizohProduction.enforcement.applied),
    outcomeDigest: canonicalRhizohOperationalJson({
      seedFingerprint: replayHarness.seedFingerprint,
      decisionFingerprint
    })
  });
  operational.auditChainLine = appendRhizohConstitutionalAuditChainLine(auditWire.canonicalBody);

  return result;
}
