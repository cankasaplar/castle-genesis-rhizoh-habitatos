import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runSocialPropagationSimulationV0,
  simulateCompressionLayerV0,
  simulateMutationChainV0,
  extractPropagationSourceArtifactsV0,
  PROPAGATION_CHANNEL_V0
} from "../ops/socialPropagationSimulationV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("socialPropagationSimulationV0", () => {
  it("confidence hero clip has high compression score", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-prop-test" });
    const artifacts = extractPropagationSourceArtifactsV0(n);
    const c = simulateCompressionLayerV0(artifacts, "CONFIDENCE_HERO");
    assert.ok(c.semanticCompressionScore >= 0.7);
    assert.equal(c.profile, "confidence_hero");
    assert.equal(c.confidenceDetachedRisk, true);
  });

  it("mutation chain intensifies stressed headline", () => {
    const m = simulateMutationChainV0("Rhizoh: stressed (saturation)");
    assert.ok(m.finalText.toLowerCase().includes("critical") || m.interpretiveDrift);
  });

  it("tiktok has highest authority amplification", () => {
    assert.ok(
      PROPAGATION_CHANNEL_V0.TIKTOK_SHORT.authorityAmplification >
        PROPAGATION_CHANNEL_V0.SLACK_INTERNAL.authorityAmplification
    );
  });

  it("full propagation sim returns four paths", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-prop-test-2" });
    const sim = runSocialPropagationSimulationV0(n);
    assert.equal(sim.paths.length, 4);
    assert.ok(sim.semanticWatermark.structureSignature);
    assert.ok(sim.confidenceReadabilityPolicy.neverPublishExactTrustworthyOnShareableSurfaces);
  });
});
