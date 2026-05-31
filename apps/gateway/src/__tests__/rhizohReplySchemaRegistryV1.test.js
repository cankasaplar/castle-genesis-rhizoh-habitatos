import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RHIZOH_REPLY_SCHEMA_V1,
  RHIZOH_REPLY_SCHEMA_REGISTRY_V1,
  negotiateReplySchemaV1,
  classifyReplyContractDriftV1,
  attachReplySchemaContractV1
} from "../rhizohReplySchemaRegistryV1.js";

describe("rhizohReplySchemaRegistryV1", () => {
  it("registry pins current schema", () => {
    assert.equal(RHIZOH_REPLY_SCHEMA_REGISTRY_V1.current, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(RHIZOH_REPLY_SCHEMA_REGISTRY_V1.entries.length, 2);
    assert.equal(RHIZOH_REPLY_SCHEMA_REGISTRY_V1.entries[0].lifecycle, "current");
  });

  it("negotiate: no request → downgraded_to_current", () => {
    const n = negotiateReplySchemaV1(null);
    assert.equal(n.status, "downgraded_to_current");
    assert.equal(n.active, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(n.requested, null);
  });

  it("negotiate: matched when client sends current", () => {
    const n = negotiateReplySchemaV1(RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(n.status, "matched");
  });

  it("negotiate: unsupported future schema → unsupported_requested", () => {
    const n = negotiateReplySchemaV1("castle.rhizoh.reply_schema.v99");
    assert.equal(n.status, "unsupported_requested");
    assert.equal(n.active, RHIZOH_REPLY_SCHEMA_V1);
  });

  it("classify: unsupported → breaking", () => {
    const c = classifyReplyContractDriftV1({
      negotiation: negotiateReplySchemaV1("castle.rhizoh.reply_schema.v99"),
      rhizohDeliveryKind: "ok",
      replyFormatDriftScore: 0
    });
    assert.equal(c, "breaking");
  });

  it("classify: unstructured_reply → informative", () => {
    const c = classifyReplyContractDriftV1({
      negotiation: negotiateReplySchemaV1(RHIZOH_REPLY_SCHEMA_V1),
      rhizohDeliveryKind: "unstructured_reply",
      replyFormatDriftScore: 0.5,
      extractPath: "plain_text_fallback"
    });
    assert.equal(c, "informative");
  });

  it("classify: matched + clean → ok", () => {
    const c = classifyReplyContractDriftV1({
      negotiation: negotiateReplySchemaV1(RHIZOH_REPLY_SCHEMA_V1),
      rhizohDeliveryKind: "ok",
      replyFormatDriftScore: 0,
      extractPath: "json.reply"
    });
    assert.equal(c, "ok");
  });

  it("attachReplySchemaContractV1 adds registry fields", () => {
    const out = attachReplySchemaContractV1(
      {
        ok: true,
        reply: "merhaba",
        rhizohDeliveryKind: "ok",
        replyFormatDriftScore: 0,
        rhizohCompressionLedger: { replyExtractPath: "json.reply" }
      },
      RHIZOH_REPLY_SCHEMA_V1
    );
    assert.equal(out.replySchemaVersion, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(out.replySchemaNegotiation.status, "matched");
    assert.equal(out.replyContractDriftClass, "ok");
    assert.ok(out.replySchemaRegistry);
  });
});
