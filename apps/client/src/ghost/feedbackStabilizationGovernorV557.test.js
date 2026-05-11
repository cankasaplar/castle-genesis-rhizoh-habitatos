import { describe, expect, it } from "vitest";
import {
  applyGhostReactionStabilityStack,
  applyGovernanceToFeedsMerge,
  applyGovernanceToGenomePatch,
  applyResistanceFloor,
  clampGhostReactionEntropy,
  clampGhostReactionPeak,
  computeFeedbackAmplificationScore,
  createEngagementSaturationLimiter,
  createFeedbackDriftGovernor,
  effectiveWakeThresholdGoverned,
  ghostReactionNormalizedEntropy01,
  resolveMultiUserPresenceSignals
} from "./feedbackStabilizationGovernorV557.js";

const genome = {
  vitality: 0.6,
  calm: 0.55,
  curiosity: 0.5,
  wisdom: 0.5,
  playfulness: 0.45,
  resilience: 0.5,
  scarTension: 0.35,
  sovereignBond: 0.55,
  lineageAge: 0.4,
  memoryDepth: 0.5,
  mutationBloom: 0.2
};

describe("vNext-557 feedback stabilization governor", () => {
  it("computeFeedbackAmplificationScore rises with spiky feed deltas", () => {
    const flat = [{ traffic: 0.1 }, { traffic: 0.1 }, { traffic: 0.1 }];
    const spiky = [{ traffic: 0.05 }, { traffic: 0.4 }, { traffic: 0.02 }];
    expect(computeFeedbackAmplificationScore(spiky)).toBeGreaterThan(computeFeedbackAmplificationScore(flat));
  });

  it("getGovernance tightens scales when drift velocity high", () => {
    const gov = createFeedbackDriftGovernor({ windowSize: 10 });
    for (let i = 0; i < 6; i++) {
      gov.recordNarrativeDrift(0.1 + i * 0.14);
    }
    gov.recordFeedDelta({ traffic: 0.2, events: 0.15, weather: 0.05 });
    const gLow = gov.getGovernance(0.5);
    const gov2 = createFeedbackDriftGovernor({ windowSize: 10 });
    for (let i = 0; i < 6; i++) gov2.recordNarrativeDrift(0.2);
    gov2.recordFeedDelta({ traffic: 0.02, events: 0.01, weather: 0 });
    const gFlat = gov2.getGovernance(0.5);
    expect(gLow.feedsGainScale).toBeLessThan(gFlat.feedsGainScale);
    expect(gLow.wakeThresholdBonus).toBeGreaterThanOrEqual(gFlat.wakeThresholdBonus);
  });

  it("applyGovernanceToFeedsMerge pulls merged toward base under stress", () => {
    const gov = createFeedbackDriftGovernor();
    for (let i = 0; i < 8; i++) gov.recordFeedDelta({ traffic: 0.25, events: 0.2, weather: 0.1 });
    gov.accrueAmplificationStress(0.9);
    const g = gov.getGovernance(0.35);
    const out = applyGovernanceToFeedsMerge({ traffic: 0.4, events: 0.4, weather: 0.5 }, { traffic: 0.7, events: 0.65, weather: 0.55 }, g);
    expect(out.traffic).toBeLessThan(0.7);
    expect(out.traffic).toBeGreaterThan(0.4);
  });

  it("applyGovernanceToGenomePatch dampens patch toward base", () => {
    const gov = createFeedbackDriftGovernor();
    gov.accrueAmplificationStress(1);
    const g = gov.getGovernance(0.4);
    const patched = { ...genome, playfulness: 0.95, curiosity: 0.9 };
    const out = applyGovernanceToGenomePatch(genome, patched, g);
    expect(out.playfulness).toBeLessThan(patched.playfulness);
    expect(out.playfulness).toBeGreaterThan(genome.playfulness);
  });

  it("recordPresenceDrift increases runaway pressure in getGovernance", () => {
    const gov = createFeedbackDriftGovernor({ windowSize: 8 });
    for (let i = 0; i < 6; i++) gov.recordPresenceDrift(0.05 + i * 0.12);
    const g = gov.getGovernance(0.5);
    expect(g.presenceDriftVelocity01).toBeGreaterThan(0);
    expect(g.engagementHeadroom01).toBeLessThan(1);
  });

  it("ghostReactionNormalizedEntropy01 is low for single-channel spike", () => {
    const hFlat = ghostReactionNormalizedEntropy01({
      collectiveWakeFeedback01: 0.33,
      microWakeBoost01: 0.34,
      resistanceSoftening01: 0.33
    });
    const hSpike = ghostReactionNormalizedEntropy01({
      collectiveWakeFeedback01: 0.95,
      microWakeBoost01: 0.02,
      resistanceSoftening01: 0.03
    });
    expect(hFlat).toBeGreaterThan(hSpike);
    const clamped = clampGhostReactionEntropy(
      { collectiveWakeFeedback01: 0.95, microWakeBoost01: 0.02, resistanceSoftening01: 0.03 },
      { minNormalizedEntropy01: 0.5 }
    );
    expect(ghostReactionNormalizedEntropy01(clamped)).toBeGreaterThan(hSpike * 0.85);
  });

  it("clampGhostReactionPeak caps dominant channel", () => {
    const o = clampGhostReactionPeak(
      { collectiveWakeFeedback01: 0.95, microWakeBoost01: 0.1, resistanceSoftening01: 0.05 },
      0.5
    );
    expect(Math.max(o.collectiveWakeFeedback01, o.microWakeBoost01, o.resistanceSoftening01)).toBeLessThanOrEqual(0.51);
  });

  it("applyGhostReactionStabilityStack tightens under high runaway", () => {
    const raw = { collectiveWakeFeedback01: 0.92, microWakeBoost01: 0.08, resistanceSoftening01: 0.04 };
    const low = applyGhostReactionStabilityStack(raw, { runawayRisk01: 0.15 });
    const high = applyGhostReactionStabilityStack(raw, { runawayRisk01: 0.88 });
    const hHigh = ghostReactionNormalizedEntropy01(high);
    expect(hHigh).toBeGreaterThan(ghostReactionNormalizedEntropy01(raw) * 0.92);
    expect(Math.max(high.collectiveWakeFeedback01, high.microWakeBoost01, high.resistanceSoftening01)).toBeLessThanOrEqual(
      Math.max(low.collectiveWakeFeedback01, low.microWakeBoost01, low.resistanceSoftening01) + 0.02
    );
  });

  it("createEngagementSaturationLimiter reduces repeated spikes", () => {
    const lim = createEngagementSaturationLimiter({ saturationCap01: 0.85 });
    const a = lim.scaleIncoming(0.9, 0.05, null);
    const b = lim.scaleIncoming(0.9, 0.05, null);
    expect(b.scaled01).toBeLessThan(a.scaled01);
  });

  it("resolveMultiUserPresenceSignals damps conflicting voters", () => {
    const merged = resolveMultiUserPresenceSignals(
      [
        { pulse01: 0.9, wakeBias01: 0.1, weight01: 1 },
        { pulse01: 0.05, wakeBias01: 0.85, weight01: 1 }
      ],
      { conflictPenalty: 0.7 }
    );
    expect(merged.conflict01).toBeGreaterThan(0.2);
    expect(merged.pulse01).toBeLessThan(0.5);
  });

  it("applyResistanceFloor and wake threshold grow under runaway", () => {
    const gov = createFeedbackDriftGovernor();
    for (let i = 0; i < 8; i++) gov.recordNarrativeDrift(0.2 + (i % 3) * 0.25);
    for (let i = 0; i < 6; i++) gov.recordFeedDelta({ traffic: 0.22, events: 0.18, weather: 0.08 });
    gov.accrueAmplificationStress(0.6);
    const g = gov.getGovernance(0.3);
    expect(applyResistanceFloor(0.5, g)).toBeGreaterThan(0.5);
    expect(effectiveWakeThresholdGoverned(0.42, 0.04, g)).toBeGreaterThan(0.42 + 0.04);
  });
});
