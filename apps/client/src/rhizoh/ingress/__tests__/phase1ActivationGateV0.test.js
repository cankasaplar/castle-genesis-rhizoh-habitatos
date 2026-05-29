import { describe, expect, it } from "vitest";
import {
  isDataPlaneActiveV0,
  isIngressRuntimeInertV0,
  PHASE1_ACTIVATION_ENV_KEY_V0
} from "../phase1ActivationGateV0.js";

describe("phase1ActivationGateV0", () => {
  it("data plane off by default in test env", () => {
    const orig = import.meta.env[PHASE1_ACTIVATION_ENV_KEY_V0];
    import.meta.env[PHASE1_ACTIVATION_ENV_KEY_V0] = "0";
    try {
      expect(isDataPlaneActiveV0()).toBe(false);
      expect(isIngressRuntimeInertV0()).toBe(true);
    } finally {
      import.meta.env[PHASE1_ACTIVATION_ENV_KEY_V0] = orig;
    }
  });
});
