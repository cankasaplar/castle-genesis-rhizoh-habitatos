import { describe, expect, it, beforeEach } from "vitest";
import { GATEWAY_EVENT_SOURCE_V0 } from "@castle/protocol";
import {
  mountTowerGatewayCitizenshipConsoleV0,
  resetTowerGatewayCitizenshipClientForTestV0,
  resolveTowerWorldContextV0
} from "../towerGatewayCitizenshipV0.js";
import {
  buildRhizohObservationStateV1,
  recordTowerObservationV1,
  resetBroadcastVisibilityForTestV1
} from "../rhizohObservationStateV1.js";

describe("towerGatewayCitizenshipV0", () => {
  beforeEach(() => {
    resetTowerGatewayCitizenshipClientForTestV0();
    resetBroadcastVisibilityForTestV1();
    globalThis.window = /** @type {any} */ ({
      location: { hostname: "localhost", pathname: "/" },
      __rhizoh: {}
    });
  });

  it("resolveTowerWorldContextV0 binds tower id", () => {
    const ctx = resolveTowerWorldContextV0({ towerId: "gemini_tower" });
    expect(ctx.source).toBe(GATEWAY_EVENT_SOURCE_V0.TOWER);
    expect(ctx.towerId).toBe("gemini_tower");
    expect(ctx.sessionId).toBe("gemini_tower");
  });

  it("mountTowerGatewayCitizenshipConsoleV0 exposes ensure API", () => {
    mountTowerGatewayCitizenshipConsoleV0();
    expect(typeof globalThis.window.__rhizoh.towerGateway.ensure).toBe("function");
    expect(typeof globalThis.window.__rhizoh.towerGateway.registerAll).toBe("function");
  });

  it("recordTowerObservationV1 surfaces towers slice", () => {
    recordTowerObservationV1({
      registered: true,
      towerId: "claude_tower",
      registeredTowerIds: ["gemini_tower", "claude_tower"]
    });
    const snap = buildRhizohObservationStateV1();
    expect(snap.towers.registeredCount).toBe(2);
    expect(snap.towers.citizenship).toBe("partial");
    expect(snap.towers.registeredTowerIds).toContain("claude_tower");
  });
});
