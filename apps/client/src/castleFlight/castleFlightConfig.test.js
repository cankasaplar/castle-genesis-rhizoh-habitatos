import { describe, expect, it, vi, afterEach } from "vitest";
import {
  coalesceValidGatewayUrl,
  DEFAULT_LIVE_GATEWAY_BASE,
  getCastleFlightConfig,
  getGenesisProtocolGatewayOrigin,
  resolveGenesisGatewayHttpBaseV0,
  resolveGenesisSseStreamBaseV0,
  resolveGenesisDirectGatewayOriginV0,
  isGenesisSseBlockedViaGatewayProxyV0,
  isCastleGenesisFirebasePreviewHostV0,
  isInvalidBakedGatewayUrl,
  shouldUseSameOriginGatewayProxyV0
} from "./castleFlightConfig.js";

describe("castleFlightConfig gateway URL hygiene", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals?.();
  });

  it("flags doc placeholder hosts", () => {
    expect(isInvalidBakedGatewayUrl("https://xxx.onrender.com/rhizoh/llm")).toBe(true);
    expect(isInvalidBakedGatewayUrl("https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm")).toBe(false);
  });

  it("coalesceValidGatewayUrl replaces placeholder with canonical base", () => {
    expect(coalesceValidGatewayUrl("https://xxx.onrender.com/rhizoh/llm")).toBe(DEFAULT_LIVE_GATEWAY_BASE);
  });

  it("production host uses proxy routing", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "www.rhizoh.com",
        origin: "https://www.rhizoh.com",
        href: "https://www.rhizoh.com/"
      }
    });

    vi.stubEnv("VITE_GATEWAY_HTTP", "https://xxx.onrender.com/rhizoh/llm");
    vi.stubEnv("VITE_LIVE_GATEWAY_BASE", "https://castle-genesis-rhizoh-habitatos.onrender.com");

    const cfg = getCastleFlightConfig();

    expect(cfg.rhizohLlmHttp).toContain("/api/gatewayProxy/rhizoh/llm");
    expect(cfg.rhizohLlmHttp.startsWith("https://www.rhizoh.com")).toBe(true);
  });

  it("firebase preview channel uses same-origin proxy", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "castle-genesis--t0-companion-obs-pzyoelen.web.app",
        origin: "https://castle-genesis--t0-companion-obs-pzyoelen.web.app",
        href: "https://castle-genesis--t0-companion-obs-pzyoelen.web.app/"
      }
    });

    expect(isCastleGenesisFirebasePreviewHostV0(window.location.hostname)).toBe(true);
    expect(shouldUseSameOriginGatewayProxyV0()).toBe(true);

    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");

    const cfg = getCastleFlightConfig();

    expect(cfg.rhizohLlmHttp).toContain("/api/gatewayProxy/rhizoh/llm");
  });

  it("localhost dev uses vite proxy", () => {
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

    const cfg = getCastleFlightConfig();

    expect(cfg.rhizohLlmHttp).toContain("localhost:5174/api/gatewayProxy/rhizoh/llm");
    expect(cfg.gatewayWsUrl).toContain("localhost:5174");
    expect(getGenesisProtocolGatewayOrigin()).toContain("localhost:5174/api/gatewayProxy");
    expect(resolveGenesisGatewayHttpBaseV0()).toContain("localhost:5174/api/gatewayProxy");
  });

  it("rhizoh.com uses single proxy origin for genesis SSE and poll by default", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "rhizoh.com",
        origin: "https://rhizoh.com",
        href: "https://rhizoh.com/",
        protocol: "https:"
      }
    });

    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");
    vi.stubEnv("VITE_LIVE_GATEWAY_BASE", "https://castle-genesis-rhizoh-habitatos.onrender.com");

    expect(resolveGenesisGatewayHttpBaseV0()).toBe("https://rhizoh.com/api/gatewayProxy");
    expect(resolveGenesisDirectGatewayOriginV0()).toBe(
      "https://castle-genesis-rhizoh-habitatos.onrender.com"
    );
    expect(resolveGenesisSseStreamBaseV0()).toBe("https://rhizoh.com/api/gatewayProxy");
  });

  it("rhizoh.com skips SSE via gatewayProxy by default (poll_only)", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "rhizoh.com",
        origin: "https://rhizoh.com",
        href: "https://rhizoh.com/",
        protocol: "https:"
      }
    });

    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");
    vi.stubEnv("VITE_LIVE_GATEWAY_BASE", "https://castle-genesis-rhizoh-habitatos.onrender.com");

    expect(resolveGenesisGatewayHttpBaseV0()).toBe("https://rhizoh.com/api/gatewayProxy");
    expect(resolveGenesisDirectGatewayOriginV0()).toBe(
      "https://castle-genesis-rhizoh-habitatos.onrender.com"
    );
    expect(resolveGenesisSseStreamBaseV0()).toBe("https://rhizoh.com/api/gatewayProxy");
    expect(isGenesisSseBlockedViaGatewayProxyV0()).toBe(true);
  });

  it("rhizoh.com may use direct Render SSE only when direct fallback is explicitly allowed", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "rhizoh.com",
        origin: "https://rhizoh.com",
        href: "https://rhizoh.com/",
        protocol: "https:"
      }
    });

    vi.stubEnv("VITE_GATEWAY_HTTP", "https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm");
    vi.stubEnv("VITE_LIVE_GATEWAY_BASE", "https://castle-genesis-rhizoh-habitatos.onrender.com");
    vi.stubEnv("VITE_GENESIS_ALLOW_DIRECT_FALLBACK", "1");

    expect(resolveGenesisSseStreamBaseV0()).toBe(
      "https://castle-genesis-rhizoh-habitatos.onrender.com"
    );
  });

  it("firebase hosting uses Render WS directly", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "castle-genesis.web.app",
        origin: "https://castle-genesis.web.app",
        href: "https://castle-genesis.web.app/",
        protocol: "https:"
      }
    });

    vi.stubEnv("VITE_GATEWAY_WS", "wss://castle-genesis-rhizoh-habitatos.onrender.com");

    const cfg = getCastleFlightConfig();

    expect(cfg.gatewayWsUrl).toContain("wss://");
  });

  it("never returns invalid xxx host in genesis origin", () => {
    vi.stubEnv("VITE_GATEWAY_HTTP", "https://xxx.onrender.com/rhizoh/llm");

    vi.stubGlobal("window", {
      location: {
        hostname: "www.rhizoh.com",
        origin: "https://www.rhizoh.com",
        href: "https://www.rhizoh.com/"
      }
    });

    const origin = getGenesisProtocolGatewayOrigin();

    expect(origin).toContain("/api/gatewayProxy");
    expect(origin).not.toContain("xxx.onrender.com");
  });
});
