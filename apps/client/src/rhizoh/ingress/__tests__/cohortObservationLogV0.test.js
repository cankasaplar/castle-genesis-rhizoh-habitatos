import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { recordCohortObservationV0 } from "../cohortObservationLogV0.js";

describe("cohortObservationLogV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_COHORT_OBSERVATION_LOG", "1");
    sessionStorage.removeItem("castle.cohort_obs_ring.v1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    sessionStorage.removeItem("castle.cohort_obs_ring.v1");
  });

  it("does not record unknown tags (passive-only)", () => {
    recordCohortObservationV0({ tag: "hypothetical_control_hook", meta: {} });
    const raw = sessionStorage.getItem("castle.cohort_obs_ring.v1");
    const ring = raw ? JSON.parse(raw) : [];
    expect(Array.isArray(ring) ? ring.length : 0).toBe(0);
  });

  it("records allowlisted tags and sanitizes meta", () => {
    recordCohortObservationV0({
      tag: "cohort_auth_ok",
      meta: { serverGate: true, evil: "nope", status: 403 }
    });
    const ring = JSON.parse(sessionStorage.getItem("castle.cohort_obs_ring.v1") || "[]");
    expect(ring.length).toBe(1);
    expect(ring[0].tag).toBe("cohort_auth_ok");
    expect(ring[0].meta).toEqual({ serverGate: true, status: 403 });
  });
});
