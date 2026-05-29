/**
 * Action Semantic Governance Layer (ASGL) v0 — unified action meaning across domains.
 * Answers: not "what can be done?" but "what should be done, under which conditions, in which world?"
 * @see docs/ops/ACTION_SEMANTIC_GOVERNANCE_V1.0.md
 */

export const ACTION_SEMANTIC_GOVERNANCE_SCHEMA_V0 = "rhizoh.action_semantic_governance.v0";

export const ACTION_DOMAIN_V0 = Object.freeze({
  ROBOTICS: "robotics",
  SPIRAL_MMO: "spiral_mmo",
  GOVERNANCE: "governance"
});

export const ACTION_PERMISSION_V0 = Object.freeze({
  PROHIBITED: "prohibited",
  AUDIT_ONLY: "audit_only",
  NARRATIVE_HYPOTHESIS: "narrative_hypothesis_only",
  HUMAN_SIGNOFF_REQUIRED: "human_signoff_required",
  SENSOR_VERIFIED_ONLY: "sensor_verified_only",
  POLICY_SIGNAL_ONLY: "policy_signal_only"
});

/** Canonical action ontology — same verb, domain-specific semantics */
export const GLOBAL_ACTION_ONTOLOGY_V0 = Object.freeze({
  deploy_agent: Object.freeze({
    id: "deploy_agent",
    riskClass: "high",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "physical_robot_activation",
        permission: ACTION_PERMISSION_V0.SENSOR_VERIFIED_ONLY,
        mayActuate: true
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "npc_spawn_world_event",
        permission: ACTION_PERMISSION_V0.POLICY_SIGNAL_ONLY,
        mayActuate: false
      }),
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "workload_scaling_signal",
        permission: ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED,
        mayActuate: false
      })
    })
  }),
  reduce_burst_concurrency: Object.freeze({
    id: "reduce_burst_concurrency",
    riskClass: "high",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "motion_rate_limit",
        permission: ACTION_PERMISSION_V0.SENSOR_VERIFIED_ONLY
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "spawn_rate_cap_world_rule",
        permission: ACTION_PERMISSION_V0.POLICY_SIGNAL_ONLY
      }),
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "rollout_tier_or_burst_limit_change",
        permission: ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED
      })
    })
  }),
  run_lifecycle_reconcile_review: Object.freeze({
    id: "run_lifecycle_reconcile_review",
    riskClass: "medium",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "lease_inflight_reconcile_ops",
        permission: ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED
      }),
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "recover_phase_observe_reset",
        permission: ACTION_PERMISSION_V0.SENSOR_VERIFIED_ONLY
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "world_state_consistency_check",
        permission: ACTION_PERMISSION_V0.AUDIT_ONLY
      })
    })
  }),
  audit_gcl_rollout_pairing: Object.freeze({
    id: "audit_gcl_rollout_pairing",
    riskClass: "medium",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "finops_rollout_audit",
        permission: ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED
      }),
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "power_budget_audit",
        permission: ACTION_PERMISSION_V0.AUDIT_ONLY
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "economy_ledger_audit",
        permission: ACTION_PERMISSION_V0.AUDIT_ONLY
      })
    })
  }),
  maintain_current_posture: Object.freeze({
    id: "maintain_current_posture",
    riskClass: "low",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "no_config_change",
        permission: ACTION_PERMISSION_V0.POLICY_SIGNAL_ONLY
      }),
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "hold_safe_pose",
        permission: ACTION_PERMISSION_V0.SENSOR_VERIFIED_ONLY
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "steady_world_tick",
        permission: ACTION_PERMISSION_V0.POLICY_SIGNAL_ONLY
      })
    })
  }),
  schedule_redis_validation: Object.freeze({
    id: "schedule_redis_validation",
    riskClass: "medium",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "coordination_stress_validation",
        permission: ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED
      }),
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "sensor_bus_validation",
        permission: ACTION_PERMISSION_V0.AUDIT_ONLY
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "sim_coordination_validation",
        permission: ACTION_PERMISSION_V0.AUDIT_ONLY
      })
    })
  }),
  apply_narrative_suggested_action: Object.freeze({
    id: "apply_narrative_suggested_action",
    riskClass: "critical",
    domains: Object.freeze({
      [ACTION_DOMAIN_V0.GOVERNANCE]: Object.freeze({
        meaning: "forbidden_auto_remediation",
        permission: ACTION_PERMISSION_V0.PROHIBITED
      }),
      [ACTION_DOMAIN_V0.ROBOTICS]: Object.freeze({
        meaning: "forbidden_model_to_actuation",
        permission: ACTION_PERMISSION_V0.PROHIBITED
      }),
      [ACTION_DOMAIN_V0.SPIRAL_MMO]: Object.freeze({
        meaning: "forbidden_lore_to_physics",
        permission: ACTION_PERMISSION_V0.PROHIBITED
      })
    })
  })
});

