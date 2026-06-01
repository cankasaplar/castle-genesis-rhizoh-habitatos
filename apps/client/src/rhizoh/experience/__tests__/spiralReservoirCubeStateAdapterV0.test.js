import { describe, it, expect } from "vitest";
import {
  ingestSpiralReservoirV0,
  normalizeReservoirSignalsV0,
  applyCubeStateDeltaV0,
  assertSpiralReservoirAdapterInvariantV0,
  SPIRAL_RESERVOIR_SIGNAL_SCHEMA_V0
} from "../spiralReservoirCubeStateAdapterV0.js";
import { projectCubeFieldV0 } from "../cubeFieldSpiralMathV0.js";

const validEnvelope = (signals, extra = {}) => ({
  schemaVersion: SPIRAL_RESERVOIR_SIGNAL_SCHEMA_V0,
  reservoirId: "res_test_001",
  correlationId: "corr_adapter",
  signals,
  ...extra
});

describe("spiralReservoirCubeStateAdapterV0 — projection gate", () => {
  it("maps geometry signals to CubeState slots without semantic inference", () => {
    const result = ingestSpiralReservoirV0(
      validEnvelope({
        armExtent0: 0.8,
        armExtent1: 0.5,
        spiralPhaseRad: 1.2,
        rotationRate01: 0.6,
        confidence01: 0.7
      }),
      { denoise: false }
    );
    expect(result.ok).toBe(true);
    expect(result.cubeState.intentVector.observation).toBe(0.8);
    expect(result.cubeState.intentVector.reasoning).toBe(0.5);
    expect(result.cubeState.spiralPhaseRad).toBeCloseTo(1.2, 5);
    expect(result.cubeState.cognitiveLoad).toBe(0.6);
    expect(result.cubeState.confidence).toBe(0.7);
    expect(result.cubeState.sourceKind).toBe("spiral_reservoir_adapter");
    assertSpiralReservoirAdapterInvariantV0(result);
  });

  it("ignores unknown fields", () => {
    const norm = normalizeReservoirSignalsV0({
      armExtent0: 0.5,
      mysteryField: 0.9,
      extraNoise: 1
    });
    expect(norm.ignored).toContain("mysteryField");
    expect(norm.ignored).toContain("extraNoise");
    expect(norm.candidates["intentVector.observation"]).toBe(0.5);
  });

  it("ignores narrative keys (no lore → intent mapping)", () => {
    const norm = normalizeReservoirSignalsV0({
      rumorRisk01: 0.99,
      questHeadline: "test",
      armExtent2: 0.4
    });
    expect(norm.ignored).toContain("rumorRisk01");
    expect(norm.ignored).toContain("questHeadline");
    expect(norm.candidates["intentVector.memory"]).toBe(0.4);
  });

  it("quarantines forbidden authority fields", () => {
    const norm = normalizeReservoirSignalsV0({
      executionEligible: true,
      armExtent0: 0.3
    });
    expect(norm.quarantined).toContain("executionEligible");
    expect(norm.candidates["intentVector.observation"]).toBe(0.3);
  });

  it("quarantines ambiguous meshCoherence (no confidence inference)", () => {
    const norm = normalizeReservoirSignalsV0({ meshCoherence01: 0.95 });
    expect(norm.quarantined).toContain("meshCoherence01");
    expect(norm.candidates.confidence).toBeUndefined();
  });

  it("drops invalid numeric fields", () => {
    const norm = normalizeReservoirSignalsV0({
      armExtent0: "not-a-number",
      armExtent1: NaN
    });
    expect(norm.dropped).toContain("armExtent0");
    expect(norm.dropped).toContain("armExtent1");
  });

  it("quarantines batch on schema mismatch", () => {
    const result = ingestSpiralReservoirV0({
      schemaVersion: "wrong.schema.v9",
      reservoirId: "bad",
      signals: { armExtent0: 0.9 }
    });
    expect(result.ok).toBe(false);
    expect(result.batchQuarantined).toBe(true);
    expect(result.delta.fields).toHaveLength(0);
    assertSpiralReservoirAdapterInvariantV0(result);
  });

  it("emits delta only for updated signal fields", () => {
    const prev = {
      intentVector: { observation: 0.2, reasoning: 0.1, memory: 0, action: 0 },
      confidence: 0.5,
      uncertainty: 0.5
    };
    const { delta, cubeState } = applyCubeStateDeltaV0(prev, {
      "intentVector.observation": 0.9
    }, { denoise: false });
    expect(delta.fields).toEqual(["intentVector.observation"]);
    expect(cubeState.intentVector.observation).toBe(0.9);
    expect(cubeState.intentVector.reasoning).toBe(0.1);
  });

  it("adapter output feeds math layer without cross-layer bleed", () => {
    const ingested = ingestSpiralReservoirV0(
      validEnvelope({
        armExtent0: 0.6,
        armExtent3: 0.8,
        opacity01: 0.7,
        confidence01: 0.4
      }),
      { denoise: false }
    );
    const projected = projectCubeFieldV0(ingested.cubeState);
    expect(projected.axes[0].radialExtent01).toBeGreaterThan(0);
    expect(projected.visual.readOnly).toBe(true);
    expect(ingested.audit.semanticAuthority).toBe("rhizoh_cube_field_spec");
  });

  it("never claims execution authority", () => {
    const result = ingestSpiralReservoirV0(validEnvelope({ armExtent0: 0.1 }));
    expect(result.mayTriggerExecution).toBe(false);
    expect(result.readOnly).toBe(true);
  });
});
