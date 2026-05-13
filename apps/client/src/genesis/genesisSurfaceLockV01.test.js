import { describe, expect, it, vi } from "vitest";
import {
  LOCKED_H_SURFACE_V022_PRE_RELEASE_V01,
  buildGenesisObservabilitySurfaceManifestV022PreV01,
  computeGenesisHSurfaceV01,
  fnv1a32HexV01,
  genesisObservabilityStructuralContractOkV01,
  resolveGenesisSurfaceLockStateV01
} from "./genesisSurfaceLockV01.js";

describe("genesisSurfaceLockV01", () => {
  it("FNV-1a helper is stable for empty string", () => {
    expect(fnv1a32HexV01("")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("locked H_surface matches canonical v0.2.2-pre manifest", () => {
    const m = buildGenesisObservabilitySurfaceManifestV022PreV01();
    expect(computeGenesisHSurfaceV01(m)).toBe(LOCKED_H_SURFACE_V022_PRE_RELEASE_V01);
  });

  it("structural contract requires v0.2.2 topology nodes on anomaly field", () => {
    expect(
      genesisObservabilityStructuralContractOkV01({
        epistemicAnomalyFieldV01: {
          scaleInterference01: { v: 0 },
          regimeCoherence01: { v: 0 },
          emaMultiScaleOfA: [{ id: "fast" }]
        }
      })
    ).toBe(true);
    expect(genesisObservabilityStructuralContractOkV01({ epistemicAnomalyFieldV01: {} })).toBe(false);
    expect(genesisObservabilityStructuralContractOkV01(null)).toBe(false);
  });

  it("resolve: research default has no legacy drift", () => {
    vi.stubEnv("VITE_GENESIS_DEPLOY_MODE", "");
    const r = resolveGenesisSurfaceLockStateV01({ epistemicEpochCount: 3, structuralContractSatisfied: true });
    expect(r.deployMode).toBe("research");
    expect(r.legacyDriftMode).toBe(false);
    vi.unstubAllEnvs();
  });

  it("resolve: observability + simulate legacy → Legacy Drift Mode", () => {
    vi.stubEnv("VITE_GENESIS_DEPLOY_MODE", "observability");
    vi.stubEnv("VITE_GENESIS_SIMULATE_LEGACY_DRIFT", "1");
    vi.stubEnv("VITE_GENESIS_PASSIVE_EPOCH_MAX", "100");
    const r = resolveGenesisSurfaceLockStateV01({ epistemicEpochCount: 2, structuralContractSatisfied: true });
    expect(r.deployMode).toBe("observability");
    expect(r.legacyDriftMode).toBe(true);
    expect(r.passiveObservabilityEpoch).toBe(true);
    vi.unstubAllEnvs();
  });

  it("resolve: observability + structural breach → legacy without simulate", () => {
    vi.stubEnv("VITE_GENESIS_DEPLOY_MODE", "observability");
    vi.stubEnv("VITE_GENESIS_SIMULATE_LEGACY_DRIFT", "");
    const r = resolveGenesisSurfaceLockStateV01({ epistemicEpochCount: 1, structuralContractSatisfied: false });
    expect(r.legacyDriftMode).toBe(true);
    vi.unstubAllEnvs();
  });

  it("resolve: imported H_surface mismatch → legacy", () => {
    vi.stubEnv("VITE_GENESIS_DEPLOY_MODE", "observability");
    const r = resolveGenesisSurfaceLockStateV01({
      epistemicEpochCount: 5,
      structuralContractSatisfied: true,
      importedHSurface01: "fnv1a32_v01:deadbeef"
    });
    expect(r.legacyDriftMode).toBe(true);
    vi.unstubAllEnvs();
  });
});
