import { describe, expect, it } from "vitest";
import {
  buildYoutubeEmbedUrlV0,
  buildYoutubeLiveChannelEmbedUrlV0,
  CASTLE_GENESIS_LIVE_PAGE_V0,
  getWorldSpaceMediaChannelPackSnapshotV0,
  listWorldSpaceMediaChannelsV0,
  NASA_ISS_EARTH_VIDEO_ID_V0,
  NASA_TV_YOUTUBE_CHANNEL_ID_V0,
  resolveInitialWorldSpaceMediaChannelIdV0,
  resolveWorldSpaceMediaChannelForMapNodeV0,
  resolveWorldSpaceMediaChannelV0,
  RHIZOH_LEARNING_CHANNEL_ID_V0,
  RHIZOH_WORLDSPORTS_CHANNEL_ID_V0,
  buildRhizohWorldSportsChannelV0
} from "../worldSpaceMediaChannelsV0.js";

describe("worldSpaceMediaChannelsV0", () => {
  it("lists castle genesis, learning channel, world sports, nasa, lofi, local (no empty chess VOD)", () => {
    const rows = listWorldSpaceMediaChannelsV0();
    const ids = rows.map((r) => r.id);
    expect(ids[0]).toBe("castle_genesis");
    expect(ids).toContain(RHIZOH_LEARNING_CHANNEL_ID_V0);
    expect(ids).toContain(RHIZOH_WORLDSPORTS_CHANNEL_ID_V0);
    expect(ids).not.toContain("castle_chess");
    expect(ids).toContain("nasa");
    expect(ids).toContain("lofi");
    expect(ids).toContain("local");
  });

  it("builds youtube-nocookie embed", () => {
    expect(buildYoutubeEmbedUrlV0("abc123")).toContain("youtube-nocookie.com/embed/abc123");
  });

  it("builds youtube embed with start and end trim", () => {
    const url = buildYoutubeEmbedUrlV0("abc123", { startSec: 10, endSec: 60 });
    expect(url).toContain("start=10");
    expect(url).toContain("end=60");
  });

  it("resolves initial channel by source", () => {
    expect(resolveInitialWorldSpaceMediaChannelIdV0("castle_init_map")).toBe("castle_genesis");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:event")).toBe("nasa");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:radio")).toBe("lofi");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:my_castle")).toBe("castle_genesis");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:chess")).toBe(RHIZOH_LEARNING_CHANNEL_ID_V0);
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:chess_arena")).toBe(
      RHIZOH_LEARNING_CHANNEL_ID_V0
    );
  });

  it("maps sovereign pins to distinct media channels", () => {
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "my_castle", type: "castle" })).toBe(
      "castle_genesis"
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "worldsports", type: "zone" })).toBe(
      RHIZOH_WORLDSPORTS_CHANNEL_ID_V0
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "chess", type: "zone" })).toBe(
      RHIZOH_LEARNING_CHANNEL_ID_V0
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "chess_arena", type: "zone" })).toBe(
      RHIZOH_LEARNING_CHANNEL_ID_V0
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "event", type: "zone" })).toBe("nasa");
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "radio", type: "broadcast" })).toBe("lofi");
  });

  it("castle genesis links to live page", () => {
    const ch = resolveWorldSpaceMediaChannelV0("castle_genesis");
    expect(ch.livePageUrl || ch.url).toContain("CastleGenesis");
  });

  it("nasa channel uses live NASA TV embed with ISS fallback", () => {
    const ch = resolveWorldSpaceMediaChannelV0("nasa");
    expect(ch.url).toContain(NASA_TV_YOUTUBE_CHANNEL_ID_V0);
    expect(ch.fallbackUrl).toContain(NASA_ISS_EARTH_VIDEO_ID_V0);
  });

  it("builds youtube live channel embed with controls", () => {
    const url = buildYoutubeLiveChannelEmbedUrlV0("abc", { controls: true });
    expect(url).toContain("live_stream?channel=abc");
    expect(url).toContain("controls=1");
  });

  it("learning channel is chess_cluster_live type", () => {
    const ch = resolveWorldSpaceMediaChannelV0(RHIZOH_LEARNING_CHANNEL_ID_V0);
    expect(ch.type).toBe("chess_cluster_live");
    expect(ch.titleTr).toContain("Öğrenme");
  });

  it("world sports channel defaults to world_sports_feed without env video", () => {
    const ch = buildRhizohWorldSportsChannelV0();
    expect(ch.id).toBe(RHIZOH_WORLDSPORTS_CHANNEL_ID_V0);
    expect(ch.type).toBe("world_sports_feed");
    expect(ch.titleEn).toBe("WorldSports");
  });

  it("channel pack snapshot exposes env keys", () => {
    const snap = getWorldSpaceMediaChannelPackSnapshotV0();
    expect(snap).toHaveProperty("channelCount");
    expect(snap).toHaveProperty("fullEmbedEndSec");
  });
});
