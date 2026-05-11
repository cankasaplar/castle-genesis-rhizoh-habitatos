import { describe, expect, it } from "vitest";
import {
  composePerceptualCivilizationFrame,
  createSharedWakeEconomyPool,
  ghostNegotiationRound
} from "./distributedPerceptualCivilizationV552.js";

const snap = (over = {}) => ({
  focusedDistrictId: "besiktas",
  interactionEnergy01: 0.3,
  wakeAffinity01: 0.25,
  presenceWeight01: 0.85,
  oracleNudgeConsumed: false,
  ...over
});

describe("vNext-552 perceptual civilization layer", () => {
  it("shared wake pool blocks after budget exhausted", () => {
    const pool = createSharedWakeEconomyPool({ creditsPerMinute: 3, majorWakeCost: 2 });
    const t = 500_000;
    expect(pool.tryCommitMajorWake(t, "u1").ok).toBe(true);
    expect(pool.tryCommitMajorWake(t + 100, "u2").ok).toBe(false);
  });

  it("ghostNegotiationRound yields accede under crowd-dominant tension", () => {
    const out = ghostNegotiationRound({
      ghostResistance01: 0.35,
      verdict: {
        dominantLane: "crowd",
        crowdPressure01: 0.75,
        ghostPushback01: 0.4,
        conflictEntropy01: 0.3,
        tension01: 0.35
      }
    });
    expect(out.negotiationPhase).toBe("accede");
    expect(out.ghostYield01).toBeGreaterThan(0.1);
  });

  it("composePerceptualCivilizationFrame merges arbitration and negotiation", () => {
    const frame = composePerceptualCivilizationFrame({
      nowMs: 600_000,
      ghostResistance01: 0.5,
      arbitrationInput: {
        ghostResistance01: 0.5,
        ghostStage: "Keeper",
        fieldPreferredDistrictId: null,
        participants: [{ id: "a", snapshot: snap() }]
      }
    });
    expect(frame.mergedPresence).not.toBeNull();
    expect(frame.negotiation.presenceScaleMul).toBeGreaterThan(0.7);
    expect(frame.arbitration.verdict).toBeDefined();
    expect(frame.majorWakeReservation.ok).toBe(true);
  });

  it("compose raises wakeThresholdDelta when pool cannot afford major wake", () => {
    const pool = createSharedWakeEconomyPool({ creditsPerMinute: 2, majorWakeCost: 2 });
    const t = 700_000;
    pool.tryCommitMajorWake(t, "u1");
    const frame = composePerceptualCivilizationFrame({
      nowMs: t + 50,
      ghostResistance01: 0.4,
      sharedWakePool: pool,
      attemptMajorWakeReservation: true,
      reservationUserId: "u2",
      arbitrationInput: {
        ghostResistance01: 0.4,
        participants: [{ snapshot: snap() }]
      }
    });
    expect(frame.majorWakeReservation.ok).toBe(false);
    expect(frame.wakeThresholdDelta).toBeGreaterThan(frame.arbitration.wakeEconomy.wakeThresholdDelta);
  });
});
