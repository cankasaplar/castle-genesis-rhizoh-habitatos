/**
 * Action Context Resolution Layer (ACRL) v0 — execution validity, not meaning.
 * ASGL: "what does action mean per domain?" ACRL: "valid ONLY in this context?"
 * Mitigates action overloading / intent drift when domain boundaries slip.
 * @see docs/ops/ACTION_CONTEXT_RESOLUTION_V1.0.md
 */

import { createHash } from "node:crypto";
import {
  ACTION_DOMAIN_V0,
  GLOBAL_ACTION_ONTOLOGY_V0,
  resolveActionSemanticsV0
} from "./actionSemanticGovernanceLayerV0.js";

export const ACTION_CONTEXT_RESOLUTION_SCHEMA_V0 = "rhizoh.action_context_resolution.v0";

export const EXECUTION_ELIGIBILITY_V0 = Object.freeze({
  OK: "ok",
  BLOCKED: "blocked",
  REVIEW_REQUIRED: "review_required",
  AUDIT_ONLY: "audit_only"
});

export const PRIMARY_PLANE_V0 = Object.freeze({
  CONTROL: "control",
  INTELLIGENCE: "intelligence",
  WORLD: "world"
});

export const SILENT_FAILURE_CLASS_V0 = Object.freeze({
  SEMANTIC_OK_CONTEXT_INVALID: "semantic_correctness_contextual_invalidity",
  DOMAIN_COLLISION: "multi_domain_execution_eligibility_collision",
  INTENT_CONTEXT_MISMATCH: "intent_context_mismatch",
  ACTION_OVERLOADING: "action_id_overloaded_across_domains"
});

/**
 * @param {object} narrativeExport
 */
export function buildContextFingerprintV0(narrativeExport) {
  const tenantScope = narrativeExport?.tenantScope;
  const signals = narrativeExport?.signalsSummary || {};
  const robotics = narrativeExport?.appliedSystemsLayer?.roboticsGrounding;
  const spiral = narrativeExport?.appliedSystemsLayer?.spiralMMOGameKernel;
  const gcl = narrativeExport?.signalsSummary?.gclHealth || narrativeExport?.stateLayers?.raw?.gcl;
  const trustFork = narrativeExport?.culturalRisk?.trustDynamics?.fork || "balanced";
  const coordinationSim = signals.coordinationSim === true;
  const sensorVerified = robotics?.sensorVerified === true;
  const blockActuation = robotics?.blockActuation === true;
  const spiralPresent = spiral?.present === true;

  const stateSourceClass = coordinationSim
    ? "simulation"
    : blockActuation
      ? "narrative_derived"
      : sensorVerified
        ? "sensor_verified"
        : "mixed";

  const roboticsActuationEligible =
    sensorVerified && !blockActuation && !coordinationSim && tenantScope?.tenantBound !== false;

  const spiralWorldFirewalled =
    coordinationSim || trustFork === "mythology" || stateSourceClass === "narrative_derived";

  const gclHealthy =
    gcl === "healthy" ||
    gcl?.status === "healthy" ||
    narrativeExport?.systemState?.health !== "degraded";

  const governanceOpsContext = tenantScope?.platformScope !== true || tenantScope?.tenantId != null;

  let inferredActiveDomain = ACTION_DOMAIN_V0.GOVERNANCE;
  let primaryPlane = PRIMARY_PLANE_V0.CONTROL;

  if (roboticsActuationEligible) {
    inferredActiveDomain = ACTION_DOMAIN_V0.ROBOTICS;
    primaryPlane = PRIMARY_PLANE_V0.WORLD;
  } else if (spiralPresent && !spiralWorldFirewalled) {
    inferredActiveDomain = ACTION_DOMAIN_V0.SPIRAL_MMO;
    primaryPlane = PRIMARY_PLANE_V0.WORLD;
  } else if (trustFork === "mythology" || coordinationSim) {
    primaryPlane = PRIMARY_PLANE_V0.INTELLIGENCE;
  }

  const material = JSON.stringify({
    inferredActiveDomain,
    primaryPlane,
    tenantId: tenantScope?.tenantId ?? null,
    coordinationSim,
    stateSourceClass,
    roboticsActuationEligible,
    spiralWorldFirewalled,
    gclHealthy,
    trustFork
  });

  const fingerprintHash = createHash("sha256").update(material).digest("hex").slice(0, 16);

  return Object.freeze({
    schema: "rhizoh.context_fingerprint.v0",
    fingerprintHash,
    primaryPlane,
    inferredActiveDomain,
    tenantBound: tenantScope?.tenantBound !== false,
    coordinationSimActive: coordinationSim,
    stateSourceClass,
    roboticsActuationEligible,
    blockActuation,
    spiralWorldFirewalled,
    spiralPresent,
    governanceOpsContext,
    trustFork,
    gclHealthy,
    narrativeNonExecutable: narrativeExport?.interpretationSafetyContract?.can_execute === false
  });
}