/**
 * @param {string} actionId
 * @param {string} domain
 */
export function resolveActionSemanticsV0(actionId, domain) {
  const entry = GLOBAL_ACTION_ONTOLOGY_V0[actionId];
  if (!entry) {
    return Object.freeze({
      known: false,
      actionId,
      domain,
      permission: ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED,
      meaning: "unknown_action_default_human_signoff",
      crossDomainRisk: "elevated"
    });
  }
  const domainSpec = entry.domains[domain];
  if (!domainSpec) {
    return Object.freeze({
      known: true,
      actionId,
      domain,
      permission: ACTION_PERMISSION_V0.PROHIBITED,
      meaning: "action_not_defined_for_domain",
      crossDomainRisk: "high"
    });
  }
  return Object.freeze({
    known: true,
    actionId,
    domain,
    riskClass: entry.riskClass,
    ...domainSpec,
    crossDomainRisk: entry.riskClass === "critical" ? "critical" : "normal"
  });
}

/**
 * Score risk when the same action id is interpreted across domains without alignment.
 * @param {string} actionId
 */
export function scoreCrossDomainActionRiskV0(actionId) {
  const entry = GLOBAL_ACTION_ONTOLOGY_V0[actionId];
  if (!entry) return { score: 0.7, reason: "unknown_action" };

  const perms = Object.values(entry.domains).map((d) => d.permission);
  const uniquePerms = new Set(perms);
  const meaningSpread = Object.values(entry.domains).map((d) => d.meaning).join("|");

  let score = entry.riskClass === "critical" ? 0.95 : entry.riskClass === "high" ? 0.6 : 0.3;
  if (uniquePerms.has(ACTION_PERMISSION_V0.PROHIBITED)) score = Math.max(score, 0.85);
  if (uniquePerms.size >= 3) score = Math.min(1, score + 0.15);

  return Object.freeze({
    score: Math.round(score * 1000) / 1000,
    actionId,
    meaningSpread,
    permissionVariance: uniquePerms.size,
    silentFailureClass: "multi_domain_action_semantic_drift"
  });
}

/**
 * Map narrative suggestedActions to ASGL evaluations.
 * @param {object[]} suggestedActions
 */
export function evaluateSuggestedActionsSemanticsV0(suggestedActions = []) {
  return Object.freeze(
    suggestedActions.map((a) => {
      const id = a.id || "unknown";
      const governance = resolveActionSemanticsV0(id, ACTION_DOMAIN_V0.GOVERNANCE);
      const robotics = resolveActionSemanticsV0(id, ACTION_DOMAIN_V0.ROBOTICS);
      const spiral = resolveActionSemanticsV0(id, ACTION_DOMAIN_V0.SPIRAL_MMO);
      const crossDomain = scoreCrossDomainActionRiskV0(id);
      const mayExecuteFromNarrative = a.executable === true;
      return Object.freeze({
        id,
        priority: a.priority,
        narrativeExecutable: mayExecuteFromNarrative,
        allowed: !mayExecuteFromNarrative && governance.permission !== ACTION_PERMISSION_V0.PROHIBITED,
        shouldRequireHumanSignoff:
          governance.permission === ACTION_PERMISSION_V0.HUMAN_SIGNOFF_REQUIRED ||
          crossDomain.score >= 0.6,
        domains: Object.freeze({ governance, robotics, spiral }),
        crossDomain
      });
    })
  );
}

