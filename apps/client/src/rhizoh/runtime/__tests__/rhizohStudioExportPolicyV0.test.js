import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildStudioOutputPackManifestV0,
  evaluateStudioExportAllowedV0,
  requestStudioExportPackV0,
  STUDIO_EXPORT_MODE_V0
} from "../rhizohStudioExportPolicyV0.js";
import { bootstrapRhizohDomainGateV0, RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainGateV0.js";
import {
  __resetControlPlaneForTestV0,
  runControlPlaneForDomainV0
} from "../rhizohControlPlaneV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";

describe("rhizohStudioExportPolicyV0", () => {
  beforeEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainAdapterRegistryForTestV0();
    __resetDomainHealthForTestV0();
    __resetControlPlaneForTestV0();
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.STUDIO, { pathname: "/studio/main" });
    runControlPlaneForDomainV0(RHIZOH_DOMAIN_ID_V0.STUDIO, { tensorResult: { ok: true } });
  });

  afterEach(() => {
    __resetControlPlaneForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainAdapterRegistryForTestV0();
    __resetDomainHealthForTestV0();
  });

  it("blocks export without user consent", () => {
    const gate = evaluateStudioExportAllowedV0({ userConsent: false });
    expect(gate.allowed).toBe(false);
    expect(gate.mode).toBe(STUDIO_EXPORT_MODE_V0.BLOCKED_NO_CONSENT);
  });

  it("allows manual export with consent in normal mode", () => {
    const gate = evaluateStudioExportAllowedV0({ userConsent: true });
    expect(gate.allowed).toBe(true);
    expect(gate.mode).toBe(STUDIO_EXPORT_MODE_V0.MANUAL_ONLY);
  });

  it("requestStudioExportPackV0 returns mock pack when allowed", () => {
    const out = requestStudioExportPackV0({ userConsent: true, locale: "en" });
    expect(out.ok).toBe(true);
    expect(out.pack?.schema).toBe("rhizoh.studio_output_pack.v0");
    expect(out.pack?.persistence).toBe("memory_only");
  });

  it("buildStudioOutputPackManifestV0 includes asset manifest", () => {
    const pack = buildStudioOutputPackManifestV0({ locale: "tr" });
    expect(pack.assets.length).toBeGreaterThan(0);
    expect(pack.fer1VaultMerge).toBe(false);
  });

  it("blocks export when control plane is degraded", () => {
    const gate = evaluateStudioExportAllowedV0({ userConsent: true, tensorOk: false });
    expect(gate.allowed).toBe(false);
    expect(gate.mode).toBe(STUDIO_EXPORT_MODE_V0.BLOCKED_DEGRADED);
  });
});
