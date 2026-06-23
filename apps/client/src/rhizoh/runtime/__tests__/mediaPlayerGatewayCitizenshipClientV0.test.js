import { describe, expect, it, beforeEach } from "vitest";
import { GATEWAY_EVENT_SOURCE_V0 } from "@castle/protocol";
import {
  mountMediaPlayerGatewayCitizenshipConsoleV0,
  resetMediaPlayerGatewayCitizenshipClientForTestV0,
  resolveMediaPlayerWorldContextV0,
  listMediaGatewayCitizenChannelIdsV0
} from "../mediaPlayerGatewayCitizenshipV0.js";
import {
  buildRhizohObservationStateV1,
  recordMediaObservationV1,
  resetBroadcastVisibilityForTestV1
} from "../rhizohObservationStateV1.js";
import { RHIZOH_WORLDSPORTS_CHANNEL_ID_V0, RHIZOH_WORLD_NEWS_CHANNEL_ID_V0 } from "../worldSpaceMediaChannelsV0.js";

describe("mediaPlayerGatewayCitizenshipV0", () => {
  beforeEach(() => {
    resetMediaPlayerGatewayCitizenshipClientForTestV0();
    resetBroadcastVisibilityForTestV1();
    globalThis.window = /** @type {any} */ ({
      location: { hostname: "localhost", pathname: "/" },
      __rhizoh: {}
    });
  });

  it("resolveMediaPlayerWorldContextV0 binds channel id", () => {
    const ctx = resolveMediaPlayerWorldContextV0({ channelId: "world_sports" });
    expect(ctx.source).toBe(GATEWAY_EVENT_SOURCE_V0.MEDIA);
    expect(ctx.channelId).toBe("world_sports");
    expect(ctx.sessionId).toBe("world_sports");
  });

  it("mountMediaPlayerGatewayCitizenshipConsoleV0 exposes ensure API", () => {
    mountMediaPlayerGatewayCitizenshipConsoleV0();
    expect(typeof globalThis.window.__rhizoh.mediaGateway.ensure).toBe("function");
    expect(typeof globalThis.window.__rhizoh.mediaGateway.listRegistered).toBe("function");
  });

  it("listMediaGatewayCitizenChannelIdsV0 includes world_sports, world_news and full pack", () => {
    const ids = listMediaGatewayCitizenChannelIdsV0();
    expect(ids).toContain(RHIZOH_WORLDSPORTS_CHANNEL_ID_V0);
    expect(ids).toContain(RHIZOH_WORLD_NEWS_CHANNEL_ID_V0);
    expect(ids).toContain("castle_genesis");
    expect(ids).toHaveLength(11);
  });

  it("recordMediaObservationV1 surfaces media slice", () => {
    recordMediaObservationV1({
      registered: true,
      channelId: "world_sports",
      registeredChannelIds: ["castle_genesis", "world_sports"],
      expectedChannelCount: 6
    });
    const snap = buildRhizohObservationStateV1();
    expect(snap.media.registeredCount).toBe(2);
    expect(snap.media.citizenship).toBe("partial");
    expect(snap.media.registeredChannelIds).toContain("world_sports");
  });
});
