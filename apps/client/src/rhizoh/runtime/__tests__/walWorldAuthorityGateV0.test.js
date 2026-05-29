import { describe, expect, it, vi } from "vitest";
import { isWalGeometryIngressEnabledV0 } from "../walWorldAuthorityGateV0.js";

describe("walWorldAuthorityGateV0", () => {
  it("is off by default", () => {
    vi.stubEnv("VITE_WAL_GEOMETRY_INGRESS", "");
    expect(isWalGeometryIngressEnabledV0()).toBe(false);
  });

  it("is on when VITE_WAL_GEOMETRY_INGRESS=1", () => {
    vi.stubEnv("VITE_WAL_GEOMETRY_INGRESS", "1");
    expect(isWalGeometryIngressEnabledV0()).toBe(true);
  });
});
