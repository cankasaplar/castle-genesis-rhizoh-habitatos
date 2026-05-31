import { describe, expect, it } from "vitest";
import { getRhizohCohortIdForRequestV0 } from "../rhizohCohortPinClientV0.js";
import { publishRhizohSchemaRuntimeAuditV0 } from "../rhizohSchemaRuntimeAuditV0.js";

describe("rhizohCohortPinClientV0", () => {
  it("returns empty when no env cohort", () => {
    expect(getRhizohCohortIdForRequestV0()).toBe("");
  });
});

describe("rhizohSchemaRuntimeAuditV0", () => {
  it("publishes audit mirror in browser", () => {
    if (typeof window === "undefined") return;
    const row = publishRhizohSchemaRuntimeAuditV0({
      cohortId: "cohort_alpha",
      replySchemaVersion: "castle.rhizoh.reply_schema.v1",
      replyContractDriftClass: "ok"
    });
    expect(row.schema).toBe("castle.rhizoh.schema_runtime_audit.v0");
    expect(window.__CASTLE_SCHEMA_RUNTIME_AUDIT__?.cohortId).toBe("cohort_alpha");
  });
});
