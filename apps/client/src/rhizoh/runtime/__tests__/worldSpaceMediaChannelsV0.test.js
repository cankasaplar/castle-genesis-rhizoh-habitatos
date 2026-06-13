import { describe, expect, it } from "vitest";
import {
  buildYoutubeEmbedUrlV0,
  CASTLE_GENESIS_LIVE_PAGE_V0,
  listWorldSpaceMediaChannelsV0,
  resolveInitialWorldSpaceMediaChannelIdV0,
  resolveWorldSpaceMediaChannelForMapNodeV0,
  resolveWorldSpaceMediaChannelV0
} from "../worldSpaceMediaChannelsV0.js";

describe("worldSpaceMediaChannelsV0", () => {
  it("lists castle genesis, nasa, lofi, local", () => {
    const rows = listWorldSpaceMediaChannelsV0();
    expect(rows.map((r) => r.id)).toEqual(["castle_genesis", "nasa", "lofi", "local"]);
  });

  it("builds youtube-nocookie embed", () => {
    expect(buildYoutubeEmbedUrlV0("abc123")).toContain("youtube-nocookie.com/embed/abc123");
  });

  it("resolves initial channel by source", () => {
    expect(resolveInitialWorldSpaceMediaChannelIdV0("castle_init_map")).toBe("castle_genesis");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:event")).toBe("nasa");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:radio")).toBe("lofi");
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map:node:my_castle")).toBe("castle_genesis");
  });

  it("maps sovereign pins to distinct media channels", () => {
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "my_castle", type: "castle" })).toBe(
      "castle_genesis"
    );
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "event", type: "zone" })).toBe("nasa");
    expect(resolveWorldSpaceMediaChannelForMapNodeV0({ id: "radio", type: "broadcast" })).toBe("lofi");
  });

  it("castle genesis links to live page", () => {
    const ch = resolveWorldSpaceMediaChannelV0("castle_genesis");
    expect(ch.livePageUrl || ch.url).toBe(CASTLE_GENESIS_LIVE_PAGE_V0);
  });

  it("nasa channel has iss fallback", () => {
    const ch = resolveWorldSpaceMediaChannelV0("nasa");
    expect(ch.url).toContain("iYmvCUonukw");
    expect(ch.fallbackUrl).toContain("21X5lGlDOfg");
  });
});
