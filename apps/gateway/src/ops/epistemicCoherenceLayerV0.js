/**
 * Epistemic Coherence Layer (ECL) v0 — binds ASGL + ACRL + GCL + ASL + World into one truth surface.
 * Mitigates context fragmentation: "correct but fragmented" across meaning/permission/control/world.
 * @see docs/ops/EPISTEMIC_COHERENCE_V1.0.md
 */

import { ACTION_DOMAIN_V0, ACTION_PERMISSION_V0 } from "./actionSemanticGovernanceLayerV0.js";
import { EXECUTION_ELIGIBILITY_V0 } from "./actionContextResolutionLayerV0.js";

export const EPISTEMIC_COHERENCE_SCHEMA_V0 = "rhizoh.epistemic_coherence.v0";

export const COHERENCE_VERDICT_V0 = Object.freeze({
  COHERENT: "coherent",
  FRAGMENTED: "fragmented",
  CONTRADICTORY: "contradictory"
});

export const CONFLICT_CLASS_V0 = Object.freeze({
  SEMANTIC_OK_PERMISSION_BLOCKED: "semantic_ok_permission_blocked",
  PERMISSION_REVIEW_GCL_STRESS: "permission_review_gcl_stress",
  PERMISSION_OK_WORLD_BLOCKED: "permission_ok_world_blocked",
  FALSE_SAFETY_PERCEPTION: "false_safety_perception",
  HIDDEN_SEMANTIC_CONFLICT: "hidden_semantic_conflict",
  CONTEXT_FRAGMENTATION: "context_fragmentation"
});

/**
 * @param {object} narrativeExport
 */
export function detectCrossLayerContradictionsV0(narrativeExport) {
  const asgl = narrativeExport?.actionSemanticGovernance;
  const acrl = narrativeExport?.actionContextResolution;
  const asl = narrativeExport?.appliedSystemsLayer;
  const fingerprint = acrl?.contextFingerprint;
  const activeDomain = fingerprint?.inferredActiveDomain || ACTION_DOMAIN_V0.GOVERNANCE;
  const gclHealthy = fingerprint?.gclHealthy !== false;
  const roboticsBlock = asl?.roboticsGrounding?.blockActuation === true;
  const bindingValid = acrl?.asglGclBinding?.valid !== false;

  /** @type {object[]} */
  const conflicts = [];

  const evaluated = asgl?.evaluatedSuggestedActions || [];
  const matrices = acrl?.executionEligibilityMatrix || [];
  const matrixById = new Map(matrices.map((m) => [m.actionId, m]));

  for (const ev of evaluated) {
    const matrix = matrixById.get(ev.id);
    if (!matrix) continue;

    const activeCell = matrix.matrix?.[activeDomain];
    const activeElig = activeCell?.eligibility;
    const semanticAllowed = ev.allowed === true;
    const semanticSignoff = ev.shouldRequireHumanSignoff === true;

    if (semanticAllowed && activeElig === EXECUTION_ELIGIBILITY_V0.BLOCKED) {
      conflicts.push(
        Object.freeze({
          class: CONFLICT_CLASS_V0.SEMANTIC_OK_PERMISSION_BLOCKED,
          actionId: ev.id,
          activeDomain,
          layers: Object.freeze({ asgl: "allowed", acrl: "blocked" }),
          severity: "high",
          note: "meaning_space_ok_permission_space_blocked"
        })
      );
    }

    if (
      semanticSignoff &&
      activeElig === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED &&
      !gclHealthy
    ) {
      conflicts.push(
        Object.freeze({
          class: CONFLICT_CLASS_V0.PERMISSION_REVIEW_GCL_STRESS,
          actionId: ev.id,
          layers: Object.freeze({ acrl: "review_required", gcl: "unhealthy" }),
          severity: "medium",
          note: "governance_review_under_gcl_stress"
        })
      );
    }

    const roboticsOk =
      matrix.matrix?.[ACTION_DOMAIN_V0.ROBOTICS]?.eligibility === EXECUTION_ELIGIBILITY_V0.OK;
    if (roboticsOk && roboticsBlock) {
      conflicts.push(
        Object.freeze({
          class: CONFLICT_CLASS_V0.PERMISSION_OK_WORLD_BLOCKED,
          actionId: ev.id,
          layers: Object.freeze({ acrl: "ok", asl: "block_actuation" }),
          severity: "critical",
          note: "acrl_robotics_ok_but_world_layer_blocks"
        })
      );
    }

    const govPerm = ev.domains?.governance?.permission;
    if (
      govPerm !== ACTION_PERMISSION_V0.PROHIBITED &&
      activeElig === EXECUTION_ELIGIBILITY_V0.BLOCKED &&
      ev.crossDomain?.score >= 0.5
    ) {
      conflicts.push(
        Object.freeze({
          class: CONFLICT_CLASS_V0.HIDDEN_SEMANTIC_CONFLICT,
          actionId: ev.id,
          severity: "medium",
          note: "asgl_maps_action_acrl_blocks_active_context"
        })
      );
    }
  }

  const deploy = matrixById.get("deploy_agent");
  if (deploy) {
    const eligs = Object.values(deploy.matrix || {}).map((d) => d.eligibility);
    const unique = new Set(eligs);
    const multiAxisPermissionSpread =
      unique.size >= 2 &&
      (unique.has(EXECUTION_ELIGIBILITY_V0.BLOCKED) ||
        unique.has(EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED));
    if (deploy.actionId === "deploy_agent" && Object.keys(deploy.matrix).length >= 3 && multiAxisPermissionSpread) {
      conflicts.push(
        Object.freeze({
          class: CONFLICT_CLASS_V0.CONTEXT_FRAGMENTATION,
          actionId: "deploy_agent",
          severity: "medium",
          axes: Object.freeze({
            asgl: "three_domain_meanings",
            acrl: Object.freeze({
              robotics: deploy.matrix[ACTION_DOMAIN_V0.ROBOTICS]?.eligibility,
              spiral: deploy.matrix[ACTION_DOMAIN_V0.SPIRAL_MMO]?.eligibility,
              governance: deploy.matrix[ACTION_DOMAIN_V0.GOVERNANCE]?.eligibility
            }),
            gcl: gclHealthy ? "single_constraint_healthy" : "single_constraint_stressed",
            world: roboticsBlock ? "execution_blocked" : "execution_conditional"
          }),
          note: "action_overloading_three_axes_simultaneously_differ"
        })
      );
    }
  }

  const allBlocked =
    deploy &&
    Object.values(deploy.matrix).every((d) => d.eligibility === EXECUTION_ELIGIBILITY_V0.BLOCKED);
  const govReview =
    deploy?.matrix[ACTION_DOMAIN_V0.GOVERNANCE]?.eligibility ===
    EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED;
  if (allBlocked && govReview) {
    conflicts.push(
      Object.freeze({
        class: CONFLICT_CLASS_V0.FALSE_SAFETY_PERCEPTION,
        actionId: "deploy_agent",
        severity: "low",
        note: "acrl_blocked_does_not_imply_system_safe_read_raw_and_gcl",
        operatorWarning: "blocked_in_permission_space_still_requires_raw_verification"
      })
    );
  }

  if (!bindingValid) {
    conflicts.push(
      Object.freeze({
        class: CONFLICT_CLASS_V0.PERMISSION_REVIEW_GCL_STRESS,
        actionId: "_gcl_binding",
        severity: "medium",
        layers: Object.freeze({ gcl: "binding_invalid", acrl: "asgl_gcl" }),
        note: String(acrl?.asglGclBinding?.bindingIssues?.[0] || "asgl_gcl_binding_failed")
      })
    );
  }

  return Object.freeze({
    detected: conflicts.length > 0,
    count: conflicts.length,
    conflicts: Object.freeze(conflicts),
    criticalCount: conflicts.filter((c) => c.severity === "critical").length
  });
}

