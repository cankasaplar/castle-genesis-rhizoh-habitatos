/**
 * Research Governance Layer v0 — Research Rhizoh vs Operational Rhizoh.
 * Academic / institutional experiments: audit-only, cannot touch production control plane.
 * @see docs/ops/APPLIED_SYSTEMS_LAYER_V1.0.md
 */

export const RESEARCH_GOVERNANCE_SCHEMA_V0 = "rhizoh.research_governance_layer.v0";

export const RESEARCH_DOMAIN_V0 = Object.freeze([
  "robotics",
  "simulation",
  "spatial_systems",
  "spiral_mmo",
  "academic_audit"
]);

export const RESEARCH_CANNOT_TOUCH_V0 = Object.freeze([
  "GCL_LIMITS",
  "ROLLOUT_TIER",
  "BILLING",
  "PHASED_ROLLOUT_CLUSTER",
  "PRODUCTION_CONFIG_MUTATION",
  "NARRATIVE_EXECUTION"
]);

export const RESEARCH_OUTPUT_TYPE_V0 = Object.freeze({
  AUDIT_ONLY: "audit_only",
  DATASET_EXPORT: "dataset_export",
  PAPER_ARTIFACT: "paper_artifact"
});

export const DEFAULT_RESEARCH_MODE_V0 = Object.freeze({
  schema: RESEARCH_GOVERNANCE_SCHEMA_V0,
  mode: "research",
  allowedDomains: RESEARCH_DOMAIN_V0,
  cannotTouch: RESEARCH_CANNOT_TOUCH_V0,
  outputType: RESEARCH_OUTPUT_TYPE_V0.AUDIT_ONLY,
  mayAnalyzeOperationalRhizoh: true,
  mayDriveProductionDecision: false,
  hallucinationLabel: "epistemic_error",
  institutionalAudit: Object.freeze({
    requiredFields: Object.freeze([
      "tenantId",
      "experimentId",
      "principal",
      "narrativeFingerprint",
      "generatedAt",
      "provenanceChain"
    ]),
    exportFormats: Object.freeze(["json", "jsonl_audit_trail"])
  })
});

/**
 * @param {{ institutionId?: string, experimentId?: string, allowedDomains?: string[] }} [opts]
 */
export function buildResearchGovernanceLayerV0(opts = {}) {
  const institutionId = opts.institutionId ? String(opts.institutionId).slice(0, 128) : null;
  const experimentId = opts.experimentId ? String(opts.experimentId).slice(0, 128) : null;
  const domains = opts.allowedDomains?.length
    ? opts.allowedDomains.filter((d) => RESEARCH_DOMAIN_V0.includes(d))
    : [...RESEARCH_DOMAIN_V0];

  return Object.freeze({
    ...DEFAULT_RESEARCH_MODE_V0,
    institutionId,
    experimentId,
    allowedDomains: Object.freeze(domains),
    isolation: Object.freeze({
      separateFromOperationalRhizoh: true,
      operationalNarrativeReadOnly: true,
      researchWritesBlockedOn: RESEARCH_CANNOT_TOUCH_V0
    }),
    auditEnvelope: Object.freeze({
      schema: "rhizoh.research_audit_envelope.v0",
      institutionId,
      experimentId,
      nonBinding: true,
      notProductionApproval: true
    })
  });
}

/**
 * @param {string} actionTarget
 */
export function assertResearchCannotTouchProductionV0(actionTarget) {
  const t = String(actionTarget || "").toUpperCase();
  if (RESEARCH_CANNOT_TOUCH_V0.some((x) => t.includes(x) || x.includes(t))) {
    throw new Error(`research_governance_violation:cannot_touch_production:${actionTarget}`);
  }
  return true;
}

/**
 * Tag epistemic hallucination in research outputs (not physical actuation).
 * @param {{ source?: string, verified?: boolean, detail?: string }} ctx
 */
export function labelResearchEpistemicErrorV0(ctx = {}) {
  const verified = ctx.verified === true;
  const source = ctx.source || "unknown";
  return Object.freeze({
    schema: "rhizoh.research_epistemic_error_label.v0",
    isHallucination: !verified && source !== "sensor_verified",
    label: "epistemic_error",
    source,
    detail: ctx.detail || "state not sensor-verified or narrative diverged from RAW",
    notExecutable: true
  });
}

/**
 * @param {object} operationalNarrativeExport — read-only ops narrative
 * @param {object} researchCtx
 */
export function buildResearchAuditFromOperationalV0(operationalNarrativeExport, researchCtx = {}) {
  const layer = buildResearchGovernanceLayerV0(researchCtx);
  return Object.freeze({
    schema: layer.auditEnvelope.schema,
    generatedAt: new Date().toISOString(),
    research: layer,
    operationalSnapshot: Object.freeze({
      tenantScope: operationalNarrativeExport?.tenantScope,
      narrativeFingerprint: operationalNarrativeExport?.narrativeFingerprint,
      systemStateHealth: operationalNarrativeExport?.systemState?.health,
      culturalRiskFork: operationalNarrativeExport?.culturalRisk?.trustDynamics?.fork,
      misreadHighResidual: operationalNarrativeExport?.humanOps?.misreadSimulation?.highResidualCount,
      readOnly: true
    }),
    purpose: "Research Rhizoh analyzes Operational Rhizoh; never reverses authority"
  });
}
