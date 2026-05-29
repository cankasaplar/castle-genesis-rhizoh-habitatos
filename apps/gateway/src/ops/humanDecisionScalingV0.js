/**
 * Human decision scaling v0 — who owns decisions at 100 vs 10k users.
 * Gateway stays bounded; decision load scales via human/ops tiers, not narrative execution.
 */

export const HUMAN_DECISION_SCALING_SCHEMA_V0 = "rhizoh.human_decision_scaling.v0";

export const DECISION_TIER_V0 = Object.freeze({
  SOLO_OPERATOR: "solo_operator",
  TEAM_QUEUE: "team_on_call_queue",
  PLATFORM_GOVERNANCE: "platform_governance_board"
});

/**
 * @param {{ dau?: number, instances?: number, tenantCount?: number }} ctx
 */
export function resolveHumanDecisionTierV0(ctx = {}) {
  const dau = Math.max(0, Number(ctx.dau) || 0);
  const tenants = Math.max(1, Number(ctx.tenantCount) || 1);

  if (dau >= 10_000 || tenants > 20) return DECISION_TIER_V0.PLATFORM_GOVERNANCE;
  if (dau >= 1_000 || tenants > 3) return DECISION_TIER_V0.TEAM_QUEUE;
  return DECISION_TIER_V0.SOLO_OPERATOR;
}

/**
 * @param {string} tier
 */
export function describeDecisionOwnershipV0(tier) {
  switch (tier) {
    case DECISION_TIER_V0.PLATFORM_GOVERNANCE:
      return Object.freeze({
        tier,
        decisionOwner: "platform_governance_board",
        narrativeRole: "briefing_only",
        escalationSlaMinutes: 15,
        requiredRoles: Object.freeze(["ops_lead", "finops", "incident_commander"]),
        automationCeiling: "gateway_bounded_execution_only"
      });
    case DECISION_TIER_V0.TEAM_QUEUE:
      return Object.freeze({
        tier,
        decisionOwner: "team_on_call_queue",
        narrativeRole: "hypothesis_for_triage",
        escalationSlaMinutes: 60,
        requiredRoles: Object.freeze(["on_call_engineer"]),
        automationCeiling: "gateway_bounded_execution_only"
      });
    default:
      return Object.freeze({
        tier: DECISION_TIER_V0.SOLO_OPERATOR,
        decisionOwner: "human_or_external_ops",
        narrativeRole: "operator_notes",
        escalationSlaMinutes: 240,
        requiredRoles: Object.freeze(["founding_operator"]),
        automationCeiling: "gateway_bounded_execution_only"
      });
  }
}

export function buildHumanDecisionScalingV0(ctx = {}, runbookAttach) {
  const tier = resolveHumanDecisionTierV0(ctx);
  const ownership = describeDecisionOwnershipV0(tier);
  return Object.freeze({
    schema: HUMAN_DECISION_SCALING_SCHEMA_V0,
    context: Object.freeze({
      dau: ctx.dau ?? null,
      instances: ctx.instances ?? null,
      tenantCount: ctx.tenantCount ?? 1
    }),
    ...ownership,
    opsRunbook: runbookAttach ?? null,
    scalingLaw:
      "Decision load scales with humans and queues; gateway narrative never absorbs ownership.",
    at10k: Object.freeze({
      note: "At 10k DAU, solo-operator model breaks — tier must be team_queue or platform_governance.",
      minTier: DECISION_TIER_V0.TEAM_QUEUE
    })
  });
}
