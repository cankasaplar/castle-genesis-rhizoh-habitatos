import { describe, expect, it } from "vitest";
import {
  projectReplySchemaFromGatewayV1,
  RHIZOH_REPLY_SCHEMA_V1
} from "../rhizohReplySchemaRegistryV1.js";
import { normalizeRhizohLlmGatewayResponseV0 } from "../rhizohLlmReplyNormalizeV0.js";

describe("rhizohReplySchemaContractV1 (passive projection)", () => {
  it("contractOk when gateway declares ok", () => {
    const c = projectReplySchemaFromGatewayV1({
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1,
      replyContractDriftClass: "ok",
      reply: "ok"
    });
    expect(c.contractOk).toBe(true);
    expect(c.contractDrift).toBe(false);
  });

  it("breaking from gateway — client does not re-assess version", () => {
    const c = projectReplySchemaFromGatewayV1({
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1,
      replyContractDriftClass: "breaking",
      reply: "canonical"
    });
    expect(c.contractDrift).toBe(true);
    const n = normalizeRhizohLlmGatewayResponseV0({
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1,
      replyContractDriftClass: "breaking",
      reply: "canonical"
    });
    expect(n.reply).toBe("canonical");
    expect(n.replyContractDriftClass).toBe("breaking");
  });

  it("missing gateway contract → legacy_only projection", () => {
    const c = projectReplySchemaFromGatewayV1({ reply: "legacy gateway" });
    expect(c.replyContractDriftClass).toBe("legacy_only");
    expect(c.contractOk).toBe(false);
    expect(c.contractDrift).toBe(false);
    expect(c.replySchemaVersion).toBe("");
  });
});
