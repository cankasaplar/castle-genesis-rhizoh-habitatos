import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MISAPPREHENSION_SHAPE_V0,
  buildRealityDriftObserverLayerV0,
  catalogMisapprehensionShapesV0,
  observeRoboticsFeedbackMismatchV0
} from "../ops/realityDriftObserverLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("realityDriftObserverLayerV0", () => {
  it("export includes RDOL catalog and three observers", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-rdol-export" });
    const rdol = n.realityDriftObserver;
    assert.equal(rdol?.schema, "rhizoh.reality_drift_observer.v0");
    assert.ok(rdol.realityModelDrift);
    assert.ok(rdol.propagationLiveDivergence);
    assert.ok(rdol.roboticsFeedbackMismatch);
    assert.ok(rdol.misapprehensionShapeCatalog?.shapeCount >= 0);
    assert.equal(rdol.stackPosition, "above_epistemicTemporalCoherence");
  });

  it("catalog includes known misapprehension shape ids", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-rdol-catalog" });
    const cat = catalogMisapprehensionShapesV0(n);
    const ids = cat.shapes.map((s) => s.shapeId);
    const known = Object.values(MISAPPREHENSION_SHAPE_V0);
    for (const id of ids) {
      assert.ok(known.includes(id));
    }
  });

  it("robotics observer flags feedback mismatch when blockActuation", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-rdol-robotics" });
    const obs = observeRoboticsFeedbackMismatchV0(n);
    if (n.appliedSystemsLayer?.roboticsGrounding?.blockActuation) {
      assert.equal(obs.active, true);
      assert.ok(obs.shapes.includes(MISAPPREHENSION_SHAPE_V0.ROBOTICS_FEEDBACK_MISMATCH));
    }
  });

  it("RDOL is non-executable", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-rdol-ne" });
    assert.equal(n.realityDriftObserver?.nonExecutable, true);
    assert.equal(n.interpretationSafetyContract?.can_execute, false);
  });
});
