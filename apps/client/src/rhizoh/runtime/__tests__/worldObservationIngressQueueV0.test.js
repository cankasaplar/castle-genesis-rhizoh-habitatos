import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockOrigins = vi.hoisted(() => ({
  proxy: "https://proxy.test",
  direct: "https://direct.test"
}));

vi.mock("../../../castleFlight/castleFlightConfig.js", () => ({
  resolveGenesisGatewayHttpBaseV0: () => mockOrigins.proxy,
  resolveGenesisDirectGatewayOriginV0: () => mockOrigins.direct,
  getCastleFlightConfig: () => ({ gatewayToken: "test-token" })
}));

vi.mock("../genesisSingleAuthorityLockV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listGenesisAuthorityOriginsV0: () => {
      if (String(import.meta.env?.VITE_GENESIS_ALLOW_DIRECT_FALLBACK || "").trim() === "1") {
        return [mockOrigins.proxy, mockOrigins.direct].filter(Boolean);
      }
      return [mockOrigins.proxy].filter(Boolean);
    }
  };
});

describe("worldObservationIngressQueueV0", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mockOrigins.proxy = "https://proxy.test";
    mockOrigins.direct = "https://direct.test";
  });

  afterEach(async () => {
    const mod = await import("../worldObservationIngressQueueV0.js");
    mod.clearWorldObservationIngressQueueForTestV0();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("falls back to direct gateway origin when proxy ingress returns 502 and fallback allowed", async () => {
    vi.stubEnv("VITE_GENESIS_ALLOW_DIRECT_FALLBACK", "1");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ ok: false, error: "bad_gateway" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, seq: 7 })
      });
    vi.stubGlobal("fetch", fetchMock);

    const mod = await import("../worldObservationIngressQueueV0.js");
    mod.clearWorldObservationIngressQueueForTestV0();
    mod.enqueueWorldObservationIngressV0({
      type: "world.tick",
      atMs: Date.now(),
      payload: { clientTickCount: 1, simTime: 0 }
    });

    await vi.advanceTimersByTimeAsync(500);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://proxy.test/rhizoh/genesis/ingress");
    expect(fetchMock.mock.calls[1][0]).toBe("https://direct.test/rhizoh/genesis/ingress");
    expect(mod.getWorldObservationIngressQueueSnapshotV0().lastAcceptedSeq).toBe(7);
  });
});
