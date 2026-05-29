import { describe, it, expect } from "vitest";
import { buildObservationEnvelopeV0, OBSERVATION_SNAPSHOT_SCHEMA_VERSION_V0 } from "../observationEnvelopeV0.js";

describe("observationEnvelopeV0", () => {
  it("builds frozen envelope with canonical fields", () => {
    const e = buildObservationEnvelopeV0({
      lane: "owner",
      runtimeFrameId: "rf_test",
      executionMode: "PASSIVE",
      payload: { state: { a: 1 }, hints: { fogDensity: 0.2 }, temporal: { x: 1 } }
    });
    expect(Object.isFrozen(e)).toBe(true);
    expect(e.snapshotSchemaVersion).toBe(OBSERVATION_SNAPSHOT_SCHEMA_VERSION_V0);
    expect(e.lane).toBe("owner");
    expect(e.runtimeFrameId).toBe("rf_test");
    expect(e.provenance.source).toBe("observer_runtime");
    expect(e.provenance.executionMode).toBe("PASSIVE");
    expect(e.payload.hints).toEqual({ fogDensity: 0.2 });
  });

  it("coerces invalid lane to owner", () => {
    const e = buildObservationEnvelopeV0({
      lane: /** @type {any} */ ("not-a-lane"),
      runtimeFrameId: "x",
      executionMode: "ACTIVE",
      payload: { state: null, hints: null, temporal: null }
    });
    expect(e.lane).toBe("owner");
  });

  it("includes replaySeed when provided", () => {
    const e = buildObservationEnvelopeV0({
      lane: "replay",
      runtimeFrameId: "rf_r",
      replaySeed: "seed-7",
      executionMode: "PASSIVE",
      payload: { state: null, hints: null, temporal: null }
    });
    expect(e.replaySeed).toBe("seed-7");
  });
});
