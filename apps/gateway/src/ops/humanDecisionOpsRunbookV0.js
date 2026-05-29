/**
 * Human-tier ops runbook + SLA v0 — decision owner routing at scale.
 * @see docs/ops/HUMAN_TIER_OPS_RUNBOOK_V1.0.md
 */

import {
  DECISION_TIER_V0,
  describeDecisionOwnershipV0,
  resolveHumanDecisionTierV0
} from "./humanDecisionScalingV0.js";

export const HUMAN_OPS_RUNBOOK_SCHEMA_V0 = "rhizoh.human_ops_runbook.v0";

/** Pager / queue routing ids (configure in env or external on-call tool). */
export const DECISION_OWNER_ROUTE_V0 = Object.freeze({
  [DECISION_TIER_V0.SOLO_OPERATOR]: Object.freeze({
    routeId: "rhizoh.ops.solo",
    channel: "founding_operator_direct",
    ackSlaMinutes: 240,
    resolveSlaMinutes: 1440
  }),
  [DECISION_TIER_V0.TEAM_QUEUE]: Object.freeze({
    routeId: "rhizoh.ops.team_oncall",
    channel: "team_oncall_queue",
    ackSlaMinutes: 60,
    resolveSlaMinutes: 480
  }),
  [DECISION_TIER_V0.PLATFORM_GOVERNANCE]: Object.freeze({
    routeId: "rhizoh.ops.platform_governance",
    channel: "platform_governance_board",
    ackSlaMinutes: 15,
    resolveSlaMinutes: 120
  })
});

const RUNBOOK_STEPS_BY_TIER = Object.freeze({
  [DECISION_TIER_V0.SOLO_OPERATOR]: Object.freeze([
    "Open RAW layer on /rhizoh/ops/hardening/status — verify rollout.activeTurns and GCL health",
    "Read POLICY prohibitions — do not auto-apply suggestedActions",
    "If DERIVED stressed but RAW idle, treat as projection/sim bias; no tier change without RAW corroboration",
    "Log decision in external ops ticket; narrative export is non-binding evidence only"
  ]),
  [DECISION_TIER_V0.TEAM_QUEUE]: Object.freeze([
    "Assign incident commander from on_call_engineer pool",
    "Acknowledge within team SLA; route FINOPS if GCL health degraded",
    "Run misread tabletop if operator acted on headline confidence alone",
    "Human sign-off required for burst/tier/GCL limit changes (PHASE3D state machine)"
  ]),
  [DECISION_TIER_V0.PLATFORM_GOVERNANCE]: Object.freeze([
    "Convene ops_lead + finops + incident_commander",
    "Acknowledge within 15m; customer comms only after RAW + GCL audit alignment",
    "Block any CI or script applying suggestedActions from narrative export",
    "Post-incident: refresh ops:state-narrative + ci:misread-gate artifacts"
  ])
});

/**
 * @param {string} tier
 */
export function routeDecisionOwnerV0(tier) {
  const ownership = describeDecisionOwnershipV0(tier);
  const route = DECISION_OWNER_ROUTE_V0[tier] || DECISION_OWNER_ROUTE_V0[DECISION_TIER_V0.SOLO_OPERATOR];
  return Object.freeze({
    ...ownership,
    routing: route,
    escalation: Object.freeze({
      ackWithinMinutes: route.ackSlaMinutes,
      resolveWithinMinutes: route.resolveSlaMinutes,
      escalateIfBreached: "next_tier_or_platform_governance"
    })
  });
}

/**
 * @param {{ dau?: number, tenantCount?: number, instances?: number }} ctx
 */
export function buildHumanDecisionOpsRunbookV0(ctx = {}) {
  const tier = resolveHumanDecisionTierV0(ctx);
  const routed = routeDecisionOwnerV0(tier);
  return Object.freeze({
    schema: HUMAN_OPS_RUNBOOK_SCHEMA_V0,
    tier,
    decisionOwner: routed.decisionOwner,
    routing: routed.routing,
    sla: Object.freeze({
      ackMinutes: routed.routing.ackSlaMinutes,
      resolveMinutes: routed.routing.resolveSlaMinutes,
      escalationMinutes: routed.escalationSlaMinutes
    }),
    requiredRoles: routed.requiredRoles,
    runbookSteps: RUNBOOK_STEPS_BY_TIER[tier] || RUNBOOK_STEPS_BY_TIER[DECISION_TIER_V0.SOLO_OPERATOR],
    invariants: Object.freeze([
      "narrative_never_executes_remediation",
      "raw_before_derived_before_policy_in_ui",
      "misread_gate_must_pass_before_release_tag"
    ]),
    references: Object.freeze([
      "docs/ops/PHASE3D_HUMAN_APPROVAL_GOVERNANCE_V1.0.md",
      "docs/ops/INTERPRETATION_UX_CONTRACT_V1.0.md",
      "docs/ops/NARRATIVE_MISREAD_SIMULATION_V1.0.md"
    ])
  });
}
