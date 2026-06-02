import { describe, expect, it, vi, afterEach } from "vitest";
import {
  coalesceValidGatewayUrl,
  DEFAULT_LIVE_GATEWAY_BASE,
  getCastleFlightConfig,
  getGenesisProtocolGatewayOrigin,
  isInvalidBakedGatewayUrl
} from "./castleFlightConfig.js";

describe("castleFlightConfig gateway URL hygiene", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("flags doc placeholder hosts", () => {
    expect(isInvalidBakedGatewayUrl("https://xxx.onrender.com/rhizoh/llm")).toBe(true);
    expect(isInvalidBakedGatewayUrl("https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm")).toBe(false);
  });

  it("coalesceValidGatewayUrl replaces placeholder with canonical base", () => {
    expect(coalesceValidGatewayUrl("https://xxx.onrender.com/rhizoh/llm")).toBe(DEFAULT_LIVE_GATEWAY_BASE);
  });

  it("getCastleFlightConfig ignores baked xxx.onrender.com on production host", () => {
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://xxx.onrender.com/rhizoh/llm");
    vi.stubEnv("VITE_LIVE_GATEWAY_BASE", "https://xxx.onrender.com");
    vi.stubGlobal("window", { location: { hostname: "www.rhizoh.com", origin: "https://www.rhizoh.com", href: "https://www.rhizoh.com/" } });
    const cfg = getCastleFlightConfig();
    expect(cfg.rhizohLlmHttp).toContain("castle-genesis-rhizoh-habitatos.onrender.com");
  });

  it("getGenesisProtocolGatewayOrigin never returns xxx host", () => {
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://xxx.onrender.com/rhizoh/llm");
    vi.stubGlobal("window", { location: { hostname: "www.rhizoh.com", origin: "https://www.rhizoh.com", href: "https://www.rhizoh.com/" } });
    const origin = getGenesisProtocolGatewayOrigin();
    expect(origin).toContain("castle-genesis-rhizoh-habitatos.onrender.com");
    expect(origin).not.toContain("xxx.onrender.com");
  });
});
