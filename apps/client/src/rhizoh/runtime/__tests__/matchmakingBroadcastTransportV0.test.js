import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  joinMatchBroadcastSessionV0,
  sendMatchSessionJoinV0,
  MATCH_BROADCAST_ROLE_V0
} from "../matchmakingBroadcastTransportV0.js";
import { clearMatchmakingTruthForTestV0 } from "../matchmakingTruthKernelV0.js";
import { resetMatchGatewayWsForTestV0, registerMatchGatewayWsV0 } from "../matchmakingGatewayWsV0.js";

describe("matchmakingBroadcastTransportV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
    resetMatchGatewayWsForTestV0();
  });

  it("sendMatchSessionJoinV0 rejects closed socket", () => {
    const ws = { readyState: 3 };
    const out = sendMatchSessionJoinV0(ws, { sessionId: "s1", role: MATCH_BROADCAST_ROLE_V0.PLAYER });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("ws_not_open");
  });

  it("joinMatchBroadcastSessionV0 uses registered gateway ws", async () => {
    const sends = [];
    const ws = {
      readyState: 1,
      url: "wss://gateway.test/ws",
      send: (raw) => sends.push(JSON.parse(raw)),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    registerMatchGatewayWsV0(ws, { source: "test" });

    const out = await joinMatchBroadcastSessionV0({ playerId: "p1" });
    expect(out.ok).toBe(true);
    expect(out.sessionId).toBeTruthy();
    expect(sends.length).toBe(1);
    expect(sends[0].type).toBe("MATCH_SESSION_JOIN");
    expect(sends[0].sessionId).toBe(out.sessionId);
  });
});
