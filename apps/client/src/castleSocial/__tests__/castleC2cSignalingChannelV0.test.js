import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { WS_MESSAGE } from "@castle/protocol";
import { createCastleC2cSignalingChannelV0 } from "../castleC2cSignalingChannelV0.js";

describe("castleC2cSignalingChannelV0", () => {
  /** @type {import('vitest').Mock} */
  let MockWebSocket;

  beforeEach(() => {
    MockWebSocket = vi.fn(function MockWS() {
      this.readyState = 1;
      this.send = vi.fn();
      this.close = vi.fn();
      this.addEventListener = vi.fn((event, cb) => {
        if (event === "open") this._open = cb;
        if (event === "message") this._message = cb;
      });
    });
    MockWebSocket.OPEN = 1;
    // @ts-expect-error test mock
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers uid to clientId from CASTLE_SOCIAL_ROOM roster", () => {
    const channel = createCastleC2cSignalingChannelV0({
      wsBaseUrl: "ws://localhost:5174",
      userId: "me"
    });
    channel.connect();
    const ws = MockWebSocket.mock.instances[0];
    ws._open?.();
    ws._message?.({
      data: JSON.stringify({
        type: WS_MESSAGE.HELLO,
        payload: { clientId: "c-abc123" }
      })
    });
    ws._message?.({
      data: JSON.stringify({
        type: WS_MESSAGE.CASTLE_SOCIAL_ROOM,
        payload: {
          roster: [{ userId: "peer_uid", gatewayClientId: "c-peer99", lastMs: Date.now() }]
        }
      })
    });
    expect(channel.getClientId()).toBe("c-abc123");
    expect(channel.resolveClientIdForUserV0("peer_uid")).toBe("c-peer99");
    expect(channel.resolveUserForClientIdV0("c-peer99")).toBe("peer_uid");
    channel.dispose();
  });
});
