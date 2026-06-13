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
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.ENTER_CASTLE);
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
      [
        "ATTACH_VOICE_STREAM",
        "ENTER_CASTLE",
        "LOAD_WORLD_NODE",
        "OPEN_CHESS_ARENA",
        "OPEN_LIBRARY",
        "OPEN_MEDIA_PLAYER",
        "OPEN_TOWER_PORTAL",
        "OPEN_WORKSPACE"
      ].sort()
    );
  });

  it("routes tower node click to workspace", () => {
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "claude_tower", type: "tower" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_WORKSPACE);
  });

  it("routes chess arena to chess workspace", () => {
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "chess_arena", type: "zone" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_CHESS_ARENA);
  });

  it("routes library vault to library panel", () => {
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "library", type: "vault" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_LIBRARY);
  });

  it("routes rhizoh portal to tower portal discovery", () => {
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "rhizoh_portal", type: "portal" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_TOWER_PORTAL);
  });

  it("routes map pins to distinct media decisions", () => {
    const myCastle = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "my_castle", type: "castle" }
    });
    expect(myCastle.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);

    const event = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "event", type: "zone" }
    });
    expect(event.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);

    const radio = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: "click",
      node: { id: "radio", type: "broadcast" }
    });
    expect(radio.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);
  });
});
