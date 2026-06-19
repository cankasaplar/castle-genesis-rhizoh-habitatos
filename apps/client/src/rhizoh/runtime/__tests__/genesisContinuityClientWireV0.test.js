import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";

const mockGenesisOrigin = vi.hoisted(() => ({ value: "https://gw.test" }));
const mockDirectOrigin = vi.hoisted(() => ({ value: "https://direct.test" }));
const mockSseBlockedViaProxy = vi.hoisted(() => ({ value: false }));

vi.mock("../../../castleFlight/castleFlightConfig.js", () => ({
  resolveGenesisGatewayHttpBaseV0: () => mockGenesisOrigin.value,
  resolveGenesisSseStreamBaseV0: () => mockGenesisOrigin.value,
  resolveGenesisDirectGatewayOriginV0: () => mockDirectOrigin.value,
  isGenesisSseBlockedViaGatewayProxyV0: () => mockSseBlockedViaProxy.value
}));

vi.mock("../genesisSingleAuthorityLockV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listGenesisAuthorityOriginsV0: () => {
      if (String(import.meta.env?.VITE_GENESIS_ALLOW_DIRECT_FALLBACK || "").trim() === "1") {
        const out = [mockGenesisOrigin.value];
        if (mockDirectOrigin.value && mockDirectOrigin.value !== mockGenesisOrigin.value) {
          out.push(mockDirectOrigin.value);
        }
        return out;
      }
      return [mockGenesisOrigin.value].filter(Boolean);
    }
  };
});

describe("genesisContinuityClientWireV0", () => {
  beforeEach(() => {
    mockGenesisOrigin.value = "https://gw.test";
    mockDirectOrigin.value = "https://direct.test";
    mockSseBlockedViaProxy.value = false;
    vi.resetModules();
    window.__rhizoh = {};
    global.EventSource = vi.fn(() => ({
      close: vi.fn(),
      addEventListener: vi.fn(),
      onopen: null,
      onerror: null,
      onmessage: null
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ ok: false, error: "upstream_down" })
      })
    );
  });

  afterEach(async () => {
    const mod = await import("../genesisContinuityClientWireV0.js");
    mod.stopGenesisContinuityClientWireV0();
    mod.__resetGenesisContinuityWireForTestV0();
    vi.unstubAllGlobals();
  });

  it("skips EventSource when SSE would use gatewayProxy (poll_only)", async () => {
    mockGenesisOrigin.value = "https://rhizoh.com/api/gatewayProxy";
    mockSseBlockedViaProxy.value = true;

    const mod = await import("../genesisContinuityClientWireV0.js");
    const stop = mod.ensureGenesisContinuityClientWireV0();

    expect(EventSource).not.toHaveBeenCalled();
    expect(window.__rhizoh.genesisStream?.transport).toBe("poll");
    expect(window.__rhizoh.genesisStream?.status).toBe("poll_only");
    expect(window.__rhizoh.genesisStream?.sseSkipped).toBe(true);
    stop();
  });

  it("ensureGenesisContinuityClientWireV0 mounts once and records poll 503", async () => {
    const mod = await import("../genesisContinuityClientWireV0.js");
    const stopA = mod.ensureGenesisContinuityClientWireV0();
    const stopB = mod.ensureGenesisContinuityClientWireV0();
    expect(stopA).toBe(stopB);

    await vi.waitFor(() => {
      expect(window.__rhizoh.genesisStream?.lastPollHttpStatus).toBe(503);
    });

    expect(window.__rhizoh.genesisStream?.status).toBe("upstream_503");
    stopA();
  });

  it("falls back to direct gateway poll origin after proxy network failure when allowed", async () => {
    vi.stubEnv("VITE_GENESIS_ALLOW_DIRECT_FALLBACK", "1");
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          genesisStream: { lastAcceptedSeq: 12 },
          canonicalTick: { value: 12 }
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    const mod = await import("../genesisContinuityClientWireV0.js");
    const stop = mod.ensureGenesisContinuityClientWireV0();

    await vi.waitFor(() => {
      expect(window.__rhizoh.genesisStream?.status).toBe("poll_ok");
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://gw.test/rhizoh/genesis/runtime");
    expect(fetchMock.mock.calls[1][0]).toBe("https://direct.test/rhizoh/genesis/runtime");
    expect(window.__rhizoh.genesisStream?.pollViaDirect).toBe(true);
    stop();
  });

  it("records poll_timeout when gateway cold start hangs", async () => {
    const fetchMock = vi.fn((_url, init) =>
      new Promise((resolve, reject) => {
        init?.signal?.addEventListener?.("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("AbortSignal", {
      timeout: () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5);
        return controller.signal;
      }
    });

    const mod = await import("../genesisContinuityClientWireV0.js");
    const stop = mod.ensureGenesisContinuityClientWireV0();

    await vi.waitFor(() => {
      expect(window.__rhizoh.genesisStream?.pollError).toBe("poll_timeout");
    });

    stop();
  });
});
