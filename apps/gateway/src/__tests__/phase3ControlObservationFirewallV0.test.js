import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  verifyControlPathFirewallV0,
  FIREWALL_MANIFEST_V0
} from "../ops/phase3ControlObservationFirewallV0.js";
import { runPhase3ExecutionSpecHarnessV0 } from "../ops/phase3HarnessExportV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const controlPath = join(root, "apps/gateway/src/ops/phase3ControlledDivergenceRuntimeV0.js");

describe("phase3ControlObservationFirewallV0", () => {
  it("control module source has no Phase 3D coupling", () => {
    const src = readFileSync(controlPath, "utf8");
    const v = verifyControlPathFirewallV0(src);
    assert.equal(v.ok, true, v.violations.join(", "));
  });

  it("execution gate independent of observation gate inputs", () => {
    const h = runPhase3ExecutionSpecHarnessV0();
    assert.equal(h.firewall.rule, FIREWALL_MANIFEST_V0.rule);
    assert.ok(h.phase3Control);
    assert.ok(h.phase3Observation);
    assert.equal(h.phase3ExecutionGate, h.phase3Control.phase3ExecutionGate);
    assert.equal(h.phase3dObservationGate, h.phase3Observation.phase3dObservationGate);
    assert.equal(h.phase3Control.role, "control_only");
    assert.equal(h.phase3Observation.role, "observation_only");
    assert.equal(h.phase3Observation.feedsExecution, false);
    assert.ok(h.phase3Observation.phase3DAttractorIntelligence);
    assert.ok(!("operabilityBalance" in h.phase3Control));
    assert.equal(h.phase3Observation.shadowLearning?.controlBackflowAllowed, false);
    assert.equal(h.phase3Observation.shadowLearning?.internalRepresentationAllowed, true);
    assert.equal(h.phase3Observation.shadowLearning?.exportValid, true);
  });

  it("observation gate may differ without changing execution exit criterion", () => {
    const h = runPhase3ExecutionSpecHarnessV0();
    const controlPass = h.phase3Control.phase3ExecutionGate === "phase3_runtime_spec_pass";
    const obsReady =
      h.phase3Observation.phase3dObservationGate === "phase3d_attractor_layer_ready";
    assert.equal(controlPass, h.phase3ExecutionGate === "phase3_runtime_spec_pass");
    if (controlPass) assert.equal(obsReady, true);
  });
});
