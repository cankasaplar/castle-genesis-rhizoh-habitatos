import { describe, expect, it } from "vitest";
import {
  createSymbyoMapIntentV0,
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_ACTION_V0,
  SYMBYO_MAP_INTENT_TYPE_V0
} from "../symbyoMapIntentBridgeV0.js";

describe("symbyoMapIntentBridgeV0", () => {
  it("turns a map node click into intent without executing UI side effects", () => {
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: {
        id: "castle_12",
        type: "castle",
        capabilities: ["media", "voice", "3d", "inventory"],
        name: "Human label must not be required"
      }
    });

    expect(routed.intent.intentType).toBe(SYMBYO_MAP_INTENT_TYPE_V0.ENTER_NODE);
    expect(routed.intent.decisionAuthority).toBe("orchestrator");
    expect(routed.intent.rendererAuthority).toBe(false);
    expect(routed.normalizedDecision.decision).toBe(SYMBYO_MAP_ACTION_V0.OPEN_MEDIA_PLAYER);
    expect(routed.normalizedDecision.refs.every((ref) => ref.startsWith("ptr_"))).toBe(true);
    expect(routed.sideEffects).toEqual([]);
    expect(JSON.stringify(routed)).not.toContain("Human label");
  });

  it("keeps hover as preview intent and does not decide media execution", () => {
    const intent = createSymbyoMapIntentV0({
      interaction: "hover",
      node: { id: "library", type: "vault" }
    });

    expect(intent.intentType).toBe(SYMBYO_MAP_INTENT_TYPE_V0.PREVIEW_NODE);
    expect(intent.payloadRef).toMatch(/^ptr_/);
    expect(intent.entityRef).toMatch(/^ptr_/);
  });
});
