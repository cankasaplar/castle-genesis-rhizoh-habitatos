export const RHIZOH_GOVERNANCE_RECONCILIATION_LAYER_VERSION = "v1";

export const RHIZOH_GOVERNANCE_CONFLICT_KIND = Object.freeze({
  ONLINE_APPROVED_OFFLINE_INVALID: "online_approved_offline_invalid",
  ONLINE_BLOCKED_OFFLINE_VALID: "online_blocked_offline_valid",
  ONLINE_OFFLINE_CONSISTENT: "online_offline_consistent"
});

function buildPolicyPatch(conflictKind, input) {
  if (conflictKind === RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_APPROVED_OFFLINE_INVALID) {
    return Object.freeze({
      forceApprovalForRiskTier: input?.riskTier ?? "high",
      increaseOfflineWeight: true,
      retroactiveInvalidationEnabled: true
    });
  }
  if (conflictKind === RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_BLOCKED_OFFLINE_VALID) {
    return Object.freeze({
      relaxOnlineFreezeThreshold: true,
      keepHumanGate: true
    });
  }
  return Object.freeze({});
}

export function reconcileGovernanceDecisionsV1(input = {}) {
  const online = input.online ?? {};
  const offline = input.offline ?? {};
  const onlineApproved = online?.decisions?.approvalGate === false && online?.decisions?.freeze === false;
  const offlineValid = offline?.closure?.ok === true;

  let conflictKind = RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_OFFLINE_CONSISTENT;
  if (onlineApproved && !offlineValid) conflictKind = RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_APPROVED_OFFLINE_INVALID;
  else if (!onlineApproved && offlineValid) conflictKind = RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_BLOCKED_OFFLINE_VALID;

  const policyPatch = buildPolicyPatch(conflictKind, input);
  const retroactiveInvalidationRules = Object.freeze({
    enabled: conflictKind === RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_APPROVED_OFFLINE_INVALID,
    invalidateStatuses: Object.freeze(["completed", "running", "pending"]),
    reason: "offline_closure_override"
  });

  return Object.freeze({
    version: RHIZOH_GOVERNANCE_RECONCILIATION_LAYER_VERSION,
    conflictKind,
    policyPatch,
    retroactiveInvalidationRules,
    requiresImmediateFreeze: conflictKind === RHIZOH_GOVERNANCE_CONFLICT_KIND.ONLINE_APPROVED_OFFLINE_INVALID,
    onlineSummary: Object.freeze({
      freeze: !!online?.decisions?.freeze,
      approvalGate: !!online?.decisions?.approvalGate
    }),
    offlineSummary: Object.freeze({
      ok: !!offline?.closure?.ok,
      score: Number(offline?.closure?.score ?? 0)
    })
  });
}

