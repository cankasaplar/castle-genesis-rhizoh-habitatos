import { describe, expect, it } from "vitest";
import { buildGenesisEndpointUrls, GENESIS_NETWORK_RESOLVER_SCHEMA } from "./genesisNetworkResolverV1.js";

describe("genesisNetworkResolverV1", () => {
  it("buildGenesisEndpointUrls maps gateway origin to protocol surfaces", () => {
    const u = buildGenesisEndpointUrls("https://gw.example.com");
    expect(u.origin).toBe("https://gw.example.com");
    expect(u.runtimeUrl).toBe("https://gw.example.com/rhizoh/genesis/runtime");
    expect(u.streamUrl).toBe("https://gw.example.com/rhizoh/genesis/stream");
    expect(u.checkpointLatestUrl).toBe("https://gw.example.com/rhizoh/genesis/checkpoint/latest");
    expect(u.checkpointBySeqUrl(42)).toBe("https://gw.example.com/rhizoh/genesis/checkpoint/by-seq/42");
    expect(u.checkpointRangeUrl(1, 3)).toContain("from=1");
    expect(u.checkpointRangeUrl(1, 3)).toContain("to=3");
    expect(u.checkpointLineageUrl(9)).toContain("seq=9");
    expect(GENESIS_NETWORK_RESOLVER_SCHEMA).toContain("network_resolver");
  });

  it("strips trailing slash on origin segment", () => {
    const u = buildGenesisEndpointUrls("https://gw.example.com/");
    expect(u.runtimeUrl).toBe("https://gw.example.com/rhizoh/genesis/runtime");
  });
});
