import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";

const mockGenesisOrigin = vi.hoisted(() => ({ value: "https://gw.test" }));

vi.mock("../../castleFlight/castleFlightConfig.js", () => ({
  resolveGenesisGatewayHttpBaseV0: () => mockGenesisOrigin.value
}));

describe("genesisContinuityClientWireV0", () => {
  beforeEach(() => {
    mockGenesisOrigin.value = "https://gw.test";
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
});
