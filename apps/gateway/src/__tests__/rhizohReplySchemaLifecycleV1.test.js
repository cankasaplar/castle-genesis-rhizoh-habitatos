import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RHIZOH_REPLY_SCHEMA_V1,
  attachReplySchemaContractV1,
  negotiateReplySchemaV1
} from "../rhizohReplySchemaRegistryV1.js";
import { resolveSchemaLifecycleV1, simulateReplySchemaEvolutionV1 } from "../rhizohReplySchemaLifecycleV1.js";

describe("rhizohReplySchemaLifecycleV1", () => {
  it("v1 is current, v2 is planned", () => {
    assert.equal(resolveSchemaLifecycleV1(RHIZOH_REPLY_SCHEMA_V1), "current");
    assert.equal(resolveSchemaLifecycleV1("castle.rhizoh.reply_schema.v2"), "planned");
  });

  it("simulate: v1 body passes v1 target", () => {
    const body = attachReplySchemaContractV1(
      {
        ok: true,
        reply: "ok",
        rhizohDeliveryKind: "ok",
        replyFormatDriftScore: 0,
        rhizohCompressionLedger: { replyExtractPath: "json.reply" }
      },
      RHIZOH_REPLY_SCHEMA_V1
    );
    const sim = simulateReplySchemaEvolutionV1(body, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(sim.wouldBreak, false);
    assert.equal(sim.violations.length, 0);
  });

  it("simulate: v1 body would break v2 planned (missing stricter contract)", () => {
    const body = {
      reply: "ok",
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1,
      rhizohDeliveryKind: "ok",
      replyContractDriftClass: "ok"
    };
    const sim = simulateReplySchemaEvolutionV1(body, "castle.rhizoh.reply_schema.v2");
    assert.equal(sim.wouldBreak, true);
    assert.ok(sim.violations.some((v) => v.includes("replySchemaLifecycleAudit")));
  });

  it("negotiate planned v2 request → unsupported_requested", () => {
    const n = negotiateReplySchemaV1("castle.rhizoh.reply_schema.v2");
    assert.equal(n.status, "unsupported_requested");
    assert.equal(n.lifecycle.lifecycle, "current");
  });
});