/**
 * Per-action, per-domain eligibility under current context fingerprint.
 * @param {string} actionId
 * @param {ReturnType<typeof buildContextFingerprintV0>} fingerprint
 */
export function resolveExecutionEligibilityV0(actionId, fingerprint) {
  const entry = GLOBAL_ACTION_ONTOLOGY_V0[actionId];
  if (!entry) {
    return Object.freeze({
      actionId,
      eligibility: EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED,
      reason: "unknown_action_default_review"
    });
  }

  const robotics = resolveDomainEligibilityV0(actionId, ACTION_DOMAIN_V0.ROBOTICS, fingerprint, entry);
  const spiral = resolveDomainEligibilityV0(actionId, ACTION_DOMAIN_V0.SPIRAL_MMO, fingerprint, entry);
  const governance = resolveDomainEligibilityV0(
    actionId,
    ACTION_DOMAIN_V0.GOVERNANCE,
    fingerprint,
    entry
  );

  return Object.freeze({
    actionId,
    riskClass: entry.riskClass,
    matrix: Object.freeze({
      [ACTION_DOMAIN_V0.ROBOTICS]: robotics,
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: spiral,
      [ACTION_DOMAIN_V0.GOVERNANCE]: governance
    }),
    activeDomainOnly:
      fingerprint.inferredActiveDomain === ACTION_DOMAIN_V0.ROBOTICS
        ? robotics.eligibility
        : fingerprint.inferredActiveDomain === ACTION_DOMAIN_V0.SPIRAL_MMO
          ? spiral.eligibility
          : governance.eligibility
  });
}

/**
 * @param {string} actionId
 * @param {string} domain
 * @param {object} fingerprint
 * @param {object} entry
 */
function resolveDomainEligibilityV0(actionId, domain, fingerprint, entry) {
  const semantics = resolveActionSemanticsV0(actionId, domain);
  if (!semantics.known || semantics.permission === "prohibited") {
    return Object.freeze({
      domain,
      eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED,
      reason: "asgl_prohibited_or_unknown",
      semanticsMeaning: semantics.meaning
    });
  }

  if (actionId === "apply_narrative_suggested_action") {
    return Object.freeze({
      domain,
      eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED,
      reason: "narrative_never_executes",
      semanticsMeaning: semantics.meaning
    });
  }

  if (domain === ACTION_DOMAIN_V0.ROBOTICS) {
    if (actionId === "deploy_agent") {
      const ok = fingerprint.roboticsActuationEligible && fingerprint.tenantBound;
      return Object.freeze({
        domain,
        eligibility: ok ? EXECUTION_ELIGIBILITY_V0.OK : EXECUTION_ELIGIBILITY_V0.BLOCKED,
        reason: ok ? "sensor_verified_tenant_bound" : "actuation_context_invalid",
        semanticsMeaning: semantics.meaning,
        hardConstraint: "and_only_robotics_execution_context"
      });
    }
    const audit =
      fingerprint.blockActuation === true ||
      !fingerprint.roboticsActuationEligible ||
      fingerprint.coordinationSimActive;
    return Object.freeze({
      domain,
      eligibility: audit ? EXECUTION_ELIGIBILITY_V0.AUDIT_ONLY : EXECUTION_ELIGIBILITY_V0.OK,
      reason: audit ? "observe_only_no_actuation" : "robotics_context_valid",
      semanticsMeaning: semantics.meaning
    });
  }

  if (domain === ACTION_DOMAIN_V0.SPIRAL_MMO) {
    if (actionId === "deploy_agent") {
      return Object.freeze({
        domain,
        eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED,
        reason: "action_overloading_world_spawn_from_ops_context",
        semanticsMeaning: semantics.meaning,
        hardConstraint: "spiral_mmo_deploy_agent_blocked_unless_world_plane_compiler",
        spiralFirewall: fingerprint.spiralWorldFirewalled
      });
    }
    if (fingerprint.spiralWorldFirewalled) {
      return Object.freeze({
        domain,
        eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED,
        reason: "spiral_context_firewall_sim_or_mythology",
        semanticsMeaning: semantics.meaning
      });
    }
    return Object.freeze({
      domain,
      eligibility: EXECUTION_ELIGIBILITY_V0.AUDIT_ONLY,
      reason: "world_policy_signal_only",
      semanticsMeaning: semantics.meaning
    });
  }

  if (domain === ACTION_DOMAIN_V0.GOVERNANCE) {
    if (actionId === "deploy_agent") {
      return Object.freeze({
        domain,
        eligibility: EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED,
        reason: "scaling_signal_requires_human_signoff",
        semanticsMeaning: semantics.meaning,
        hardConstraint: "governance_never_auto_deploy"
      });
    }
    if (!fingerprint.gclHealthy && ["reduce_burst_concurrency", "audit_gcl_rollout_pairing"].includes(actionId)) {
      return Object.freeze({
        domain,
        eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED,
        reason: "gcl_unhealthy_blocks_policy_signal",
        semanticsMeaning: semantics.meaning
      });
    }
    if (fingerprint.governanceOpsContext) {
      return Object.freeze({
        domain,
        eligibility:
          semantics.riskClass === "high" || semantics.riskClass === "critical"
            ? EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED
            : EXECUTION_ELIGIBILITY_V0.AUDIT_ONLY,
        reason: "governance_ops_context",
        semanticsMeaning: semantics.meaning
      });
    }
    return Object.freeze({
      domain,
      eligibility: EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED,
      reason: "platform_scope_requires_review",
      semanticsMeaning: semantics.meaning
    });
  }

  return Object.freeze({
    domain,
    eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED,
    reason: "unresolved_domain",
    semanticsMeaning: semantics.meaning
  });
}

