import { describe, expect, it } from "vitest";
import {
  projectReplySchemaFromGatewayV1,
  RHIZOH_REPLY_SCHEMA_V1,
  RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
} from "../rhizohReplySchemaRegistryV1.js";
import { normalizeRhizohLlmGatewayResponseV0 } from "../rhizohLlmReplyNormalizeV0.js";

describe("rhizohReplySchemaRegistryV1 (client passive)", () => {
  it("projects gateway negotiation — no client-side assess", () => {
    const p = projectReplySchemaFromGatewayV1({
      replySchemaRegistry: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1,
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1,
      replySchemaNegotiation: {
        requested: RHIZOH_REPLY_SCHEMA_V1,
        active: RHIZOH_REPLY_SCHEMA_V1,
        status: "matched",
        registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
      },
      replyContractDriftClass: "ok",
      reply: "merhaba"
    });
    expect(p.replyContractDriftClass).toBe("ok");
    expect(p.contractOk).toBe(true);
    expect(p.contractDrift).toBe(false);
    expect(p.replySchemaNegotiation?.status).toBe("matched");
  });

  it("informative drift — contractOk true, render continues", () => {
    const p = projectReplySchemaFromGatewayV1({
      replyContractDriftClass: "informative",
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1
    });
    expect(p.contractOk).toBe(true);
    expect(p.contractDrift).toBe(false);
    expect(p.replyContractDriftClass).toBe("informative");
  });

  it("breaking drift — contractDrift true", () => {
    const p = projectReplySchemaFromGatewayV1({
      replyContractDriftClass: "breaking",
      replySchemaNegotiation: { status: "unsupported_requested", active: RHIZOH_REPLY_SCHEMA_V1 }
    });
    expect(p.contractOk).toBe(false);
    expect(p.contractDrift).toBe(true);
  });

  it("legacy_only when gateway omits contract fields", () => {
    const p = projectReplySchemaFromGatewayV1({ reply: "legacy" });
    expect(p.replyContractDriftClass).toBe("legacy_only");
    expect(p.contractOk).toBe(false);
    expect(p.contractDrift).toBe(false);
  });

  it("normalize passes through gateway drift class", () => {
    const n = normalizeRhizohLlmGatewayResponseV0({
      reply: "x",
      replyContractDriftClass: "informative",
      replySchemaVersion: RHIZOH_REPLY_SCHEMA_V1,
      rhizohDeliveryKind: "unstructured_reply"
    });
    expect(n.replyContractDriftClass).toBe("informative");
    expect(n.contractOk).toBe(true);
  });
});
