import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveFoxBehaviorOutcomeV1,
  applyFoxBehaviorGateV1,
  appendFoxObservationV1,
  enqueueFoxInitiativeV1,
  getFoxObservationLedgerV1,
  getFoxInitiativeQueueV1,
  peekTopFoxInitiativeV1,
  FOX_BEHAVIOR_OUTCOME_V1,
  FOX_OBSERVATION_TYPE_V1,
  dominantAwarenessSourceV1,
  __resetFoxBehaviorGateForTestV1
} from "../foxBehaviorGateV1.js";
import {
  FOX_BEHAVIOR_POSTURE_V1,
  evaluateFoxBehaviorPostureV1
} from "../foxSignificanceEngineV1.js";

function makeBundle(posture, overrides = {}) {
  return Object.freeze({
    foxBehaviorPosture: posture,
    foxSignificanceField: { score: 0.3, dominantImpact: "relationshipImpact" },
    foxAttentionField: { score: 0.4, worldSignal: 0.5 },
    castleAwarenessField: {
      weatherAwareness: 0.2,
      trafficAwareness: 0.65,
      sportsAwareness: 0.1,
      newsAwareness: 0.3,
      socialAwareness: 0,
      narrativeAwareness: 0
    },
    ...overrides
  });
}

describe("foxBehaviorGateV1", () => {
  beforeEach(() => {
    __resetFoxBehaviorGateForTestV1();
  });

  it("D.1 silence gate returns SILENT_OBSERVATION for observe posture", () => {
    const posture = evaluateFoxBehaviorPostureV1({
      attentionField: { score: 0.4, worldSignal: 0.5 },
      significanceField: { score: 0.2 },
      userInitiated: false,
      message: ""
    });
    const outcome = resolveFoxBehaviorOutcomeV1(posture);
    expect(outcome.outcome).toBe(FOX_BEHAVIOR_OUTCOME_V1.SILENT_OBSERVATION);
    expect(outcome.mayProceedToLlm).toBe(false);
    expect(outcome.maySpeak).toBe(false);
  });

  it("D.1 react posture allows LLM path", () => {
    const posture = evaluateFoxBehaviorPostureV1({
      attentionField: { score: 0.5 },
      significanceField: { score: 0.4 },
      userInitiated: true,
      message: "merhaba"
    });
    const outcome = resolveFoxBehaviorOutcomeV1(posture);
    expect(outcome.outcome).toBe(FOX_BEHAVIOR_OUTCOME_V1.REACT_RESPONSE);
    expect(outcome.mayProceedToLlm).toBe(true);
    expect(outcome.maySpeak).toBe(true);
  });

  it("D.2 observation ledger records silent observation without speaking", () => {
    const posture = Object.freeze({
      posture: FOX_BEHAVIOR_POSTURE_V1.OBSERVE,
      reason: "noticed_low_significance_world_event",
      maySpeak: false,
      mayInitiate: false
    });
    const gate = applyFoxBehaviorGateV1(makeBundle(posture), {
      traceId: "test_obs",
      forceRecord: true
    });
    expect(gate.outcome.outcome).toBe(FOX_BEHAVIOR_OUTCOME_V1.SILENT_OBSERVATION);
    expect(gate.ledgerEntry).toBeTruthy();
    expect(gate.ledgerEntry.source).toBe("traffic");
    expect(gate.ledgerEntry.observationType).toBe(FOX_OBSERVATION_TYPE_V1.LOW_SIGNIFICANCE_NOTICE);
    const ledger = getFoxObservationLedgerV1();
    expect(ledger.length).toBe(1);
  });

  it("D.3 initiative queue records candidate without speaking", () => {
    const posture = Object.freeze({
      posture: FOX_BEHAVIOR_POSTURE_V1.INITIATE_CANDIDATE,
      reason: "high_significance_and_world_salience",
      maySpeak: false,
      mayInitiate: true
    });
    const gate = applyFoxBehaviorGateV1(
      makeBundle(posture, {
        foxSignificanceField: { score: 0.82, dominantImpact: "longTermContinuityImpact" }
      }),
      { traceId: "test_init" }
    );
    expect(gate.outcome.outcome).toBe(FOX_BEHAVIOR_OUTCOME_V1.INITIATE_QUEUED);
    expect(gate.outcome.mayProceedToLlm).toBe(false);
    expect(gate.queueEntry).toBeTruthy();
    expect(gate.queueEntry.status).toBe("queued");
    expect(getFoxInitiativeQueueV1().length).toBe(1);
  });

  it("dominantAwarenessSourceV1 picks highest slice", () => {
    const d = dominantAwarenessSourceV1({
      weatherAwareness: 0.2,
      trafficAwareness: 0.68,
      sportsAwareness: 0.1,
      newsAwareness: 0.3
    });
    expect(d.source).toBe("traffic");
    expect(d.salience).toBe(0.68);
  });

  it("ledger and queue respect capacity limits", () => {
    for (let i = 0; i < 105; i++) {
      appendFoxObservationV1({ source: "traffic", significance: 0.2 });
    }
    expect(getFoxObservationLedgerV1().length).toBe(100);

    for (let i = 0; i < 25; i++) {
      enqueueFoxInitiativeV1({ significance: 0.8, reason: "test" });
    }
    expect(getFoxInitiativeQueueV1().length).toBe(20);
  });

  it("peekTopFoxInitiativeV1 returns highest significance queued item", () => {
    enqueueFoxInitiativeV1({ significance: 0.74, source: "weather" });
    enqueueFoxInitiativeV1({ significance: 0.88, source: "news" });
    const top = peekTopFoxInitiativeV1(0.72);
    expect(top?.source).toBe("news");
    expect(top?.significance).toBe(0.88);
  });
});
