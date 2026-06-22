import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  registerMatchGatewayWsV0,
  getMatchGatewayWsV0,
  getMatchGatewayWsStatusV0,
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
});
