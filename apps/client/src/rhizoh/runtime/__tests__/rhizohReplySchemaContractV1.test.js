import { describe, expect, it } from "vitest";
import {
  assessRhizohReplySchemaContractV1,
  RHIZOH_REPLY_SCHEMA_VERSION_V1
} from "../rhizohReplySchemaContractV1.js";
import { normalizeRhizohLlmGatewayResponseV0 } from "../rhizohLlmReplyNormalizeV0.js";

describe("rhizohReplySchemaContractV1", () => {
  it("contractOk when replySchemaVersion matches pin", () => {
    const c = assessRhizohReplySchemaContractV1({
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_VERSION_V1,
      reply: "ok"
    });
    expect(c.contractOk).toBe(true);
    expect(c.contractDrift).toBe(false);
  });

  it("contractDrift when version mismatches — still no client re-extract", () => {
    const c = assessRhizohReplySchemaContractV1({
      replySchemaVersion: "castle.rhizoh.reply_schema.v99",
      text: "shadow",
      reply: "canonical"
    });
    expect(c.contractOk).toBe(false);
    expect(c.contractDrift).toBe(true);
    const n = normalizeRhizohLlmGatewayResponseV0({
      replySchemaVersion: "castle.rhizoh.reply_schema.v99",
      text: "shadow",
      reply: "canonical"
    });
    expect(n.reply).toBe("canonical");
    expect(n.contractOk).toBe(false);
  });

  it("missing replySchemaVersion — contractOk false, not contractDrift", () => {
    const c = assessRhizohReplySchemaContractV1({ reply: "legacy gateway" });
    expect(c.contractOk).toBe(false);
    expect(c.contractDrift).toBe(false);
    expect(c.replySchemaVersion).toBe("");
  });
});