/**
 * @param {ReturnType<typeof resolveExecutionEligibilityV0>[]} matrices
 */
export function detectDomainCollisionV0(matrices) {
  const collisions = matrices
    .filter((m) => m.riskClass === "high" || m.riskClass === "critical")
    .map((m) => {
      const okDomains = Object.values(m.matrix).filter(
        (d) => d.eligibility === EXECUTION_ELIGIBILITY_V0.OK
      );
      return Object.freeze({
        actionId: m.actionId,
        okCount: okDomains.length,
        okDomains: okDomains.map((d) => d.domain),
        collision: okDomains.length > 1
      });
    })
    .filter((c) => c.collision);

  return Object.freeze({
    detected: collisions.length > 0,
    collisions: Object.freeze(collisions),
    silentFailureClass: SILENT_FAILURE_CLASS_V0.DOMAIN_COLLISION
  });
}

/**
 * Semantic-correct action proposed but no valid execution context.
 * @param {object[]} suggestedActions
 * @param {ReturnType<typeof buildContextFingerprintV0>} fingerprint
 * @param {ReturnType<typeof resolveExecutionEligibilityV0>[]} matrices
 */
export function detectIntentContextMismatchV0(suggestedActions, fingerprint, matrices) {
  const byId = new Map(matrices.map((m) => [m.actionId, m]));

  const mismatches = suggestedActions
    .filter((a) => (a.priority === "high" || a.priority === "critical") && a.id)
    .map((a) => {
      const matrix = byId.get(a.id);
      if (!matrix) return null;
      const active = matrix.matrix[fingerprint.inferredActiveDomain];
      const semanticOk = matrix.riskClass !== "critical";
      const contextInvalid =
        active?.eligibility === EXECUTION_ELIGIBILITY_V0.BLOCKED ||
        (active?.eligibility === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED &&
          fingerprint.inferredActiveDomain !== ACTION_DOMAIN_V0.GOVERNANCE);
      if (!semanticOk || !contextInvalid) return null;
      return Object.freeze({
        actionId: a.id,
        priority: a.priority,
        inferredActiveDomain: fingerprint.inferredActiveDomain,
        activeEligibility: active?.eligibility,
        reason: "high_priority_action_invalid_in_active_context",
        silentFailureClass: SILENT_FAILURE_CLASS_V0.SEMANTIC_OK_CONTEXT_INVALID
      });
    })
    .filter(Boolean);

  return Object.freeze({
    detected: mismatches.length > 0,
    mismatches: Object.freeze(mismatches),
    silentFailureClass: SILENT_FAILURE_CLASS_V0.INTENT_CONTEXT_MISMATCH
  });
}

/**
 * ASGL meaning must align with GCL / rollout binding before governance signals count as valid.
 * @param {object} narrativeExport
 * @param {object} [asgl]
 */
