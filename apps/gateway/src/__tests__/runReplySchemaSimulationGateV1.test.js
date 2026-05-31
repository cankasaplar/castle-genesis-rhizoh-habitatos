import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateReplySchemaSimulationGateV1 } from "../ops/runReplySchemaSimulationGateV1.mjs";
import { simulateReplySchemaEvolutionV1 } from "../rhizohReplySchemaLifecycleV1.js";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/replySchemaGoldenSuiteV1.json"
);

describe("runReplySchemaSimulationGateV1", () => {
  it("passes golden suite + live attach probes against current schema", () => {
    const out = evaluateReplySchemaSimulationGateV1({ fixturePath });
    assert.equal(out.passed, true, out.failures.join("; "));
    assert.ok(out.results.length >= 5);
    assert.equal(out.enforceSchema, "castle.rhizoh.reply_schema.v1");
  });

  it("shadow v2 wouldBreak is informational unless --strict-future", () => {
    const out = evaluateReplySchemaSimulationGateV1({ fixturePath, strictFuture: false });
    const shadow = out.shadowResults.find((r) => r.id === "v2_shadow_from_golden_ok");
    assert.ok(shadow);
    assert.equal(shadow.wouldBreak, true);
    assert.equal(out.passed, true);
  });

  it("broken body fails simulation against current schema", () => {
    const sim = simulateReplySchemaEvolutionV1({ reply: "only reply" }, "castle.rhizoh.reply_schema.v1");
    assert.equal(sim.wouldBreak, true);
    assert.ok(sim.violations.some((v) => v.startsWith("missing_required:")));
  });
});
