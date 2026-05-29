import { describe, expect, it } from "vitest";
import {
  SUBSTRATE_AUTHORITY_PROFILES_V0,
  peerWalPolicyFromProfileV0,
  resolveSubstrateAuthorityProfileV0
} from "../substrateAuthorityProfileV0.js";

describe("substrateAuthorityProfileV0", () => {
  it("production profile is strictest peer WAL policy", () => {
    const prod = SUBSTRATE_AUTHORITY_PROFILES_V0.production;
    const staging = SUBSTRATE_AUTHORITY_PROFILES_V0.staging;
    const local = SUBSTRATE_AUTHORITY_PROFILES_V0.local;
    expect(prod.peerWalMaxFeedAgeMs).toBeLessThan(staging.peerWalMaxFeedAgeMs);
    expect(staging.peerWalMaxFeedAgeMs).toBeLessThan(local.peerWalMaxFeedAgeMs);
    expect(prod.rejectUnsignedWalIngress).toBe(true);
    expect(local.rejectUnsignedWalIngress).toBe(false);
  });

  it("peerWalPolicyFromProfile returns numeric thresholds", () => {
    const p = peerWalPolicyFromProfileV0();
    expect(p.maxFeedAgeMs).toBeGreaterThan(0);
    expect(Number.isFinite(p.epochAheadTolerance)).toBe(true);
  });

  it("resolveSubstrateAuthorityProfile returns a known profile", () => {
    const profile = resolveSubstrateAuthorityProfileV0();
    expect(["local", "staging", "production"]).toContain(profile.id);
  });
});
