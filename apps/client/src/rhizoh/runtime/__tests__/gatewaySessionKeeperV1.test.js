import { describe, expect, it, afterEach } from "vitest";
import {
  computeGatewayHeartbeatDelayV1,
  getGatewayOfflineDebounceThresholdV1,
  getGatewayReconnectBackoffMsV1,
  isGatewaySessionStableV1,
  noteGatewaySessionHealthOkV1,
  noteVoiceRuntimePressureV1,
  resetGatewaySessionKeeperForTestV1,
  shouldDeferGatewayHealthTickV1
} from "../gatewaySessionKeeperV1.js";

describe("gatewaySessionKeeperV1", () => {
  afterEach(() => {
    resetGatewaySessionKeeperForTestV1();
  });

  it("marks session stable after health ok", () => {
    noteGatewaySessionHealthOkV1({ connectionId: "conn_1" });
    expect(isGatewaySessionStableV1()).toBe(true);
  });

  it("defers health tick under voice pressure", () => {
    noteVoiceRuntimePressureV1(true);
    expect(shouldDeferGatewayHealthTickV1()).toBe(true);
    expect(getGatewayOfflineDebounceThresholdV1()).toBeGreaterThanOrEqual(3);
  });

  it("applies exponential reconnect backoff", () => {
    expect(getGatewayReconnectBackoffMsV1(1)).toBeGreaterThanOrEqual(1200);
    expect(getGatewayReconnectBackoffMsV1(4)).toBeGreaterThan(getGatewayReconnectBackoffMsV1(2));
    expect(computeGatewayHeartbeatDelayV1()).toBeGreaterThanOrEqual(12_000);
  });
});
