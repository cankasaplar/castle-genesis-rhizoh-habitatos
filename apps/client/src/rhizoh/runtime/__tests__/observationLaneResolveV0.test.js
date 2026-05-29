import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveObservationIdentityLaneV0 } from "../observationLaneResolveV0.js";

describe("observationLaneResolveV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.pushState({}, "", "/");
  });

  it("DEV: /demo resolves to guest", () => {
    vi.stubEnv("DEV", true);
    window.history.pushState({}, "", "/demo");
    expect(resolveObservationIdentityLaneV0()).toBe("guest");
  });

  it("PROD: /demo does not force guest lane", () => {
    vi.stubEnv("DEV", false);
    window.history.pushState({}, "", "/demo");
    expect(resolveObservationIdentityLaneV0()).toBe("owner");
  });
});
