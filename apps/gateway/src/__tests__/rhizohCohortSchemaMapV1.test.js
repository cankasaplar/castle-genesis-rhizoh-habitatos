import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COHORT_SCHEMA_MAP_V1,
  resolveSchemaForRequestV1,
  resolveCohortPinV1,
  RHIZOH_REPLY_SCHEMA_V2_SHADOW_V1
} from "../rhizohCohortSchemaMapV1.js";
import { RHIZOH_REPLY_SCHEMA_V1, attachReplySchemaContractV1, negotiateReplySchemaV1 } from "../rhizohReplySchemaRegistryV1.js";

describe("rhizohCohortSchemaMapV1", () => {
  it("resolveSchemaForRequest: unknown cohort → current", () => {
    assert.equal(resolveSchemaForRequestV1({ cohortId: "unknown" }), RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(resolveSchemaForRequestV1({}), RHIZOH_REPLY_SCHEMA_V1);
  });

  it("cohort_alpha pins v1", () => {
    assert.equal(resolveSchemaForRequestV1({ cohortId: "cohort_alpha" }), RHIZOH_REPLY_SCHEMA_V1);
    const pin = resolveCohortPinV1("cohort_alpha");
    assert.equal(pin?.pinnedSchema, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(pin?.observationOnly, false);
  });

  it("cohort_canary → v2_shadow observation pin", () => {
    assert.equal(resolveSchemaForRequestV1({ cohortId: "cohort_canary" }), RHIZOH_REPLY_SCHEMA_V2_SHADOW_V1);
    const pin = resolveCohortPinV1("cohort_canary");
    assert.equal(pin?.observationOnly, true);
  });

  it("negotiate cohort_canary → cohort_shadow, active stays v1", () => {
    const n = negotiateReplySchemaV1(null, { cohortId: "cohort_canary" });
    assert.equal(n.status, "cohort_shadow");
    assert.equal(n.active, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(n.requested, RHIZOH_REPLY_SCHEMA_V2_SHADOW_V1);
    assert.equal(n.observationOnly, true);
  });

  it("attach with cohort_canary keeps v1 replySchemaVersion on body", () => {
    const out = attachReplySchemaContractV1(
      {
        ok: true,
        reply: "test",
        rhizohDeliveryKind: "ok",
        replyFormatDriftScore: 0,
        rhizohCompressionLedger: { replyExtractPath: "json.reply" }
      },
      null,
      "cohort_canary"
    );
    assert.equal(out.replySchemaVersion, RHIZOH_REPLY_SCHEMA_V1);
    assert.equal(out.replySchemaNegotiation.status, "cohort_shadow");
    assert.equal(out.replyContractDriftClass, "informative");
  });

  it("map contains alpha beta canary", () => {
    assert.ok(COHORT_SCHEMA_MAP_V1.map.cohort_alpha);
    assert.ok(COHORT_SCHEMA_MAP_V1.map.cohort_beta);
    assert.ok(COHORT_SCHEMA_MAP_V1.map.cohort_canary);
  });
});