/**
 * @param {object} narrativeExport
 * @param {ReturnType<typeof detectCrossLayerContradictionsV0>} contradictions
 */
export function computeSystemCoherenceScoreV0(narrativeExport, contradictions) {
  let score = 1;
  const acrl = narrativeExport?.actionContextResolution;

  score -= contradictions.count * 0.08;
  score -= contradictions.criticalCount * 0.2;

  if (acrl?.domainCollision?.detected) score -= 0.15;
  if (acrl?.intentContextMismatch?.detected) score -= 0.12;

  const fragmentation = contradictions.conflicts.some(
    (c) => c.class === CONFLICT_CLASS_V0.CONTEXT_FRAGMENTATION
  );
  if (fragmentation) score -= 0.1;

  const hidden = contradictions.conflicts.filter(
    (c) => c.class === CONFLICT_CLASS_V0.HIDDEN_SEMANTIC_CONFLICT
  ).length;
  score -= hidden * 0.05;

  score = Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));

  const fragmented = score < 0.85 || fragmentation || contradictions.count >= 2;
  const contradictory = score < 0.55 || contradictions.criticalCount > 0;

  const verdict = contradictory
    ? COHERENCE_VERDICT_V0.CONTRADICTORY
    : fragmented
      ? COHERENCE_VERDICT_V0.FRAGMENTED
      : COHERENCE_VERDICT_V0.COHERENT;

  return Object.freeze({
    score,
    verdict,
    fragmented,
    consistent: verdict === COHERENCE_VERDICT_V0.COHERENT,
    semanticPermissionAlgebra: Object.freeze({
      meaningSpace: "asgl",
      permissionSpace: "acrl",
      binding: "ecl_unifies"
    })
  });
}

/**
 * Compress five layers into one operator decision surface.
 * @param {object} narrativeExport
 * @param {ReturnType<typeof computeSystemCoherenceScoreV0>} coherence
 * @param {ReturnType<typeof detectCrossLayerContradictionsV0>} contradictions
 */
