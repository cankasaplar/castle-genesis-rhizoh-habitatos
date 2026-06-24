import { describe, expect, it } from "vitest";
import {
  buildYoutubeEmbedUrlV0,
  buildYoutubeLiveChannelEmbedUrlV0,
  CASTLE_GENESIS_LIVE_PAGE_V0,
  CASTLE_GENESIS_YOUTUBE_CHANNEL_ID_V0,
  getWorldSpaceMediaChannelPackSnapshotV0,
  listWorldSpaceMediaChannelsV0,
  NASA_ISS_EARTH_VIDEO_ID_V0,
  NASA_TV_YOUTUBE_CHANNEL_ID_V0,
  resolveInitialWorldSpaceMediaChannelIdV0,
  resolveWorldSpaceMediaChannelForMapNodeV0,
  resolveWorldSpaceMediaChannelV0,
  RHIZOH_LEARNING_CHANNEL_ID_V0,
  RHIZOH_GO_LEARNING_CHANNEL_ID_V0,
  RHIZOH_WORLDSPORTS_CHANNEL_ID_V0,
  RHIZOH_WORLD_NEWS_CHANNEL_ID_V0,
  buildRhizohWorldSportsChannelV0,
  buildRhizohWorldNewsChannelV0
} from "../worldSpaceMediaChannelsV0.js";

describe("worldSpaceMediaChannelsV0", () => {
  it("lists full media channel pack (14 rows) including go learning and academy B-roll", () => {
    const rows = listWorldSpaceMediaChannelsV0();
    const ids = rows.map((r) => r.id);
    expect(ids).toHaveLength(14);
    expect(ids[0]).toBe("castle_genesis");
    expect(ids).toContain(RHIZOH_LEARNING_CHANNEL_ID_V0);
    expect(ids).toContain(RHIZOH_GO_LEARNING_CHANNEL_ID_V0);
    expect(ids).toContain(RHIZOH_WORLDSPORTS_CHANNEL_ID_V0);
    expect(ids).toContain(RHIZOH_WORLD_NEWS_CHANNEL_ID_V0);
    expect(ids).toContain("castle_genesis_live");
    expect(ids).toContain("castle_chess");
    expect(ids).toContain("castle_go");
    expect(ids).toContain("castle_checkers");
    expect(ids).toContain("castle_architecture");
    expect(ids).toContain("castle_manifesto_trim");
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
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:worldsports")).toBe(
      RHIZOH_WORLDSPORTS_CHANNEL_ID_V0
    );
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:go")).toBe(RHIZOH_GO_LEARNING_CHANNEL_ID_V0);
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:checkers")).toBe("castle_checkers");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:worldnews")).toBe(
      RHIZOH_WORLD_NEWS_CHANNEL_ID_V0
    );
  });

  it("maps sovereign pins to distinct media channels", () => {
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "my_castle", type: "castle" })).toBe(
      "castle_genesis"
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "worldsports", type: "zone" })).toBe(
      RHIZOH_WORLDSPORTS_CHANNEL_ID_V0
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "worldnews", type: "zone" })).toBe(
      RHIZOH_WORLD_NEWS_CHANNEL_ID_V0
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

  it("go learning channel is go_cluster_live type", () => {
    const ch = resolveWorldSpaceMediaChannelV0(RHIZOH_GO_LEARNING_CHANNEL_ID_V0);
    expect(ch.type).toBe("go_cluster_live");
    expect(ch.titleTr).toContain("Go");
  });

  it("castle chess fallback uses live cluster when no VOD env", () => {
    const ch = resolveWorldSpaceMediaChannelV0("castle_chess");
    expect(ch.id).toBe("castle_chess");
    expect(ch.type).toBe("chess_cluster_live");
  });

  it("castle genesis uses live youtube embed fallback when channel id baked", () => {
    const ch = resolveWorldSpaceMediaChannelV0("castle_genesis");
    expect(ch.type).toBe("youtube");
    expect(ch.url).toContain(CASTLE_GENESIS_YOUTUBE_CHANNEL_ID_V0);
  });

  it("world news channel defaults to world_news_feed without env video", () => {
    const ch = buildRhizohWorldNewsChannelV0();
    expect(ch.id).toBe(RHIZOH_WORLD_NEWS_CHANNEL_ID_V0);
    expect(ch.type).toBe("world_news_feed");
    expect(ch.titleEn).toBe("World News");
  });

  it("world sports channel defaults to world_sports_feed without env video", () => {
    const ch = buildRhizohWorldSportsChannelV0();
    expect(ch.id).toBe(RHIZOH_WORLDSPORTS_CHANNEL_ID_V0);
    expect(ch.type).toBe("world_sports_feed");
    expect(ch.titleEn).toBe("WorldSports");
  });

  it("castle go and checkers use holding slides without VOD env", () => {
    const go = resolveWorldSpaceMediaChannelV0("castle_go");
    const checkers = resolveWorldSpaceMediaChannelV0("castle_checkers");
    expect(go.holdingSlide).toContain("go-embed-slide");
    expect(checkers.holdingSlide).toContain("checkers-embed-slide");
  });

  it("channel pack snapshot exposes env keys", () => {
    const snap = getWorldSpaceMediaChannelPackSnapshotV0();
    expect(snap).toHaveProperty("channelCount");
    expect(snap.channelCount).toBe(14);
    expect(snap).toHaveProperty("goVideoId");
    expect(snap).toHaveProperty("checkersVideoId");
    expect(snap).toHaveProperty("fullEmbedEndSec");
  });
});