export function validateAsglGclBindingV0(narrativeExport, asgl) {
  const fingerprint = buildContextFingerprintV0(narrativeExport);
  const gclSnap = narrativeExport?.signalsSummary;
  const rolloutUtil = narrativeExport?.signalsSummary?.rolloutUtilization;
  const highUtil = typeof rolloutUtil === "number" && rolloutUtil > 0.85;

  const bindingIssues = [];

  if (!fingerprint.gclHealthy) {
    bindingIssues.push("gcl_not_healthy_governance_signals_blocked");
  }
  if (highUtil) {
    bindingIssues.push("rollout_utilization_high_review_required");
  }

  const deployGovernance = resolveExecutionEligibilityV0("deploy_agent", fingerprint).matrix[
    ACTION_DOMAIN_V0.GOVERNANCE
  ];
  if (deployGovernance.eligibility === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED && !fingerprint.gclHealthy) {
    bindingIssues.push("deploy_agent_governance_blocked_under_gcl_stress");
  }

  const ontologyCount = asgl?.globalOntologyActionCount ?? Object.keys(GLOBAL_ACTION_ONTOLOGY_V0).length;
  const overloaded = ontologyCount >= 5;

  return Object.freeze({
    schema: "rhizoh.asgl_gcl_binding.v0",
    valid: bindingIssues.length === 0,
    bindingIssues: Object.freeze(bindingIssues),
    gclHealthy: fingerprint.gclHealthy,
    highRolloutUtilization: highUtil,
    actionOverloadingRisk: Object.freeze({
      monitored: overloaded,
      note: "same_action_id_multi_domain_semantics_requires_acrl_hard_binding"
    })
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildActionContextResolutionLayerV0(narrativeExport) {
  const fingerprint = buildContextFingerprintV0(narrativeExport);
  const asgl = narrativeExport?.actionSemanticGovernance;
  const suggested = narrativeExport?.interpretation?.suggestedActions || [];
  const actionIds = [
    ...new Set([
      ...suggested.map((a) => a.id).filter(Boolean),
      "deploy_agent",
      "apply_narrative_suggested_action"
    ])
  ];

  const executionEligibilityMatrix = actionIds.map((id) =>
    resolveExecutionEligibilityV0(id, fingerprint)
  );

  const domainCollision = detectDomainCollisionV0(executionEligibilityMatrix);
  const intentMismatch = detectIntentContextMismatchV0(
    suggested,
    fingerprint,
    executionEligibilityMatrix
  );
  const asglGclBinding = validateAsglGclBindingV0(narrativeExport, asgl);

  const deployAgent = executionEligibilityMatrix.find((m) => m.actionId === "deploy_agent");

  return Object.freeze({
    schema: ACTION_CONTEXT_RESOLUTION_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    question: "Is this action valid in THIS and ONLY THIS context?",
    layerRole: "execution_validity_not_semantic_mapping",
    complements: "actionSemanticGovernanceLayerV0",
    contextFingerprint: fingerprint,
    executionEligibilityMatrix,
    deployAgentEligibility: deployAgent?.matrix,
    domainCollision,
    intentContextMismatch: intentMismatch,
    asglGclBinding,
    actionOverloadingRisk: Object.freeze({
      class: SILENT_FAILURE_CLASS_V0.ACTION_OVERLOADING,
      mitigatedBy: "per_domain_hard_eligibility_matrix",
      deployAgentExample: deployAgent
        ? Object.freeze({
            robotics: deployAgent.matrix[ACTION_DOMAIN_V0.ROBOTICS]?.eligibility,
            spiral_mmo: deployAgent.matrix[ACTION_DOMAIN_V0.SPIRAL_MMO]?.eligibility,
            governance: deployAgent.matrix[ACTION_DOMAIN_V0.GOVERNANCE]?.eligibility
          })
        : null
    }),
    roboticsActuationCorrectness: Object.freeze({
      semanticLayer: "asgl",
      contextLayer: "acrl",
      actuationEligible:
        deployAgent?.matrix[ACTION_DOMAIN_V0.ROBOTICS]?.eligibility ===
        EXECUTION_ELIGIBILITY_V0.OK,
      note: "wrong_moment_right_semantics_blocked"
    }),
    invariants: Object.freeze([
      "context_binding_hard_constraint_not_hint",
      "narrative_export_never_implies_execution_eligibility_ok",
      "spiral_mmo_deploy_agent_blocked_from_ops_context",
      "governance_deploy_agent_always_review_required",
      "domain_collision_surfaces_when_multiple_ok_on_high_risk"
    ]),
    nonExecutable: true
  });
}
