import { describe, expect, it } from "vitest";
import {
  parseSovereignVoiceWarpCommandV0,
  SOVEREIGN_TOWER_GRAPH_EDGES_V0,
  SOVEREIGN_TOWERS_V0,
  SOVEREIGN_WORLD_MAP_NODES_V0
} from "../sovereignWorldMapNodesV0.js";
import {
  ORCHESTRATOR_ACTION_REGISTRY_V0,
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_INTERACTION_V0
} from "../symbyoMapIntentBridgeV0.js";

describe("sovereignWorldMapNodesV0", () => {
  it("includes core nodes, towers, and portal", () => {
    expect(SOVEREIGN_WORLD_MAP_NODES_V0.length).toBeGreaterThanOrEqual(15);
    expect(SOVEREIGN_TOWERS_V0.length).toBe(7);
    expect(SOVEREIGN_WORLD_MAP_NODES_V0.some((n) => n.id === "castle")).toBe(true);
    expect(SOVEREIGN_WORLD_MAP_NODES_V0.some((n) => n.id === "event")).toBe(true);
    expect(SOVEREIGN_WORLD_MAP_NODES_V0.some((n) => n.id === "gemini_tower")).toBe(true);
    expect(SOVEREIGN_WORLD_MAP_NODES_V0.some((n) => n.id === "rhizoh_portal")).toBe(true);
  });

  it("builds tower graph edges", () => {
    expect(SOVEREIGN_TOWER_GRAPH_EDGES_V0.length).toBeGreaterThan(0);
  });

  it("parses voice warp targets", () => {
    const paris = parseSovereignVoiceWarpCommandV0("paris git");
    expect(paris?.name).toContain("Mistral");
    const gemini = parseSovereignVoiceWarpCommandV0("gemini");
    expect(gemini?.lat).toBeCloseTo(37.422, 2);
  });

  it("routes event zone to media player", () => {
    const eventNode = SOVEREIGN_WORLD_MAP_NODES_V0.find((n) => n.id === "event");
    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: SYMBYO_MAP_INTERACTION_V0.CLICK,
      node: eventNode
    });
    expect(routed.normalizedDecision.decision).toBe(
      ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER
    );
  });
});
