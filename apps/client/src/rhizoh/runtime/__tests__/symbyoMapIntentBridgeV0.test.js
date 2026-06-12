import { describe, expect, it } from "vitest";
import {
  createSymbyoMapIntentV0,
  ORCHESTRATOR_ACTION_REGISTRY_V0,
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_INTENT_SCHEMA_V0,
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

    expect(Object.keys(routed.intent).sort()).toEqual([...SYMBYO_MAP_INTENT_SCHEMA_V0].sort());
    expect(routed.intent.intent).toBe(SYMBYO_MAP_INTENT_TYPE_V0.ENTER_NODE);
    expect(routed.intent.nodeId).toMatch(/^[0-9a-f]{8}$/);
    expect(routed.intent.context).toBe("map:castle:click");
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);
    expect(routed.normalizedDecision.refs.every((ref) => ref.startsWith("ptr_"))).toBe(true);
    expect(routed.sideEffects).toEqual([]);
    expect(JSON.stringify(routed)).not.toContain("Human label");
  });

  it("keeps hover as preview intent and does not decide media execution", () => {
    const intent = createSymbyoMapIntentV0({
      interaction: "hover",
      node: { id: "library", type: "vault" }
    });

    expect(Object.keys(intent).sort()).toEqual([...SYMBYO_MAP_INTENT_SCHEMA_V0].sort());
    expect(intent.intent).toBe(SYMBYO_MAP_INTENT_TYPE_V0.PREVIEW_NODE);
    expect(intent.nodeId).toMatch(/^[0-9a-f]{8}$/);
    expect(intent.context).toBe("map:vault:hover");
  });

  it("keeps orchestrator actions inside the frozen registry", () => {
    expect(Object.values(ORCHESTRATOR_ACTION_REGISTRY_V0).sort()).toEqual(
      ["ATTACH_VOICE_STREAM", "ENTER_CASTLE", "LOAD_WORLD_NODE", "OPEN_MEDIA_PLAYER"].sort()
    );
  });

  it("routes tower node click to media workspace", () => {
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "claude_tower", type: "tower" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);
  });
});
