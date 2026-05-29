/**
 * Applied Systems Layer (ASL) v0 — Research + Robotics + World (SpiralMMO).
 * Rhizoh as epistemic integrity engine applied to institutions, embodiment, and worlds.
 */

import { buildResearchGovernanceLayerV0, buildResearchAuditFromOperationalV0 } from "./researchGovernanceLayerV0.js";
import { buildRoboticsGroundingFromNarrativeV0 } from "./roboticsGroundingSafetyLayerV0.js";
import { buildSpiralMMOGameKernelV0 } from "./spiralMMOGameKernelV0.js";

export const APPLIED_SYSTEMS_LAYER_SCHEMA_V0 = "rhizoh.applied_systems_layer.v0";

export const RHIZOH_SYSTEM_CLASS_V0 = Object.freeze({
  CONTROL: "control_system",
  INTELLIGENCE: "intelligence_system",
  WORLD: "world_system"
});

/**
 * @param {object} operationalNarrativeExport — full unified narrative (operational rhizoh)
 * @param {{ institutionId?: string, experimentId?: string, shardId?: string }} [opts]
 */
export function buildAppliedSystemsLayerV0(operationalNarrativeExport, opts = {}) {
  const research = buildResearchGovernanceLayerV0({
    institutionId: opts.institutionId,
    experimentId: opts.experimentId
  });
  const researchAudit = buildResearchAuditFromOperationalV0(operationalNarrativeExport, opts);
  const robotics = buildRoboticsGroundingFromNarrativeV0(operationalNarrativeExport);
  const spiralMMO = buildSpiralMMOGameKernelV0(operationalNarrativeExport, {
    shardId: opts.shardId || operationalNarrativeExport?.tenantScope?.tenantId
  });

  return Object.freeze({
    schema: APPLIED_SYSTEMS_LAYER_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    thesis:
      "Not growing an AI chat — building an epistemic OS connected to real worlds (institution, embodiment, simulation).",
    dualRhizoh: Object.freeze({
      operational: Object.freeze({
        role: "GCL, rollout, safety, propagation, trust — production bounded execution",
        class: RHIZOH_SYSTEM_CLASS_V0.CONTROL,
        linked: true
      }),
      research: Object.freeze({
        role: "Experiments, sim, robotics R&D, SpiralMMO — audit-only analysis of operational behavior",
        class: RHIZOH_SYSTEM_CLASS_V0.INTELLIGENCE,
        mayDriveProductionDecision: false,
        mayAnalyzeOperational: true
      })
    }),
    systemTrinity: Object.freeze({
      controlSystem: Object.freeze({
        primitives: ["gcl", "rollout", "lifecycle", "interpretation_safety_contract"]
      }),
      intelligenceSystem: Object.freeze({
        primitives: [
          "misread_simulation",
          "social_propagation",
          "trust_decay_mythology",
          "unified_state_narrative"
        ]
      }),
      worldSystem: Object.freeze({
        primitives: ["spiral_mmo_compiler", "robotics_grounding", "society_economy_projection"]
      })
    }),
    planes: Object.freeze({
      control: "GCL, rollout, lifecycle, lease, safety — physical reality control",
      intelligence: "propagation, misread, trust/mythology, validation — interpretation engine",
      world: "SpiralMMO, robotics — reality experienced"
    }),
    epistemicIntegrityEngine: Object.freeze({
      domains: Object.freeze([
        "robotics_wrong_world_model_physical_risk",
        "institutional_wrong_narrative_decision_chain",
        "spiral_mmo_wrong_lore_emergent_fake_reality"
      ]),
      sharedPrimitives: Object.freeze([
        "confidence_detachment_detection",
        "raw_first_policy",
        "divergence_scoring",
        "tenant_isolation",
        "hallucination_as_epistemic_error"
      ])
    }),
    researchGovernance: research,
    researchAudit,
    roboticsGrounding: robotics,
    spiralMMOGameKernel: spiralMMO,
    nextLayer: "action_semantic_governance_asgl",
    nonExecutable: true
  });
}
