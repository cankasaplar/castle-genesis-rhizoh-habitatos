import { describe, expect, it, vi, afterEach } from "vitest";
import {
  coalesceValidGatewayUrl,
  DEFAULT_LIVE_GATEWAY_BASE,
  getCastleFlightConfig,
  getGenesisProtocolGatewayOrigin,
  resolveGenesisGatewayHttpBaseV0,
  isCastleGenesisFirebasePreviewHostV0,
  isInvalidBakedGatewayUrl,
  shouldUseSameOriginGatewayProxyV0
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
    expect(cfg.rhizohLlmHttp).toBe("https://www.rhizoh.com/api/gatewayProxy/rhizoh/llm");
  });

  it("preview channel uses same-origin gateway proxy", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "castle-genesis--t0-companion-obs-pzyoelen.web.app",
        origin: "https://castle-genesis--t0-companion-obs-pzyoelen.web.app",
        href: "https://castle-genesis--t0-companion-obs-pzyoelen.web.app/"
      }
    });
    expect(isCastleGenesisFirebasePreviewHostV0("castle-genesis--t0-companion-obs-pzyoelen.web.app")).toBe(true);
    expect(shouldUseSameOriginGatewayProxyV0()).toBe(true);
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");
    const cfg = getCastleFlightConfig();
    expect(cfg.rhizohLlmHttp).toBe(
      "https://castle-genesis--t0-companion-obs-pzyoelen.web.app/api/gatewayProxy/rhizoh/llm"
    );
  });

  it("localhost dev uses vite gateway proxy (any port — CORS safe)", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        host: "localhost:5174",
        origin: "http://localhost:5174",
        href: "http://localhost:5174/",
        protocol: "http:"
      }
    });
    vi.stubEnv("VITE_PREFER_LOCAL_GATEWAY", "0");
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");
    expect(shouldUseSameOriginGatewayProxyV0()).toBe(true);
    const cfg = getCastleFlightConfig();
    expect(cfg.rhizohLlmHttp).toBe("http://localhost:5174/api/gatewayProxy/rhizoh/llm");
    expect(cfg.gatewayWsUrl).toBe("ws://localhost:5174/api/gatewayProxy");
    expect(getGenesisProtocolGatewayOrigin()).toBe("http://localhost:5174/api/gatewayProxy");
    expect(resolveGenesisGatewayHttpBaseV0()).toBe("http://localhost:5174/api/gatewayProxy");
  });

  it("firebase hosting uses HTTP proxy but direct Render WSS (no WS upgrade on gatewayProxyV0)", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "castle-genesis.web.app",
        host: "castle-genesis.web.app",
        origin: "https://castle-genesis.web.app",
        href: "https://castle-genesis.web.app/",
        protocol: "https:"
      }
    });
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");
    vi.stubEnv("VITE_GATEWAY_WS", "wss://castle-genesis-rhizoh-habitatos.onrender.com");
    const cfg = getCastleFlightConfig();
    expect(cfg.rhizohLlmHttp).toBe("https://castle-genesis.web.app/api/gatewayProxy/rhizoh/llm");
    expect(cfg.gatewayWsUrl).toBe("wss://castle-genesis-rhizoh-habitatos.onrender.com");
  });

  it("getGenesisProtocolGatewayOrigin never returns xxx host", () => {
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://xxx.onrender.com/rhizoh/llm");
    vi.stubGlobal("window", { location: { hostname: "www.rhizoh.com", origin: "https://www.rhizoh.com", href: "https://www.rhizoh.com/" } });
    const origin = getGenesisProtocolGatewayOrigin();
    expect(origin).toBe("https://www.rhizoh.com/api/gatewayProxy");
    expect(origin).not.toContain("xxx.onrender.com");
  });
});
