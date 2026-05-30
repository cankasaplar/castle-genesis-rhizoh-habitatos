import { describe, expect, it } from "vitest";
import { WS_MESSAGE } from "@castle/protocol";
import { createCastleSocialWsChannelV0 } from "../castleSocialWsSyncV0.js";

describe("createCastleSocialWsChannelV0", () => {
  it("returns API surface", () => {
    const ch = createCastleSocialWsChannelV0({
      wsBaseUrl: "",
      castleRoomKey: "r1",
      userId: "u1"
    });
    expect(typeof ch.connect).toBe("function");
    expect(typeof ch.sendPulse).toBe("function");
    expect(typeof ch.dispose).toBe("function");
    ch.dispose();
  });

  it("uses CASTLE_SOCIAL protocol keys from @castle/protocol", () => {
    expect(WS_MESSAGE.CASTLE_SOCIAL_PULSE).toBe("CASTLE_SOCIAL_PULSE");
    expect(WS_MESSAGE.CASTLE_SOCIAL_ROOM).toBe("CASTLE_SOCIAL_ROOM");
  });
});
