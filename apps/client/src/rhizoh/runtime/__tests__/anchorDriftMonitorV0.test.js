import { describe, it, expect, beforeEach } from "vitest";
import {
  computeAnchorBalanceFieldV0,
  getAnchorDriftWarningsV0,
  recordAnchorBalanceSampleV0,
  resetAnchorDriftMonitorV0
} from "../anchorDriftMonitorV0.js";

describe("anchorDriftMonitorV0", () => {
  beforeEach(() => {
    resetAnchorDriftMonitorV0();
  });

  it("computes balance ratios from samples", () => {
    for (let i = 0; i < 8; i += 1) recordAnchorBalanceSampleV0("user");
    for (let i = 0; i < 2; i += 1) recordAnchorBalanceSampleV0("seed");
    const field = computeAnchorBalanceFieldV0();
    expect(field.sampleCount).toBe(10);
    expect(field.user).toBeCloseTo(0.8, 2);
    expect(field.seed).toBeCloseTo(0.2, 2);
  });

  it("warns on seed dominance", () => {
    for (let i = 0; i < 10; i += 1) recordAnchorBalanceSampleV0("seed");
    const warnings = getAnchorDriftWarningsV0({ hasUserAnchor: false });
    expect(warnings).toContain("seed_dominance");
  });

  it("warns when user anchor exists but display collapses to seed", () => {
    for (let i = 0; i < 9; i += 1) recordAnchorBalanceSampleV0("seed");
    recordAnchorBalanceSampleV0("user");
    const warnings = getAnchorDriftWarningsV0({ hasUserAnchor: true });
    expect(warnings).toContain("user_anchor_collapse_to_seed");
  });
});
