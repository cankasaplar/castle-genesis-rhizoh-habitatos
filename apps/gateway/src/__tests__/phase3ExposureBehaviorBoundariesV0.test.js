import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runExposureBehaviorBoundaryHarnessV0,
  scanForbiddenAuthorityPhrasesV0,
  verifyFeedbackLoopHumanOnlyV0,
  MISUNDERSTANDING_SCENARIOS_V0
} from "../ops/phase3ExposureBehaviorBoundariesV0.js";
import { runPhase3ExecutionSpecHarnessV0 } from "../ops/phase3HarnessExportV0.js";

describe("phase3ExposureBehaviorBoundariesV0", () => {
  it("misunderstanding catalog covers authority and soft steering", () => {
    const ids = MISUNDERSTANDING_SCENARIOS_V0.map((s) => s.id);
    assert.ok(ids.includes("M1_attractor_as_command"));
    assert.ok(ids.includes("M4_telemetry_soft_steering"));
    assert.equal(MISUNDERSTANDING_SCENARIOS_V0.length, 5);
  });

  it("detects forbidden authority phrases in text", () => {
    const bad = scanForbiddenAuthorityPhrasesV0('{"note":"you should deploy"}');
    assert.equal(bad.ok, false);
    const good = scanForbiddenAuthorityPhrasesV0('{"rationale":"observed_over_gating"}');
    assert.equal(good.ok, true);
  });

  it("full exposure behavior harness passes on spec export", () => {
    const h = runPhase3ExecutionSpecHarnessV0();
    const r = runExposureBehaviorBoundaryHarnessV0(h);
    assert.equal(r.pass, "exposure_behavior_boundaries_pass");
    assert.equal(r.stableOnOpen.executionIsolatedFromShadow, true);
    assert.equal(r.checks.feedbackLoopHumanOnly.ok, true);
    assert.equal(r.checks.authorityPerceptionContract.ok, true);
    assert.equal(r.authorityPerceptionFailureModes.length, 8);
    const fb = verifyFeedbackLoopHumanOnlyV0(h);
    assert.equal(fb.ok, true);
    assert.equal(h.phase3Observation.authorityPerception.noActionClaimMode, "NO_ACTION_CLAIM_MODE");
    assert.equal(h.phase3Observation.proposalQueue.cannotBeInterpretedAsGuidance, true);
  });
});
