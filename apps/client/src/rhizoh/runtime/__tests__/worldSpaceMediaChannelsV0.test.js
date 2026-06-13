import { describe, expect, it } from "vitest";
import {
  buildYoutubeEmbedUrlV0,
  CASTLE_GENESIS_LIVE_PAGE_V0,
  listWorldSpaceMediaChannelsV0,
  resolveInitialWorldSpaceMediaChannelIdV0,
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
    expect(resolveInitialWorldSpaceMediaChannelIdV0("map_orchestrator")).toBe("nasa");
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
