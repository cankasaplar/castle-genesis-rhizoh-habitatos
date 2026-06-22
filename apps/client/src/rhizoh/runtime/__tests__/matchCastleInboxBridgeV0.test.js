import { describe, it, expect, beforeEach } from "vitest";
import { __resetShadowCastleInboxForTestV0 } from "../shadowCastleInboxV0.js";
import {
  appendShadowCastleMatchInviteToInboxV0,
  ingestMatchCastleInviteFromGatewayV0,
  SHADOW_INBOX_KIND_MATCH_INVITE_V0
} from "../matchCastleInboxBridgeV0.js";
import {
  resolveShadowInboxItemActionV0,
  SHADOW_INBOX_ACTION_V0
} from "../shadowCastleInboxActionsV0.js";
import { resetMatchSessionSyncBridgeForTestV0 } from "../matchSessionSyncBridgeV0.js";
import { clearMatchmakingTruthForTestV0 } from "../matchmakingTruthKernelV0.js";

describe("matchCastleInboxBridgeV0", () => {
  beforeEach(() => {
    __resetShadowCastleInboxForTestV0();
    resetMatchSessionSyncBridgeForTestV0();
    clearMatchmakingTruthForTestV0();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rhizoh_guest_session_v0", "guest_test_b");
    }
  });

  it("appends match invite to shadow inbox", () => {
    const item = appendShadowCastleMatchInviteToInboxV0({
      sessionId: "test_room_1",
      hostPlayerId: "player_a",
      hostDisplayName: "Kale A",
      shareUrl: "https://rhizoh.com/match/test_room_1?playerId=b"
    });
    expect(item?.kind).toBe(SHADOW_INBOX_KIND_MATCH_INVITE_V0);
    expect(item?.matchSessionId).toBe("test_room_1");
    expect(resolveShadowInboxItemActionV0(item)).toBe(SHADOW_INBOX_ACTION_V0.ACCEPT_MATCH_INVITE);
  });

  it("skips inbox item for own invite", () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rhizoh_guest_session_v0", "player_a");
    }
    const item = appendShadowCastleMatchInviteToInboxV0({
      sessionId: "test_room_1",
      hostPlayerId: "player_a"
    });
    expect(item).toBeNull();
  });

  it("ingestMatchCastleInviteFromGateway adds inbox row", () => {
    const item = ingestMatchCastleInviteFromGatewayV0({
      sessionId: "room_x",
      hostPlayerId: "player_a",
      hostDisplayName: "Peer"
    });
    expect(item?.kind).toBe(SHADOW_INBOX_KIND_MATCH_INVITE_V0);
  });
});
