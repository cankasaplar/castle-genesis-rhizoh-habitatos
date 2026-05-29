/**
 * Narrative misread simulation v0 — wrong story → wrong human action (tabletop).
 * Non-executable scenarios for ops training and governance review.
 */

export const NARRATIVE_MISREAD_SIM_SCHEMA_V0 = "rhizoh.narrative_misread_simulation.v0";

export const MISREAD_SCENARIO_V0 = Object.freeze([
  {
    id: "headline_go_live",
    trigger: "Operator treats confidenceHeadline 0.95 as production go-ahead",
    wrongHumanAction: "Increase burst traffic without checking RAW rollout activeTurns",
    likelyHarm: "Capacity violation; user-facing 429 storm",
    prevention: ["show trustworthy_confidence", "requireDisclaimerBanner", "policy.prohibitedActions"]
  },
  {
    id: "saturation_ignore_raw",
    trigger: "DERIVED says saturation; operator skips RAW (live rollout idle)",
    wrongHumanAction: "Emergency tier downgrade based on load-test only",
    likelyHarm: "Unnecessary capacity cut; false incident",
    prevention: ["divergence.narrative_metrics_mismatch", "displayRules.showRawStateFirst"]
  },
  {
    id: "suggested_action_autopilot",
    trigger: "suggestedActions read as system queue to execute",
    wrongHumanAction: "Script applies reduce_burst_concurrency via CI",
    likelyHarm: "Config drift without human sign-off",
    prevention: ["executable:false", "can_execute:false", "prohibitedUiPatterns.auto_apply"]
  },
  {
    id: "hypothesis_as_incident_sev1",
    trigger: "trustPosture hypothesis_only ignored; headline Rhizoh: stressed promoted",
    wrongHumanAction: "Page entire on-call for saturation that is SIM-only",
    likelyHarm: "Alert fatigue; missed real incident",
    prevention: ["uncertainty.projection_bias tag", "executionMode badge coordination_sim"]
  },
  {
    id: "multi_tenant_blame_drift",
    trigger: "Single narrative shown to all tenants without decision_owner context",
    wrongHumanAction: "Tenant A ops applies Tenant B governance narrative",
    likelyHarm: "Wrong policy change; trust loss",
    prevention: [
      "humanDecisionScaling.tenantCount",
      "decision_owner per tenant routing",
      "tenantScoped.derived",
      "tenantScope.tenantId"
    ]
  }
]);

/**
 * @param {object} narrativeExport
 */
function mitigationMatchesPreventionV0(p, ctx) {
  const { validation, ui, contract, layers, governance, humanOps, narrativeExport } = ctx;

  if (p === "can_execute:false") return contract?.can_execute === false;
  if (p === "executable:false") return contract?.can_execute === false;
  if (p === "policy.prohibitedActions") {
    return (layers?.policy?.prohibitedActions?.length || 0) > 0;
  }
  if (p === "requireDisclaimerBanner") return ui?.displayRules?.requireDisclaimerBanner === true;
  if (p === "show trustworthy_confidence") {
    return ui?.displayRules?.primaryMetricLabel === "trustworthy_confidence";
  }
  if (p === "displayRules.showRawStateFirst") return ui?.displayRules?.showRawStateFirst === true;
  if (p === "divergence.narrative_metrics_mismatch") {
    return validation.divergence?.flags?.some((f) => f.id === "narrative_metrics_mismatch") === true;
  }
  if (p.startsWith("divergence.") && validation.divergence?.flags?.length) return true;
  if (p === "uncertainty.projection_bias tag") {
    return validation.uncertainty?.tags?.some((t) => t.id === "projection_bias") === true;
  }
  if (p === "executionMode badge coordination_sim") {
    return layers?.raw?.rollout?.coordinationSim === true || layers?.raw?.loadTest?.executionMode === "coordination_sim";
  }
  if (p.startsWith("prohibitedUiPatterns.")) {
    const key = p.split(".")[1];
    return ui?.prohibitedUiPatterns?.includes(key) === true;
  }
  if (p.startsWith("humanDecisionScaling.")) return Boolean(humanOps?.humanDecisionScaling?.decisionOwner);
  if (p.startsWith("decision_owner")) return Boolean(humanOps?.humanDecisionScaling?.decisionOwner);
  if (p === "tenantScoped.derived") return layers?.derived?.tenantScoped === true;
  if (p.startsWith("tenantScope.")) return Boolean(narrativeExport?.tenantScope?.tenantId);
  if (p.startsWith("ui_") && ui?.displayRules) return true;
  return false;
}

export function runNarrativeMisreadSimulationV0(narrativeExport) {
  const validation = narrativeExport?.validation || {};
  const ui = narrativeExport?.humanOps?.narrativeUiSafety;
  const contract = narrativeExport?.interpretationSafetyContract;
  const layers = narrativeExport?.stateLayers;
  const governance = narrativeExport?.governance;
  const humanOps = narrativeExport?.humanOps;
  const mitigationsActive = [];

  if (ui?.displayRules?.neverShowHeadlineConfidenceAlone) mitigationsActive.push("ui_headline_guard");
  if (ui?.displayRules?.showRawStateFirst) mitigationsActive.push("raw_first");
  if (validation.divergence?.flags?.length) mitigationsActive.push("divergence_flags");
  if (contract?.can_execute === false) mitigationsActive.push("safety_contract");
  if (governance?.narrativeIsNotDecisionLayer) mitigationsActive.push("governance_metadata");
  if (humanOps?.humanDecisionOpsRunbook) mitigationsActive.push("ops_runbook");

  const ctx = { validation, ui, contract, layers, governance, humanOps, narrativeExport };

  /** @type {Record<string, unknown>[]} */
  const outcomes = MISREAD_SCENARIO_V0.map((s) => {
    const blocked = s.prevention.some((p) => mitigationMatchesPreventionV0(p, ctx));
    return Object.freeze({
      ...s,
      residualRisk: blocked ? "reduced" : "high",
      mitigationsMatched: mitigationsActive
    });
  });

  const highResidual = outcomes.filter((o) => o.residualRisk === "high").length;

  return Object.freeze({
    schema: NARRATIVE_MISREAD_SIM_SCHEMA_V0,
    ranAt: new Date().toISOString(),
    scenarioCount: outcomes.length,
    highResidualCount: highResidual,
    outcomes,
    tabletopVerdict:
      highResidual === 0
        ? "current_guards_cover_listed_misreads"
        : `${highResidual} misread paths still open — strengthen UI safety or training`,
    note: "Simulation only; does not execute remediation"
  });
}
