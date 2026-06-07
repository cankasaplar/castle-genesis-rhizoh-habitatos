import { describe, expect, it, beforeEach } from "vitest";
import {
  sanitizeTurnSovereigntyInputV0,
  assertObservationDoesNotInfluenceAuthorityV0,
  SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0
} from "../turnSovereigntyObservationExecutionInvariantV0.js";
import {
  buildTurnBehavioralDriftReportV0,
  TURN_BEHAVIORAL_DRIFT_ENGINE_SCHEMA_V0
} from "../turnBehavioralDriftEngineV0.js";
import { lockTurnSovereigntyV0 } from "../behavioralTurnSovereigntyV0.js";

describe("turnSovereigntyObservationExecutionInvariantV0", () => {
  it("strips observation fields before authority resolution", () => {
    const raw = {
      turnId: "t1",
      consistencyField: { rates: { silentObserve: 0.9 } },
      driftSignals: [{ code: "elevated_silent_observe" }],
      candidates: { driftEngine: { foo: 1 }, router: { intent: "presence" } }
    };
    const { input, stripped } = sanitizeTurnSovereigntyInputV0(raw);
    expect(stripped).toContain("consistencyField");
    expect(stripped).toContain("driftSignals");
    expect(stripped).toContain("candidates.driftEngine");
    expect(input.candidates.router).toBeDefined();
    expect(input.consistencyField).toBeUndefined();
  });

  it("policy locks observation weight to zero", () => {
    expect(SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0.observationInfluencesAuthority).toBe(false);
    expect(SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0.observationFieldWeight).toBe(0);
    expect(SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0.executionFieldWeight).toBe(1);
  });

  it("assertObservationDoesNotInfluenceAuthorityV0 returns sanitized input", () => {
    const out = assertObservationDoesNotInfluenceAuthorityV0({
      influenceFeedback: { layerWeights: { fox: 0.9 } },
      input: { text: "merhaba" }
    });
    expect(out.influenceFeedback).toBeUndefined();
    expect(out.input.text).toBe("merhaba");
  });
});

describe("turnBehavioralDriftEngineV0", () => {
  beforeEach(() => {
    for (let i = 0; i < 6; i++) {
      lockTurnSovereigntyV0({
        turnId: `drift_${i}`,
        input: { text: i % 2 === 0 ? "beni duyuyor musun" : "nasılsın", modality: "voice" },
        router: { intent: i % 2 === 0 ? "presence" : "conversation" },
        runtime: { voiceGateOpen: true }
      });
    }
  });

  it("builds drift report with non-authoritative metrics", () => {
    const report = buildTurnBehavioralDriftReportV0();
    expect(report.schema).toBe(TURN_BEHAVIORAL_DRIFT_ENGINE_SCHEMA_V0);
    expect(report.influencesAuthority).toBe(false);
    expect(report.metrics.presenceStabilityIndex).toBeGreaterThanOrEqual(0);
    expect(report.metrics.authorityVolatilityScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.identityCoherenceMetric).toBeGreaterThanOrEqual(0);
    expect(report.selfExplanation).toContain("Observation layer does not influence");
  });
});
