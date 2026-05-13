import { describe, expect, it } from "vitest";
import {
  buildHubLiveContextHref,
  GENESIS_HUB_QUERY_CONTEXT_SCHEMA,
  parseHubLiveContextSearch,
  hubScrollTargetForAnchor,
  buildGenesisContinuityEventArchiveQueryUrl,
  buildGenesisReplayRouterUrl,
  buildGenesisReplayTemporalDiffUrl
} from "./genesisHubQueryContextV1.js";

describe("genesisHubQueryContextV1", () => {
  it("buildHubLiveContextHref round-trips parseHubLiveContextSearch", () => {
    expect(GENESIS_HUB_QUERY_CONTEXT_SCHEMA).toContain("hub_query");
    const href = buildHubLiveContextHref({
      anchor: "tick-advanced",
      eventType: "TickAdvanced",
      seqMin: 1200,
      seqMax: 1800,
      window: 20
    });
    expect(href).toContain("/genesis/hub?");
    const q = href.split("?")[1] || "";
    const ctx = parseHubLiveContextSearch(`?${q}`);
    expect(ctx).not.toBeNull();
    expect(ctx?.anchor).toBe("tick-advanced");
    expect(ctx?.eventType).toBe("TickAdvanced");
    expect(ctx?.seqMin).toBe(1200);
    expect(ctx?.seqMax).toBe(1800);
    expect(ctx?.window).toBe(20);
  });

  it("parseHubLiveContextSearch returns null without ctx=1", () => {
    expect(parseHubLiveContextSearch("?a=tick")).toBeNull();
  });

  it("hubScrollTargetForAnchor maps panels", () => {
    expect(hubScrollTargetForAnchor("runtime-surface")).toBe("hub-runtime-panel");
    expect(hubScrollTargetForAnchor("tick-advanced")).toBe("hub-continuity-panel");
    expect(hubScrollTargetForAnchor("diagnostics")).toBe("hub-diagnostics-panel");
    expect(hubScrollTargetForAnchor("temporal-field-map")).toBe("hub-temporal-field-map");
  });

  it("buildGenesisReplayRouterUrl builds replay query", () => {
    expect(buildGenesisReplayRouterUrl("https://g.example", { from: 1, to: 10, type: "TickAdvanced" })).toBe(
      "https://g.example/rhizoh/genesis/replay?from=1&to=10&type=TickAdvanced"
    );
    expect(buildGenesisReplayRouterUrl("https://g.example", { from: 2, to: 3, checkpoints: false })).toBe(
      "https://g.example/rhizoh/genesis/replay?from=2&to=3&checkpoints=0"
    );
  });

  it("buildGenesisReplayTemporalDiffUrl builds diff query", () => {
    expect(buildGenesisReplayTemporalDiffUrl("https://g.example", { from: 5, to: 20 })).toBe(
      "https://g.example/rhizoh/genesis/replay/diff?from=5&to=20"
    );
  });
});
