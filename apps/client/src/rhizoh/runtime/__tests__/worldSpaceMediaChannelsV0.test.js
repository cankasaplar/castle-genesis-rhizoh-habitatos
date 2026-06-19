import { describe, expect, it } from "vitest";
import {
  buildYoutubeEmbedUrlV0,
  CASTLE_GENESIS_LIVE_PAGE_V0,
  getWorldSpaceMediaChannelPackSnapshotV0,
  listWorldSpaceMediaChannelsV0,
  resolveInitialWorldSpaceMediaChannelIdV0,
  resolveWorldSpaceMediaChannelForMapNodeV0,
  resolveWorldSpaceMediaChannelV0
} from "../worldSpaceMediaChannelsV0.js";

describe("worldSpaceMediaChannelsV0", () => {
  it("lists castle genesis, chess placeholder, nasa, lofi, local", () => {
    const rows = listWorldSpaceMediaChannelsV0();
    const ids = rows.map((r) => r.id);
    expect(ids[0]).toBe("castle_genesis");
    expect(ids).toContain("castle_chess");
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
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:chess")).toBe("castle_chess");
  });

  it("maps sovereign pins to distinct media channels", () => {
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "my_castle", type: "castle" })).toBe(
      "castle_genesis"
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "chess", type: "zone" })).toBe(
      "castle_chess"
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "event", type: "zone" })).toBe("nasa");
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "radio", type: "broadcast" })).toBe("lofi");
  });

  it("castle genesis links to live page", () => {
    const ch = resolveWorldSpaceMediaChannelV0("castle_genesis");
    expect(ch.livePageUrl || ch.url).toContain("CastleGenesis");
  });

  it("nasa channel has iss fallback", () => {
    const ch = resolveWorldSpaceMediaChannelV0("nasa");
    expect(ch.url).toContain("iYmvCUonukw");
    expect(ch.fallbackUrl).toContain("21X5lGlDOfg");
  });

  it("castle chess uses holding slide when no env video id", () => {
    const ch = resolveWorldSpaceMediaChannelV0("castle_chess");
    if (ch.type === "castle_genesis_live") {
      expect(ch.holdingSlide).toContain("chess");
    }
  });

  it("channel pack snapshot exposes env keys", () => {
    const snap = getWorldSpaceMediaChannelPackSnapshotV0();
    expect(snap).toHaveProperty("channelCount");
    expect(snap).toHaveProperty("fullEmbedEndSec");
  });
});
