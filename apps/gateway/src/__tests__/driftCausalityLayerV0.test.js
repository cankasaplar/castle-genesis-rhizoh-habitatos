import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CAUSAL_DOMAIN_V0,
  buildCausalDomainBundleV0,
  buildDriftCausalityLayerV0,
  explainCabEclAuthorityMisreadCausalityV0,
  explainPropagationDistortionCausalityV0
} from "../ops/driftCausalityLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("driftCausalityLayerV0", () => {
  it("explains four causal domains", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dcl-domains" });
    const bundle = buildCausalDomainBundleV0(n);
    assert.equal(bundle.propagation.domain, CAUSAL_DOMAIN_V0.PROPAGATION);
    assert.equal(bundle.edpl.domain, CAUSAL_DOMAIN_V0.EDPL_PACING);
    assert.equal(bundle.dpub.domain, CAUSAL_DOMAIN_V0.DPUB_UNCERTAINTY);
    assert.equal(bundle.cabEcl.domain, CAUSAL_DOMAIN_V0.CAB_ECL_AUTHORITY);
    assert.ok(bundle.propagation.question);
    assert.ok(bundle.cabEcl.question);
  });

  it("links RDOL shapes to causes when shapes present", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dcl-links" });
    const dcl = buildDriftCausalityLayerV0(n);
    const rdolCount = n.realityDriftObserver?.misapprehensionShapeCatalog?.shapeCount ?? 0;
    assert.equal(dcl.rdolLinkage?.driftShapesObserved, rdolCount);
    if (rdolCount > 0) {
      assert.ok(dcl.shapeCausality?.links?.length >= 1);
    }
  });

  it("propagation causality active when social sim has high residual", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dcl-prop" });
    const prop = explainPropagationDistortionCausalityV0(n);
    if ((n.humanOps?.socialPropagationSimulation?.highResidualCount ?? 0) > 0) {
      assert.equal(prop.active, true);
      assert.ok(prop.causes.length >= 1);
    }
  });

  it("DCL is non-executable and requires RDOL stack", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dcl-export" });
    assert.equal(n.driftCausality?.schema, "rhizoh.drift_causality.v0");
    assert.equal(n.driftCausality?.nonExecutable, true);
    assert.ok(n.realityDriftObserver?.schema);
    assert.equal(n.driftCausality?.stackPosition, "above_realityDriftObserver");
  });
});
