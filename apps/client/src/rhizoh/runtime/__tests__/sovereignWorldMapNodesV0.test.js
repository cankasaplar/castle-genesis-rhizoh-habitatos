import { describe, expect, it } from "vitest";
import {
  buildRemoteCastleMapNodesV0,
  dispatchSovereignVoiceWarpV0,
  listSovereignWorldMapNodesForViewV0,
  parseSovereignVoiceWarpCommandV0,
  RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1,
  SOVEREIGN_TOWER_GRAPH_EDGES_V0,
  SOVEREIGN_TOWERS_V0,
  SOVEREIGN_WORLD_MAP_NODES_V0,
  tryExecuteSovereignVoiceWarpFromTextV0,
  tryOpenSovereignMediaTubeFromTextV0,
  writeSovereignPortalCoordsV0
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

  it("builds remote castle nodes with presence state colors", () => {
    const nodes = buildRemoteCastleMapNodesV0([
      {
        id: "uid_a",
        lat: 41.01,
        lon: 28.99,
        displayName: "Peer A",
        presenceState: "BROADCASTING",
        presenceViewers: 4,
        presenceRegion: "TR"
      },
      { id: "uid_b", lat: NaN, lon: 29 }
    ]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("remote_castle");
    expect(nodes[0].color).toBe("#a855f7");
    expect(nodes[0].label).toBe("LIVE");
    expect(nodes[0].presenceViewers).toBe(4);
    expect(nodes[0].uid).toBe("uid_a");
  });

  it("pins portal near user castle when castle is anchored", () => {
    const withUser = listSovereignWorldMapNodesForViewV0({
      userCastle: { lat: 41.01, lon: 28.99, label: "My Castle" }
    });
    const portal = withUser.find((n) => n.id === "rhizoh_portal");
    expect(portal).toBeTruthy();
    expect(portal.lat).toBeCloseTo(41.0112, 4);
    expect(portal.lon).toBeCloseTo(28.9918, 4);
    expect(withUser.some((n) => n.id === "my_castle")).toBe(true);
    const withoutUser = listSovereignWorldMapNodesForViewV0();
    expect(withoutUser.some((n) => n.id === "rhizoh_portal")).toBe(true);
  });

  it("hides demo castle hub until user anchors", () => {
    const withoutUser = listSovereignWorldMapNodesForViewV0();
    expect(withoutUser.some((n) => n.id === "castle")).toBe(false);
    expect(withoutUser.some((n) => n.id === "my_castle")).toBe(false);
    const withUser = listSovereignWorldMapNodesForViewV0({
      userCastle: { lat: 41.01, lon: 28.99, label: "Test Castle" }
    });
    expect(withUser.some((n) => n.id === "my_castle")).toBe(true);
  });

  it("builds tower graph edges", () => {
    expect(SOVEREIGN_TOWER_GRAPH_EDGES_V0.length).toBeGreaterThan(0);
  });

  it("parses voice warp targets", () => {
    const paris = parseSovereignVoiceWarpCommandV0("paris git");
    expect(paris?.name).toContain("Mistral");
    const gemini = parseSovereignVoiceWarpCommandV0("gemini");
    expect(gemini?.lat).toBeCloseTo(37.422, 2);
    const istanbul = parseSovereignVoiceWarpCommandV0("istanbul git");
    expect(istanbul?.name).toContain("Castle");
  });

  it("executes voice warp and media open from text", () => {
    const warpEvents = [];
    const mediaEvents = [];
    window.addEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, (ev) => warpEvents.push(ev.detail));
    window.addEventListener("RHIZOH_OPEN_MEDIA_TUBE", (ev) => mediaEvents.push(ev.detail));

    writeSovereignPortalCoordsV0(41.01, 28.99);
    const warp = tryExecuteSovereignVoiceWarpFromTextV0("paris git", { tr: true });
    expect(warp?.ok).toBe(true);
    expect(warpEvents[0]?.name).toContain("Mistral");

    dispatchSovereignVoiceWarpV0({ lat: 41.045, lon: 29.006, name: "Castle" }, "test");
    expect(warpEvents[1]?.lat).toBeCloseTo(41.045, 3);

    const media = tryOpenSovereignMediaTubeFromTextV0("yayın aç", { tr: true });
    expect(media?.ok).toBe(true);
    expect(mediaEvents[0]?.title).toContain("Kuantum");
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
