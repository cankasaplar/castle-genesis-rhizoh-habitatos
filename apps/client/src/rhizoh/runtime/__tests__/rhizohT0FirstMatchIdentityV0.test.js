import { describe, expect, it, vi, afterEach } from "vitest";
import { isRhizohT0FirstMatchIdentityV0 } from "../rhizohT0FirstMatchIdentityV0.js";

describe("rhizohT0FirstMatchIdentityV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off in dev by default", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_DEBUG", "0");
    expect(isRhizohT0FirstMatchIdentityV0()).toBe(false);
  });

  it("is on in production when VITE_DEBUG=0", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_DEBUG", "0");
    expect(isRhizohT0FirstMatchIdentityV0()).toBe(true);
  });

  it("respects explicit opt-out", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_RHIZOH_T0_FIRST_MATCH", "0");
    expect(isRhizohT0FirstMatchIdentityV0()).toBe(false);
  });
});
