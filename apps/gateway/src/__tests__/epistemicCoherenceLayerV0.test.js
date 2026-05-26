import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONFLICT_CLASS_V0,
  COHERENCE_VERDICT_V0,
  buildEpistemicCoherenceLayerV0,
  detectCrossLayerContradictionsV0
} from "../ops/epistemicCoherenceLayerV0.js";
import { EXECUTION_ELIGIBILITY_V0 } from "../ops/actionContextResolutionLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("epistemicCoherenceLayerV0", () => {
  it("detects semantic_ok_permission_blocked when ASGL allows but ACRL blocks active", () => {
    const n = {
      actionSemanticGovernance: {
        evaluatedSuggestedActions: [
          {
            id: "deploy_agent",
            allowed: true,
            shouldRequireHumanSignoff: false,
            domains: { governance: { permission: "human_signoff_required" } },
            crossDomain: { score: 0.6 }
          }
        ]
      },
      actionContextResolution: {
        contextFingerprint: { inferredActiveDomain: "governance", gclHealthy: true },
        executionEligibilityMatrix: [
          {
            actionId: "deploy_agent",
            matrix: {
              governance: { eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED },
              robotics: { eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED },
              spiral_mmo: { eligibility: EXECUTION_ELIGIBILITY_V0.BLOCKED }
            }
          }
        ],
        asglGclBinding: { valid: true }
      },
      appliedSystemsLayer: { roboticsGrounding: { blockActuation: true } }
    };
    const c = detectCrossLayerContradictionsV0(n);
    assert.ok(
      c.conflicts.some((x) => x.class === CONFLICT_CLASS_V0.SEMANTIC_OK_PERMISSION_BLOCKED)
    );
  });

  it("flags context fragmentation on deploy_agent three-axis spread", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-ecl-frag" });
    const ecl = n.epistemicCoherence;
    assert.ok(ecl?.contextFragmentationRisk?.active === true);
    assert.ok(
      ecl.crossLayerContradictions.conflicts.some(
        (x) => x.class === CONFLICT_CLASS_V0.CONTEXT_FRAGMENTATION
      )
    );
  });

  it("export includes ux compression single decision surface", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-ecl-export" });
    const ux = n.epistemicCoherence?.uxCompression;
    assert.equal(n.epistemicCoherence?.schema, "rhizoh.epistemic_coherence.v0");
    assert.ok(ux?.headline?.tr);
    assert.ok(ux?.layersOneLine?.meaning);
    assert.ok(ux?.layersOneLine?.decision);
    assert.ok(
      [COHERENCE_VERDICT_V0.COHERENT, COHERENCE_VERDICT_V0.FRAGMENTED, COHERENCE_VERDICT_V0.CONTRADICTORY].includes(
        n.epistemicCoherence?.systemCoherence?.verdict
      )
    );
  });
});
