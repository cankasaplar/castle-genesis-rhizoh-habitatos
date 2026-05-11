import { describe, expect, it } from "vitest";
import {
  normalizeExternalGroundTruthBundle,
  externalTruthBlocksPromotion,
  externalTruthBlocksLearningMerge
} from "../rhizohExternalGroundTruthV1.js";

describe("rhizohExternalGroundTruthV1", () => {
  it("normalizes gateway-shaped bundles", () => {
    const b = normalizeExternalGroundTruthBundle({
      schemaVersion: "1.0.0",
      issuedAtMs: Date.now(),
      ttlMs: 120_000,
      populationCohort: "SERVER_TREATMENT",
      promotionEligible: true,
      learningMergeEligible: true
    });
    expect(b?.populationCohort).toBe("SERVER_TREATMENT");
    expect(b?.promotionEligible).toBe(true);
  });

  it("does not block promotion when snapshot absent", () => {
    const r = externalTruthBlocksPromotion({ status: "absent", bundle: null });
    expect(r.blocked).toBe(false);
  });

  it("blocks promotion when fresh bundle says holdout", () => {
    const bundle = normalizeExternalGroundTruthBundle({
      schemaVersion: "1.0.0",
      issuedAtMs: Date.now(),
      ttlMs: 120_000,
      populationCohort: "SERVER_HOLDOUT",
      promotionEligible: false,
      learningMergeEligible: false
    });
    const r = externalTruthBlocksPromotion({ status: "fresh", bundle });
    expect(r.blocked).toBe(true);
    expect(r.reason).toBe("external_truth_holdout");
  });

  it("blocks merge when learningMergeEligible false", () => {
    const bundle = normalizeExternalGroundTruthBundle({
      schemaVersion: "1.0.0",
      issuedAtMs: Date.now(),
      ttlMs: 120_000,
      populationCohort: "SERVER_HOLDOUT",
      promotionEligible: false,
      learningMergeEligible: false
    });
    const r = externalTruthBlocksLearningMerge({ status: "fresh", bundle });
    expect(r.blocked).toBe(true);
    expect(r.reason).toBe("external_truth_merge_blocked");
  });
});
