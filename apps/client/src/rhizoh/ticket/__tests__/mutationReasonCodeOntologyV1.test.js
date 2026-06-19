import { describe, expect, it } from "vitest";
import {
  MUTATION_REASON_CODE_V1,
  buildMutationReasonV1,
  inferStatusFromReasonV1,
  mapLegacyRejectReasonV1,
  pickPrimaryReasonV1
} from "../mutationReasonCodeOntologyV1.js";

describe("mutationReasonCodeOntologyV1", () => {
  it("maps legacy slug to structured reason", () => {
    const reason = mapLegacyRejectReasonV1("ticket_packet_direct_execution");
    expect(reason.primary).toBe(MUTATION_REASON_CODE_V1.SC_03_TICKET_EXECUTION_DIRECT);
    expect(reason.category).toBe("SC");
    expect(reason.code).toBe("SC_03");
  });

  it("distinguishes rejected vs quota_denied vs expired", () => {
    expect(inferStatusFromReasonV1(MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE)).toBe("rejected");
    expect(inferStatusFromReasonV1(MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED)).toBe("quota_denied");
    expect(inferStatusFromReasonV1(MUTATION_REASON_CODE_V1.REC_TICKET_EXPIRED)).toBe("expired");
  });

  it("pickPrimaryReasonV1 returns first mapped reason", () => {
    const primary = pickPrimaryReasonV1(["orphan_edge", "unsigned_mutate"], "rejected");
    expect(primary?.primary).toBe(MUTATION_REASON_CODE_V1.REC_CONTINUITY_BREAK);
  });

  it("buildMutationReasonV1 allows custom message", () => {
    const r = buildMutationReasonV1(
      MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE,
      "System reconcile attempted direct CubeState mutation"
    );
    expect(r.message).toContain("CubeState");
  });
});