export function buildUxCompressionLayerV0(narrativeExport, coherence, contradictions) {
  const acrl = narrativeExport?.actionContextResolution;
  const asgl = narrativeExport?.actionSemanticGovernance;
  const fp = acrl?.contextFingerprint;
  const deploy = acrl?.actionOverloadingRisk?.deployAgentExample;
  const roboticsBlock = narrativeExport?.appliedSystemsLayer?.roboticsGrounding?.blockActuation;
  const falseSafety = contradictions.conflicts.some(
    (c) => c.class === CONFLICT_CLASS_V0.FALSE_SAFETY_PERCEPTION
  );

  let operatorDecision = "observe_only";
  if (coherence.verdict === COHERENCE_VERDICT_V0.CONTRADICTORY) {
    operatorDecision = "human_review_required";
  } else if (deploy?.governance === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED) {
    operatorDecision = "human_review_required";
  } else if (contradictions.criticalCount > 0) {
    operatorDecision = "human_review_required";
  }

  const headlineTr =
    coherence.verdict === COHERENCE_VERDICT_V0.COHERENT
      ? "Katmanlar tutarlı — tek karar yüzeyi: gözlem + insan onayı"
      : coherence.verdict === COHERENCE_VERDICT_V0.FRAGMENTED
        ? "Parçalı doğruluk — ASGL/ACRL/GCL ayrı okunur; bu panel birleştirir"
        : "Çapraz katman çelişkisi — otomatik icra yok, insan incelemesi";

  const headlineEn =
    coherence.verdict === COHERENCE_VERDICT_V0.COHERENT
      ? "Layers coherent — single surface: observe + human signoff"
      : coherence.verdict === COHERENCE_VERDICT_V0.FRAGMENTED
        ? "Fragmented truth — read ASGL/ACRL/GCL separately; this panel binds them"
        : "Cross-layer contradiction — no auto execution; human review";

  return Object.freeze({
    schema: "rhizoh.coherent_decision_surface.v0",
    verdict: coherence.verdict,
    coherenceScore: coherence.score,
    operatorDecision,
    headline: Object.freeze({ tr: headlineTr, en: headlineEn }),
    falseSafetyWarning: falseSafety
      ? Object.freeze({
          tr: "ACRL 'blocked' sistem güvenli demez — RAW + GCL okuyun",
          en: "ACRL 'blocked' does not mean system is safe — read RAW + GCL"
        })
      : null,
    layersOneLine: Object.freeze({
      meaning: `ASGL · ${asgl?.globalOntologyActionCount ?? 0} actions mapped`,
      permission: `ACRL · active=${fp?.inferredActiveDomain} · deploy spiral=${deploy?.spiral_mmo}`,
      control: `GCL · ${fp?.gclHealthy ? "healthy" : "stressed"}`,
      world: `ASL · robotics=${roboticsBlock ? "block" : "conditional"} · sim=${fp?.coordinationSimActive}`,
      decision: operatorDecision
    }),
    primaryAction: Object.freeze({
      id: "deploy_agent",
      guidance:
        deploy?.robotics === EXECUTION_ELIGIBILITY_V0.OK
          ? "robotics_ok_only_with_sensor_context"
          : deploy?.governance === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED
            ? "governance_scaling_signal_human_signoff"
            : "no_deploy_without_coherent_context"
    }),
    developerCognitiveLoad: Object.freeze({
      risk: contradictions.count >= 2 ? "elevated" : "managed",
      mitigation: "single_decision_surface_replaces_four_layer_mental_stack"
    })
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildEpistemicCoherenceLayerV0(narrativeExport) {
  const contradictions = detectCrossLayerContradictionsV0(narrativeExport);
  const coherence = computeSystemCoherenceScoreV0(narrativeExport, contradictions);
  const uxCompression = buildUxCompressionLayerV0(narrativeExport, coherence, contradictions);

  const contextFragmentationRisk = Object.freeze({
    active: contradictions.conflicts.some(
      (c) => c.class === CONFLICT_CLASS_V0.CONTEXT_FRAGMENTATION
    ),
    note: "same_action_three_axes_different_truth_without_ecl",
    mitigatedBy: "epistemic_coherence_layer_binding"
  });

  return Object.freeze({
    schema: EPISTEMIC_COHERENCE_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "semantic_permission_algebra_binder",
    architecture: Object.freeze({
      asgl: "meaning_space",
      acrl: "permission_space",
      gcl: "control_constraint",
      asl: "world_application",
      ecl: "coherent_system_truth"
    }),
    crossLayerContradictions: contradictions,
    systemCoherence: coherence,
    contextFragmentationRisk,
    uxCompression,
    invariants: Object.freeze([
      "blocked_in_acrl_does_not_imply_global_safety",
      "coherent_verdict_requires_no_critical_cross_layer_conflict",
      "ux_compression_is_non_executable_decision_surface",
      "five_layers_must_not_surface_as_five_independent_truths_to_operators"
    ]),
    nonExecutable: true
  });
}
