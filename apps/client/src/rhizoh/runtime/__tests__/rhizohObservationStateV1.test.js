import { beforeEach, describe, expect, it } from "vitest";
import {
  buildRhizohObservationStateV1,
  recordBroadcastVisibilityV1,
  resetBroadcastVisibilityForTestV1,
  resetRhizohObservationStateConsoleForTestV1,
  RHIZOH_OBSERVATION_STATE_SCHEMA_V1
} from "../rhizohObservationStateV1.js";

describe("rhizohObservationStateV1", () => {
  beforeEach(() => {
    resetBroadcastVisibilityForTestV1();
    resetRhizohObservationStateConsoleForTestV1();
  });

  it("builds observation state contract shape", () => {
    const state = buildRhizohObservationStateV1({ proofMode: true });
    expect(state.schema).toBe(RHIZOH_OBSERVATION_STATE_SCHEMA_V1);
    expect(state.truth).toHaveProperty("commitSeq");
    expect(state.truth).toHaveProperty("eventSeq");
    expect(state.truth).toHaveProperty("projectionVersion");
    expect(state.broadcast).toHaveProperty("ackRate");
    expect(state.reality.instrumentationTier).toBe("truth_only");
    expect(state.narrative.mode).toBe("proof");
    expect(state.interpretationOnly).toBe(true);
  });

  it("projectionConsistency false when no fen committed", () => {
    const state = buildRhizohObservationStateV1();
    expect(state.sync.projectionConsistency).toBe(false);
  });

  it("upgrades instrumentation tier when broadcast visibility recorded", () => {
    recordBroadcastVisibilityV1({
      presence: { count: 2 },
      commitSeq: 3,
      delivered: 2,
      localAck: true
    });
    recordBroadcastVisibilityV1({ localAck: true });
    const state = buildRhizohObservationStateV1();
    expect(state.broadcast.recipientCount).toBe(2);
    expect(state.broadcast.delivered).toBe(2);
    expect(state.truth.commitSeq).toBe(3);
    expect(state.reality.instrumentationTier).toBe("broadcast_full");
  });

  it("projectionConsistency false when gateway seq ahead of local commit", () => {
    recordBroadcastVisibilityV1({
      gatewayServerSeq: 2,
      gatewayFen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
    });
    const state = buildRhizohObservationStateV1();
    expect(state.sync.projectionConsistency).toBe(false);
  });
});
