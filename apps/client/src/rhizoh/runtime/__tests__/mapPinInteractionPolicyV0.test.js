import { describe, expect, it } from "vitest";
import {
  MAP_PIN_CLICK_MODE_V0,
  resolveMapPinClickModeV0,
  shouldMapPinDispatchImmediatelyV0,
  isPanelOrchestratorActionV0
} from "../mapPinInteractionPolicyV0.js";
import { ORCHESTRATOR_ACTION_REGISTRY_V0 } from "../symbyoMapIntentBridgeV0.js";

describe("mapPinInteractionPolicyV0", () => {
  it("library vault opens immediately", () => {
    const node = { id: "library", type: "vault" };
    expect(resolveMapPinClickModeV0(node)).toBe(MAP_PIN_CLICK_MODE_V0.IMMEDIATE);
    expect(shouldMapPinDispatchImmediatelyV0(node)).toBe(true);
  });

  it("chess arena and towers open immediately", () => {
    expect(shouldMapPinDispatchImmediatelyV0({ id: "chess_arena", type: "zone" })).toBe(true);
    expect(shouldMapPinDispatchImmediatelyV0({ id: "gemini_tower", type: "tower" })).toBe(true);
  });

  it("spiralmmo and remote castle open immediately", () => {
    expect(shouldMapPinDispatchImmediatelyV0({ id: "spiralmmo_europe", type: "spiralmmo" })).toBe(
      true
    );
    expect(shouldMapPinDispatchImmediatelyV0({ id: "peer_1", type: "remote_castle" })).toBe(true);
  });

  it("unknown node keeps approach mode", () => {
    expect(resolveMapPinClickModeV0({ id: "custom_pin", type: "node" })).toBe(
      MAP_PIN_CLICK_MODE_V0.APPROACH
    );
  });

  it("isPanelOrchestratorActionV0 recognizes panel actions", () => {
    expect(isPanelOrchestratorActionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_LIBRARY)).toBe(true);
    expect(isPanelOrchestratorActionV0(ORCHESTRATOR_ACTION_REGISTRY_V0.LOAD_WORLD_NODE)).toBe(
      false
    );
  });
});
