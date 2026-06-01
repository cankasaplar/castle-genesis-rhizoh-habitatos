import { describe, it, expect } from "vitest";
import {
  normalizeCubeStateV0,
  transformCubeStateToSignalV0,
  projectCubeFieldV0,
  projectObservationAxisV0,
  projectReasoningAxisV0,
  projectMemoryAxisV0,
  projectActionAxisV0,
  projectGlobalDerivedV0,
  buildCubeFieldDriftObservationV0,
  assertDriftMeasurementOnlyV0,
  CUBE_FIELD_MEMORY_DECAY_FLOOR_V0,
  CUBE_FIELD_AXIS_MOTION_KIND_V0,
  CUBE_FIELD_VISUAL_BINDING_HASH_V0
} from "../cubeFieldSpiralMathV0.js";

const baseState = () => ({
  attention: 0.5,
  confidence: 0.5,
  uncertainty: 0.5,
  drift: 0.2,
  cognitiveLoad: 0.4,
  intentVector: {
    observation: 0.6,
    reasoning: 0.5,
    memory: 0.4,
    action: 0.3
  },
  spiralPhaseRad: 1.0,
  armPhaseOffsetRad: [0, 0.5, 1.0, 1.5],
  contradictionPressure: 0.2,
  sourceKind: "synthetic_fixture",
  sourceRef: "test_fixture",
  correlationId: "corr_test"
});

describe("cubeFieldSpiralMathV0 — meaning mapping stability", () => {
  it("normalizes confidence/uncertainty pair within tolerance", () => {
    const s = normalizeCubeStateV0({ confidence: 0.7, uncertainty: 0.9 });
    expect(s.confidence).toBe(0.7);
    expect(s.uncertainty).toBeCloseTo(0.3, 5);
    expect(s.readOnly).toBe(true);
  });

  it("global derived: expansion rises with uncertainty (monotonic global)", () => {
    const low = projectGlobalDerivedV0(
      normalizeCubeStateV0({ ...baseState(), confidence: 0.8, uncertainty: 0.2, attention: 0 })
    );
    const high = projectGlobalDerivedV0(
      normalizeCubeStateV0({ ...baseState(), confidence: 0.1, uncertainty: 0.9, attention: 0 })
    );
    expect(high.expansion01).toBeGreaterThan(low.expansion01);
  });

  it("observation axis is monotonic in observation intent", () => {
    const derived = projectGlobalDerivedV0(normalizeCubeStateV0(baseState()));
    const low = projectObservationAxisV0(
      normalizeCubeStateV0({
        ...baseState(),
        intentVector: { ...baseState().intentVector, observation: 0.2 }
      }),
      derived
    );
    const high = projectObservationAxisV0(
      normalizeCubeStateV0({
        ...baseState(),
        intentVector: { ...baseState().intentVector, observation: 0.9 }
      }),
      derived
    );
    expect(high.radialExtent01).toBeGreaterThan(low.radialExtent01);
    expect(low.motionKind).toBe(CUBE_FIELD_AXIS_MOTION_KIND_V0.observation);
  });

  it("memory axis respects decay floor", () => {
    const derived = projectGlobalDerivedV0(normalizeCubeStateV0(baseState()));
    const faded = projectMemoryAxisV0(
      normalizeCubeStateV0({
        ...baseState(),
        intentVector: { ...baseState().intentVector, memory: 0.01 }
      }),
      derived
    );
    expect(faded.radialExtent01).toBeGreaterThanOrEqual(
      CUBE_FIELD_MEMORY_DECAY_FLOOR_V0 * (1 - derived.contraction01 * 0.25) - 0.001
    );
    expect(faded.decayFloorApplied).toBe(true);
  });

  it("reasoning axis is oscillatory (same intent, different phase → different extent)", () => {
    const derived = projectGlobalDerivedV0(normalizeCubeStateV0(baseState()));
    const a = projectReasoningAxisV0(
      normalizeCubeStateV0({ ...baseState(), spiralPhaseRad: 0 }),
      derived
    );
    const b = projectReasoningAxisV0(
      normalizeCubeStateV0({ ...baseState(), spiralPhaseRad: Math.PI / 2 }),
      derived
    );
    expect(a.motionKind).toBe(CUBE_FIELD_AXIS_MOTION_KIND_V0.reasoning);
    expect(a.radialExtent01).not.toBe(b.radialExtent01);
  });

  it("action axis uses discrete threshold jumps only", () => {
    const derived = projectGlobalDerivedV0(normalizeCubeStateV0(baseState()));
    const samples = [0.1, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 1.0].map((action) =>
      projectActionAxisV0(
        normalizeCubeStateV0({
          ...baseState(),
          intentVector: { ...baseState().intentVector, action }
        }),
        derived
      )
    );
    const levels = samples.map((s) => s.discreteLevel);
    expect(levels).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(samples[2].radialExtent01).toBeGreaterThan(samples[1].radialExtent01);
  });

  it("forbids cross-axis bleed: reasoning change does not move observation arm", () => {
    const shared = baseState();
    const a = projectCubeFieldV0({
      ...shared,
      intentVector: { observation: 0.5, reasoning: 0.2, memory: 0.4, action: 0.3 }
    });
    const b = projectCubeFieldV0({
      ...shared,
      intentVector: { observation: 0.5, reasoning: 0.95, memory: 0.4, action: 0.3 }
    });
    expect(a.axes[0].radialExtent01).toBe(b.axes[0].radialExtent01);
    expect(a.axes[1].radialExtent01).not.toBe(b.axes[1].radialExtent01);
  });

  it("transformCubeStateToSignal is deterministic", () => {
    const input = baseState();
    const a = transformCubeStateToSignalV0(input);
    const b = transformCubeStateToSignalV0(input);
    expect(a.derived.expansion01).toBe(b.derived.expansion01);
    expect(a.visualBindingHash).toBe(CUBE_FIELD_VISUAL_BINDING_HASH_V0);
  });

  it("flags extent_confidence_mismatch when confidence rises but expansion rises", () => {
    const prev = { ...baseState(), confidence: 0.3, uncertainty: 0.7, attention: 0.2 };
    const next = { ...baseState(), confidence: 0.5, uncertainty: 0.5, attention: 0.95 };
    const signal = transformCubeStateToSignalV0(next, { prev });
    expect(signal.coherenceWarnings).toContain("extent_confidence_mismatch");
  });

  it("drift observation is measurement-only (§6.0 invariant)", () => {
    const obs = buildCubeFieldDriftObservationV0({
      cubeId: "cube_1",
      driftBefore: 0.2,
      driftAfter: 0.35,
      trigger: "tick",
      sourceKind: "synthetic_fixture",
      sourceRef: "ref_1"
    });
    expect(obs.measurementOnly).toBe(true);
    expect(obs.mayTriggerExecution).toBe(false);
    expect(assertDriftMeasurementOnlyV0(obs)).toBe(true);
  });

  it("visual coefficients bind global channels to state scalars", () => {
    const highConf = projectCubeFieldV0({ ...baseState(), confidence: 0.95, uncertainty: 0.05 });
    const lowConf = projectCubeFieldV0({ ...baseState(), confidence: 0.1, uncertainty: 0.9 });
    expect(highConf.visual.cube.emissive01).toBeGreaterThan(lowConf.visual.cube.emissive01);
    expect(highConf.visual.cube.opacity01).toBeGreaterThan(lowConf.visual.cube.opacity01);
  });
});
