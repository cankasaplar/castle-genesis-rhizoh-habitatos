import { describe, expect, it, beforeEach } from "vitest";
import { SESSION_LIFECYCLE_V0 } from "../castleSessionLifecycleV0.js";
import {
  createCastleSocialAvSessionV0,
  endCastleSocialAvSessionV0,
  patchCastleSocialAvSessionV0,
  promoteCastleSocialAvSessionLiveV0,
  readCastleSocialAvSessionV0,
  resetCastleSocialAvSessionForTestsV0
} from "../castleSocialAvSessionV0.js";

describe("castleSocialAvSessionV0", () => {
  beforeEach(() => {
    resetCastleSocialAvSessionForTestsV0();
  });

  it("creates DRAFT then promotes to LIVE", () => {
    const draft = createCastleSocialAvSessionV0({
      roomKey: "test-room",
      hostCastleId: "castle_a",
      hostAnchor: { lat: 41, lon: 29, label: "Istanbul Castle", source: "test_anchor" }
    });
    expect(draft.lifecycle).toBe(SESSION_LIFECYCLE_V0.DRAFT);
    expect(draft.spatialSession.ok).toBe(true);
    expect(draft.spatialSession.roomId).toBe("test-room");
    expect(draft.spatialSession.spatialContext.hostAnchor.label).toBe("Istanbul Castle");
    const live = promoteCastleSocialAvSessionLiveV0(draft);
    expect(live?.lifecycle).toBe(SESSION_LIFECYCLE_V0.LIVE);
  });

  it("blocks mic patch before LIVE", () => {
    const draft = createCastleSocialAvSessionV0();
    const blocked = patchCastleSocialAvSessionV0(draft, { micActive: true });
    expect(blocked.ok).toBe(false);
  });

  it("allows mic patch after LIVE", () => {
    const draft = createCastleSocialAvSessionV0();
    promoteCastleSocialAvSessionLiveV0(draft);
    const patched = patchCastleSocialAvSessionV0(readCastleSocialAvSessionV0(), {
      micActive: true
    });
    expect(patched.ok).toBe(true);
    expect(readCastleSocialAvSessionV0()?.micActive).toBe(true);
  });

  it("keeps media transport pending while binding castle room context", () => {
    const draft = createCastleSocialAvSessionV0({
      hostCastleId: "istanbul_castle",
      peerCastleId: "barcelona_castle",
      hostAnchor: { lat: 41.04, lon: 29.0, label: "Istanbul Castle", source: "origin" },
      peerAnchor: { lat: 41.38, lon: 2.17, label: "Barcelona Castle", source: "peer" },
      conversationContext: { intent: "castle_call", openLoops: ["media_transport_pending"] }
    });

    expect(draft.roomKey).toBe("castle_room_barcelona_castle__istanbul_castle");
    expect(draft.spatialSession.peerCastleId).toBe("barcelona_castle");
    expect(draft.spatialSession.conversationContext.openLoops).toEqual(["media_transport_pending"]);
    expect(draft.spatialSession.transportPlan.mediaReady).toBe(false);
  });

  it("ends session", () => {
    createCastleSocialAvSessionV0();
    endCastleSocialAvSessionV0();
    expect(readCastleSocialAvSessionV0()).toBeNull();
  });
});
