import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PERCEPTION_ALIGNMENT_OBSERVATION_FLAG_V0,
  shouldShowPerceptionAlignmentObservationStripV0
} from "../perceptionAlignmentObservationV0.js";

describe("perceptionAlignmentObservationV0", () => {
  const prevEnv = import.meta.env;

  afterEach(() => {
    Object.assign(import.meta.env, prevEnv);
    vi.unstubAllEnvs();
  });

  it("exposes stable debug flag name", () => {
    expect(PERCEPTION_ALIGNMENT_OBSERVATION_FLAG_V0).toBe(
      "VITE_RHIZOH_PERCEPTION_ALIGNMENT_DEBUG"
    );
  });

  it("hides strip in dev when T0 first-match identity is on", () => {
    Object.assign(import.meta.env, { DEV: true });
    vi.stubEnv("VITE_RHIZOH_T0_FIRST_MATCH", "1");
    expect(shouldShowPerceptionAlignmentObservationStripV0()).toBe(false);
  });

  it("shows strip only with explicit granular debug flag", () => {
    Object.assign(import.meta.env, { DEV: true, VITE_DEBUG: "1" });
    vi.stubEnv("VITE_RHIZOH_T0_FIRST_MATCH", "0");
    vi.stubEnv("VITE_RHIZOH_PERCEPTION_ALIGNMENT_DEBUG", "1");
    expect(shouldShowPerceptionAlignmentObservationStripV0()).toBe(true);
  });

  it("hides strip outside dev when granular flag off", () => {
    Object.assign(import.meta.env, { DEV: false, PROD: true });
    vi.stubEnv("VITE_RHIZOH_T0_FIRST_MATCH", "0");
    expect(shouldShowPerceptionAlignmentObservationStripV0()).toBe(false);
  });
});
