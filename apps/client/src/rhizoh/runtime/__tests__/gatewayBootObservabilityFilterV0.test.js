import { describe, expect, it } from "vitest";
import {
  GATEWAY_BOOT_WARMING_WINDOW_MS,
  mapGatewaySemanticStateV0,
  resolveGatewayBootObservabilityLogV0
} from "../gatewayBootObservabilityFilterV0.js";

describe("gatewayBootObservabilityFilterV0", () => {
  it("maps boot offline to warming_up within window", () => {
    const log = resolveGatewayBootObservabilityLogV0({
      phase: "offline",
      everConnected: false,
      sinceNavMs: 6_700,
      reconnectAttempts: 2
    });
    expect(log?.event).toBe("app.gateway.warming_up");
    expect(log?.suppressed_false_offline).toBe(true);
    expect(log?.level).toBe("ok");
  });

  it("keeps real offline after boot band", () => {
    const log = resolveGatewayBootObservabilityLogV0({
      phase: "offline",
      everConnected: true,
      sinceNavMs: 120_000,
      reconnectAttempts: 6
    });
    expect(log?.event).toBe("app.gateway.offline");
    expect(log?.semantic).toBe("offline");
  });

  it("logs uncertain as soft state", () => {
    const log = resolveGatewayBootObservabilityLogV0({ phase: "uncertain" });
    expect(log?.event).toBe("app.gateway.uncertain");
    expect(log?.semantic).toBe("uncertain");
  });

  it("mapGatewaySemanticStateV0 aligns with Log #2 boot band", () => {
    const sem = mapGatewaySemanticStateV0("offline", {
      everConnected: false,
      sinceNavMs: 14_744,
      reconnectAttempts: 4
    });
    expect(sem.state).toBe("warming_up");
    expect(sem.suppressed_false_offline).toBe(true);
  });

  it("exports warming window constant", () => {
    expect(GATEWAY_BOOT_WARMING_WINDOW_MS).toBe(25_000);
  });
});
