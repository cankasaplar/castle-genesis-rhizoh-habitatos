import { describe, it, expect } from "vitest";
import {
  assertHardwareEffectKindAllowedV0,
  HARDWARE_EFFECT_KIND_V0,
  FORBIDDEN_HARDWARE_EFFECT_KINDS_V0
} from "../spatialHardwareEffectContractV0.js";
import { createSpatialProjectionRateLimiterV0 } from "../spatialProjectionRateLimiterV0.js";
import { buildProjectionEventEnvelopeV0, deriveProjectionEventIdV0 } from "../spatialProjectionProvenanceV0.js";
import {
  assertSensorTelemetryHasNoTruthInferenceV0,
  ONE_WAY_SENSOR_PROJECTION_LAW_V0
} from "../spatialProjectionBarrierV0.js";

describe("spatialHardwareEffectContractV0", () => {
  it("allows enumerated hardware kinds", () => {
    expect(assertHardwareEffectKindAllowedV0(HARDWARE_EFFECT_KIND_V0.LIGHT_INTENSITY).ok).toBe(true);
  });

  it("rejects manipulative / covert kinds", () => {
    for (const k of FORBIDDEN_HARDWARE_EFFECT_KINDS_V0) {
      expect(assertHardwareEffectKindAllowedV0(k).ok).toBe(false);
    }
  });
});

describe("spatialProjectionRateLimiterV0", () => {
  it("blocks rapid repeats of same effect kind", () => {
    const lim = createSpatialProjectionRateLimiterV0({ defaultMinIntervalMs: 200 });
    expect(lim.tryCommit("LIGHT_INTENSITY", 1000).ok).toBe(true);
    expect(lim.tryCommit("LIGHT_INTENSITY", 1050).ok).toBe(false);
    expect(lim.tryCommit("LIGHT_INTENSITY", 1201).ok).toBe(true);
  });
});

describe("spatialProjectionProvenanceV0", () => {
  it("proj_evt ids are deterministic", () => {
    const a = deriveProjectionEventIdV0({
      effectKind: "LIGHT_INTENSITY",
      atMs: 42,
      cueFingerprint: "abc",
      lane: "observer"
    });
    const b = deriveProjectionEventIdV0({
      effectKind: "LIGHT_INTENSITY",
      atMs: 42,
      cueFingerprint: "abc",
      lane: "observer"
    });
    expect(a).toBe(b);
    expect(a.startsWith("proj_evt_")).toBe(true);
  });

  it("builds frozen envelope", () => {
    const env = buildProjectionEventEnvelopeV0({
      effectKind: "AUDIO_PAN",
      atMs: 7,
      cueFingerprint: "fp1",
      lane: "active",
      sourceRuntime: "spatialProjectionRuntimeV0"
    });
    expect(env.schema).toContain("spatialProjectionEvent");
    expect(env.provenanceSource).toContain("spatialProjectionRuntime");
  });
});

describe("spatialProjectionBarrierV0 — sensor ingress (PR-4-C)", () => {
  it("documents one-way sensor law", () => {
    expect(ONE_WAY_SENSOR_PROJECTION_LAW_V0).toContain("physics");
  });

  it("rejects truth-inference keys on telemetry-shaped payloads", () => {
    expect(assertSensorTelemetryHasNoTruthInferenceV0({ occupancy01: 0.3, lightLux: 120 }).ok).toBe(true);
    expect(assertSensorTelemetryHasNoTruthInferenceV0({ productivityState: "high" }).ok).toBe(false);
  });
});
