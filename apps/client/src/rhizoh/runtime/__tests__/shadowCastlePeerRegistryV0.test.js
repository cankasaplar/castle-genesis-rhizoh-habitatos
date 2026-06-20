import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetShadowCastlePeerRegistryForTestV0,
  bindShadowCastleReactionPeerV0,
  bindShadowCastleSimPeerV0,
  publishShadowCastlePeerRegistryV0,
  remoteCastlePinIdV0,
  resolveShadowReactionTargetV0,
  shouldShowShadowPeerSimPinV0
} from "../shadowCastlePeerRegistryV0.js";
import { PEER_CASTLE_SIM_ID_V0 } from "../shadowCastleEventBusV0.js";

describe("shadowCastlePeerRegistryV0", () => {
  beforeEach(() => {
    __resetShadowCastlePeerRegistryForTestV0();
  });

  it("remoteCastlePinIdV0 prefixes uid", () => {
    expect(remoteCastlePinIdV0("abc123")).toBe("remote_castle_abc123");
  });

  it("resolveShadowReactionTargetV0 falls back to sim when no remotes", () => {
    const target = resolveShadowReactionTargetV0();
    expect(target.isSim).toBe(true);
    expect(target.pinId).toBe(PEER_CASTLE_SIM_ID_V0);
  });

  it("resolveShadowReactionTargetV0 prefers bound peer over sim", () => {
    bindShadowCastleReactionPeerV0({
      uid: "peer1",
      lat: 41.01,
      lon: 29.01,
      displayName: "Eren Sim"
    });
    const target = resolveShadowReactionTargetV0();
    expect(target.isSim).toBe(false);
    expect(target.pinId).toBe("remote_castle_peer1");
    expect(target.uid).toBe("peer1");
  });

  it("resolveShadowReactionTargetV0 uses first remote when no bound peer and pins visible", () => {
    publishShadowCastlePeerRegistryV0({
      remoteCastles: [
        { id: "peer_a", lat: 41.05, lon: 29.01, displayName: "A" },
        { id: "peer_b", lat: 40, lon: 28, displayName: "B" }
      ],
      remoteCastlesVisible: true
    });
    const target = resolveShadowReactionTargetV0();
    expect(target.uid).toBe("peer_a");
    expect(target.source).toBe("nearest_remote");
  });

  it("shouldShowShadowPeerSimPinV0 hides sim when remotes exist and visible", () => {
    publishShadowCastlePeerRegistryV0({
      remoteCastles: [{ id: "x", lat: 41, lon: 29 }],
      remoteCastlesVisible: true
    });
    expect(shouldShowShadowPeerSimPinV0()).toBe(false);
  });

  it("shouldShowShadowPeerSimPinV0 keeps sim when remotes exist but hidden", () => {
    publishShadowCastlePeerRegistryV0({
      remoteCastles: [{ id: "x", lat: 41, lon: 29 }],
      remoteCastlesVisible: false
    });
    expect(shouldShowShadowPeerSimPinV0()).toBe(true);
  });

  it("bindShadowCastleSimPeerV0 sets sim reaction target", () => {
    bindShadowCastleSimPeerV0();
    const target = resolveShadowReactionTargetV0();
    expect(target.isSim).toBe(true);
    expect(target.source).toBe("bound_sim_peer");
  });
});
