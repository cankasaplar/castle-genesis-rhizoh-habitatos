import { describe, expect, it } from "vitest";
import {
  CASTLE_C2C_MESSAGE_TYPE_V0,
  publishCastleC2cRealtimeMessageV0
} from "../castleC2cRealtimeBusV0.js";

describe("castleC2cRealtimeBusV0", () => {
  it("publishes typed chess move messages", () => {
    const msg = publishCastleC2cRealtimeMessageV0(CASTLE_C2C_MESSAGE_TYPE_V0.CHESS_MOVE, {
      matchId: "m1",
      move: "e4"
    });
    expect(msg.type).toBe(CASTLE_C2C_MESSAGE_TYPE_V0.CHESS_MOVE);
    expect(msg.payload.move).toBe("e4");
  });
});
