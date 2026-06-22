import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  registerMatchGatewayWsV0,
  getMatchGatewayWsV0,
  getMatchGatewayWsStatusV0,
  waitForMatchGatewayWsOpenV0,
  resetMatchGatewayWsForTestV0
} from "../matchmakingGatewayWsV0.js";

describe("matchmakingGatewayWsV0", () => {
  beforeEach(() => {
    resetMatchGatewayWsForTestV0();
  });

  afterEach(() => {
    resetMatchGatewayWsForTestV0();
  });

  it("registers and returns an open websocket", () => {
    const ws = {
      readyState: 1,
      url: "wss://gateway.test/ws?token=secret",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    registerMatchGatewayWsV0(ws, { source: "test" });
    expect(getMatchGatewayWsV0()).toBe(ws);
    const status = getMatchGatewayWsStatusV0();
    expect(status.open).toBe(true);
    expect(status.source).toBe("test");
  });

  it("clears registration when socket is removed", () => {
    const ws = {
      readyState: 1,
      url: "wss://gateway.test/ws",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    registerMatchGatewayWsV0(ws, { source: "test" });
    registerMatchGatewayWsV0(null);
    expect(getMatchGatewayWsV0()).toBeNull();
  });

  it("waitForMatchGatewayWsOpenV0 resolves immediately when socket is open", async () => {
    const ws = {
      readyState: 1,
      url: "wss://gateway.test/ws",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    registerMatchGatewayWsV0(ws, { source: "test" });
    const out = await waitForMatchGatewayWsOpenV0({ timeoutMs: 1000 });
    expect(out.ok).toBe(true);
    expect(out.ws).toBe(ws);
  });
});