/**
 * Documents closed epistemic feedback loop and residual amplification risks.
 * @param {object} narrativeExport
 */
export function buildEpistemicFeedbackLoopStatusV0(narrativeExport) {
  const trustFork = narrativeExport?.culturalRisk?.trustDynamics?.fork;
  const sim = narrativeExport?.signalsSummary?.coordinationSim === true;
  const propagation = narrativeExport?.humanOps?.socialPropagationSimulation;
  const robotics = narrativeExport?.appliedSystemsLayer?.roboticsGrounding;

  return Object.freeze({
    schema: "rhizoh.epistemic_feedback_loop.v0",
    loopClosed: true,
    chain: Object.freeze([
      "propagation_compression",
      "narrative_derived",
      "trust_or_mythology_fork",
      "governance_interpretation",
      "simulation_world_behavior",
      "observation_ingest"
    ]),
    risks: Object.freeze({
      epistemicDriftAmplification: Object.freeze({
        id: "A",
        active: trustFork === "mythology" || (propagation?.highResidualCount ?? 0) > 0,
        note: "wrong_reading_shapes_behavior_shapes_new_data"
      }),
      simulationRealityBlending: Object.freeze({
        id: "B",
        active: sim || trustFork === "mythology",
        note: "spiral_mmo_plus_robotics_plus_narrative_reads_as_live_truth"
      }),
      authorityCollapse: Object.freeze({
        id: "C",
        mitigated: narrativeExport?.interpretationSafetyContract?.can_execute === false,
        contract: Object.freeze({
          can_execute: false,
          authority_level: narrativeExport?.interpretationSafetyContract?.authority_level,
          decision_owner: narrativeExport?.interpretationSafetyContract?.decision_owner
        }),
        note: "DERIVED_must_not_be_treated_as_binding_info"
      })
    }),
    roboticsBlocksActuation: robotics?.blockActuation === true,
    organismClass: "closed_loop_epistemic_organism_not_classic_ai_app"
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildActionSemanticGovernanceLayerV0(narrativeExport) {
  const suggested = narrativeExport?.interpretation?.suggestedActions || [];
  const evaluated = evaluateSuggestedActionsSemanticsV0(suggested);
  const feedbackLoop = buildEpistemicFeedbackLoopStatusV0(narrativeExport);

  const highRiskActions = evaluated.filter(
    (e) => e.crossDomain.score >= 0.6 || e.shouldRequireHumanSignoff
  );

  return Object.freeze({
    schema: ACTION_SEMANTIC_GOVERNANCE_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    question: "What should be done, under which conditions, in which domain?",
    globalOntologyActionCount: Object.keys(GLOBAL_ACTION_ONTOLOGY_V0).length,
    domains: Object.values(ACTION_DOMAIN_V0),
    permissionModel: Object.values(ACTION_PERMISSION_V0),
    evaluatedSuggestedActions: evaluated,
    highRiskActionCount: highRiskActions.length,
    epistemicFeedbackLoop: feedbackLoop,
    invariants: Object.freeze([
      "narrative_suggested_action_never_auto_executes",
      "same_action_id_has_explicit_per_domain_meaning",
      "robotics_actuation_requires_sensor_verified_permission_class",
      "governance_production_changes_require_human_signoff",
      "spiral_mmo_world_events_are_policy_signal_or_audit_only"
    ]),
    nonExecutable: true
  });
}
