import { describe, expect, it, beforeEach } from "vitest";
import {
  buildObservabilitySnapshotV0,
  recordContinuityObservabilitySampleV0,
  resetContinuityObservabilityForTestV0
} from "../rhizohContinuityObservabilityV0.js";
import { sampleContinuityIntegrityScoreV0 } from "../rhizohContinuityIntegrityScoreV0.js";
import {
  getFirst3sCoherenceStabilityIndexV0,
  recordFirst3sCoherenceSampleV0,
  resetFirst3sCoherenceStabilityForTestV0
} from "../rhizohFirst3sCoherenceStabilityV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { bootstrapRhizohContinuityFirstPaintV0 } from "../rhizohT0FirstFrameBootstrapV0.js";

describe("rhizohContinuityObservabilityV0", () => {
  beforeEach(async () => {
    resetContinuityObservabilityForTestV0();
    resetFirst3sCoherenceStabilityForTestV0();
    resetFelFailureExpressionForTestV0();
    if (typeof window !== "undefined") window.__rhizoh = {};
    await resetContinuityObservabilityForTestV0();
  });

  it("CSSI stabilizes over first 3s samples", () => {
    const origin = 1000;
    recordFirst3sCoherenceSampleV0({
      cis01: 0.7,
      phase_coherence_ok: true,
      drift_magnitude01: 0.05,
      narrative_velocity: 0.4,
      nowMs: origin + 500
    });
    recordFirst3sCoherenceSampleV0({
      cis01: 0.72,
      phase_coherence_ok: true,
      drift_magnitude01: 0.04,
      narrative_velocity: 0.42,
      nowMs: origin + 1500
    });
    const cssi = getFirst3sCoherenceStabilityIndexV0(origin + 2500);
    expect(cssi.sample_count).toBeGreaterThanOrEqual(2);
    expect(cssi.cssi01).toBeGreaterThan(0.45);
  });

  it("observability is non-invasive with user felt presence proxy", async () => {
    await bootstrapRhizohContinuityFirstPaintV0({ returningUser: true, hasAnchor: true, nowMs: 0 });
    const p = deriveRhizohPresenceStateV0({ shellMounted: true, nowMs: 500, lastUserActivityMs: 490 });
    const cis = sampleContinuityIntegrityScoreV0({
      fieldState: "IDLE",
      voiceReady: false,
      firstPaintOk: true
    });
    window.__rhizoh.presenceState = p;
    const snap = buildObservabilitySnapshotV0(cis, { nowMs: 500 });
    expect(snap.non_invasive).toBe(true);
    expect(snap.observe_only).toBe(true);
    expect(snap.user_felt_presence_score01).toBeGreaterThan(0.35);
    expect(snap.continuity_integrity_drift_heatmap).toBeTruthy();
  });

  it("recordContinuityObservabilitySample publishes ring", async () => {
    await bootstrapRhizohContinuityFirstPaintV0({ nowMs: 0 });
    recordContinuityObservabilitySampleV0({ fieldState: "IDLE", voiceReady: true, firstPaintOk: true });
    expect(window.__rhizoh.continuityObservability).toBeTruthy();
    expect(Array.isArray(window.__rhizoh.continuityObservabilityRing)).toBe(true);
  });
});
