import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetShadowCastleInboxForTestV0,
  appendShadowCastleInboxItemV0,
  appendShadowReactionToInboxV0,
  countUnreadShadowCastleInboxV0,
  getShadowCastleInboxSnapshotV0,
  markShadowCastleInboxReadV0,
  startShadowCastleInboxV0,
  stopShadowCastleInboxV0
} from "../shadowCastleInboxV0.js";
import { SHADOW_CASTLE_REACTION_EVENT_V0 } from "../shadowDataPlaneLoopV0.js";

describe("shadowCastleInboxV0", () => {
  beforeEach(() => {
    __resetShadowCastleInboxForTestV0();
  });

  it("appendShadowCastleInboxItemV0 tracks unread items", () => {
    appendShadowCastleInboxItemV0({
      kind: "reaction",
      titleTr: "Test",
      bodyTr: "Hamle yankısı"
    });
    expect(countUnreadShadowCastleInboxV0()).toBe(1);
    markShadowCastleInboxReadV0();
    expect(countUnreadShadowCastleInboxV0()).toBe(0);
  });

  it("appendShadowReactionToInboxV0 maps trace to inbox row", () => {
    const item = appendShadowReactionToInboxV0({
      atMs: 1000,
      event: { type: "chess.move.v0" },
      reaction: {
        meaning: "chess_quiet_move:Nf3",
        target: { pinId: "peer_castle_sim_istanbul", isSim: true },
        toast: { tr: "Nf3 yankısı", en: "Nf3 echo" }
      }
    });
    expect(item?.bodyTr).toBe("Nf3 yankısı");
    expect(item?.isRealPeer).toBe(false);
    expect(getShadowCastleInboxSnapshotV0().items.length).toBe(1);
  });

  it("getShadowCastleInboxSnapshotV0 is referentially stable for useSyncExternalStore", () => {
    appendShadowCastleInboxItemV0({ bodyTr: "a" });
    const a = getShadowCastleInboxSnapshotV0();
    const b = getShadowCastleInboxSnapshotV0();
    expect(a).toBe(b);
  });

  it("startShadowCastleInboxV0 listens for shadow reactions", () => {
    startShadowCastleInboxV0();
    window.dispatchEvent(
      new CustomEvent(SHADOW_CASTLE_REACTION_EVENT_V0, {
        detail: {
          event: { type: "castle.visit.echo.v0" },
          reaction: {
            target: { pinId: "remote_castle_x", isSim: false },
            toast: { tr: "Ziyaret", en: "Visit" }
          }
        }
      })
    );
    expect(getShadowCastleInboxSnapshotV0().items[0]?.kind).toBe("visit");
    stopShadowCastleInboxV0();
  });
});
