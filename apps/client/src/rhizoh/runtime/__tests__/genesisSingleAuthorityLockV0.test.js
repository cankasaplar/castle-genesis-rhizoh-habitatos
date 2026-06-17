import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../castleFlight/castleFlightConfig.js", () => ({
  resolveGenesisGatewayHttpBaseV0: () => "https://rhizoh.com/api/gatewayProxy",
  resolveGenesisDirectGatewayOriginV0: () => "https://castle-genesis-rhizoh-habitatos.onrender.com"
}));

describe("genesisSingleAuthorityLockV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("locks to single proxy origin by default", async () => {
    const mod = await import("../genesisSingleAuthorityLockV0.js");
    expect(mod.listGenesisAuthorityOriginsV0()).toEqual([
      "https://rhizoh.com/api/gatewayProxy"
    ]);
    const snap = mod.getGenesisSingleAuthorityLockSnapshotV0();
    expect(snap.lockActive).toBe(true);
    expect(snap.originCount).toBe(1);
  });

  it("allows direct fallback only when env opt-in is set", async () => {
    vi.stubEnv("VITE_GENESIS_ALLOW_DIRECT_FALLBACK", "1");
    vi.resetModules();
    const mod = await import("../genesisSingleAuthorityLockV0.js");
    expect(mod.listGenesisAuthorityOriginsV0()).toEqual([
      "https://rhizoh.com/api/gatewayProxy",
      "https://castle-genesis-rhizoh-habitatos.onrender.com"
    ]);
    expect(mod.isGenesisDirectFallbackAllowedV0()).toBe(true);
  });
});
