import { describe, it, expect } from "vitest";
import { WS_MESSAGE } from "@castle/protocol";
import { createCastleWalPeerWsChannelV0 } from "../castleWalPeerWsSyncV0.js";

describe("castleWalPeerWsSyncV0", () => {
  it("exposes connect/send/dispose API", () => {
    const ch = createCastleWalPeerWsChannelV0({
      wsBaseUrl: "",
      castleRoomKey: "wal:test",
      castleId: "castle:local",
      getState: () => ({ realitySeal: { realityEpoch: 0 } })
    });
    expect(typeof ch.connect).toBe("function");
    expect(typeof ch.sendLocalWalPeerFeed).toBe("function");
    expect(typeof ch.dispose).toBe("function");
    ch.dispose();
  });

  it("uses CASTLE_WAL_PEER protocol keys", () => {
    expect(WS_MESSAGE.CASTLE_WAL_PEER_FEED).toBe("CASTLE_WAL_PEER_FEED");
    expect(WS_MESSAGE.CASTLE_WAL_PEER_ROOM).toBe("CASTLE_WAL_PEER_ROOM");
  });
});
