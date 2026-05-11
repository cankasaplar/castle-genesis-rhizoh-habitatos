import { describe, expect, it } from "vitest";
import {
  quantizeRollupSliceForTruthAnchor,
  truthAnchorDrift01,
  validateRhizohLearnedMergeCounterfactual
} from "../rhizohProductProductionTruthV1.js";

describe("rhizohProductProductionTruthV1", () => {
  it("quantizes rollup slice deterministically", () => {
    const slice = {
      turnDepthCount: 10,
      closureDismiss: { timeout: 2, replaced_or_unmount: 1 },
      closureVisibleMsSum: 5000,
      closureVisibleMsCount: 2,
      phaseEnterCount: { TRUST_BUILD: 1, NORMAL_CHAT: 0 }
    };
    const q = quantizeRollupSliceForTruthAnchor(slice);
    expect(q.turnDepthCountQ).toBe(10);
    expect(q.dismissSumQ).toBe(3);
    expect(q.phaseTrustEnterQ).toBe(1);
    expect(q.closureVisibleAvgBucketQ).toBe(2500);
  });

  it("truthAnchorDrift01 is zero for identical quantizations", () => {
    const q = { a: 1, b: 2 };
    expect(truthAnchorDrift01(q, { ...q })).toBe(0);
  });

  it("validateRhizohLearnedMergeCounterfactual passes identical overlays", () => {
    const o = {
      ux: { closureBannerMs: 12000 },
      phaseTuning: { trustBondForNormal: 0.34, trustTurnsForNormal: 12 },
      capabilityGates: { suppressGovernanceOpsBadgeUnlessBond01: null }
    };
    const v = validateRhizohLearnedMergeCounterfactual(o, {
      ...o,
      ux: { ...o.ux },
      phaseTuning: { ...o.phaseTuning },
      capabilityGates: { ...o.capabilityGates }
    });
    expect(v.passes).toBe(true);
    expect(v.confidence01).toBe(1);
  });

  it("flags large closure delta", () => {
    const r = { ux: { closureBannerMs: 12000 }, phaseTuning: {}, capabilityGates: {} };
    const m = { ux: { closureBannerMs: 22_000 }, phaseTuning: {}, capabilityGates: {} };
    const v = validateRhizohLearnedMergeCounterfactual(r, m);
    expect(v.passes).toBe(false);
    expect(v.violations).toContain("closure_banner_delta_exceeds_band");
  });
});
