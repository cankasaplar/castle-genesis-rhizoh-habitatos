import { describe, expect, it } from "vitest";
import {
  buildSovereignRegionalBridgeEdgesV0,
  isRegionalMapBridgeNodeV0,
  SOVEREIGN_REGIONAL_BRIDGE_EDGES_V0
} from "../worldMapBridgeGraphV0.js";
import { SOVEREIGN_CORE_NODES_V0 } from "../sovereignWorldMapNodesV0.js";

describe("worldMapBridgeGraphV0", () => {
  it("connects all Istanbul core nodes with colorful edges", () => {
    expect(SOVEREIGN_REGIONAL_BRIDGE_EDGES_V0.length).toBeGreaterThanOrEqual(
      SOVEREIGN_CORE_NODES_V0.length - 1
    );
    expect(SOVEREIGN_REGIONAL_BRIDGE_EDGES_V0.every((e) => e.color)).toBe(true);
  });

  it("builds hub spokes and regional ring", () => {
    const edges = buildSovereignRegionalBridgeEdgesV0();
    expect(edges.some((e) => e.kind === "hub_spoke")).toBe(true);
    expect(edges.some((e) => e.kind === "regional_ring")).toBe(true);
  });

  it("filters regional nodes near Istanbul", () => {
    expect(isRegionalMapBridgeNodeV0(SOVEREIGN_CORE_NODES_V0[0])).toBe(true);
    expect(isRegionalMapBridgeNodeV0({ lat: 0, lon: 0 })).toBe(false);
  });
});
