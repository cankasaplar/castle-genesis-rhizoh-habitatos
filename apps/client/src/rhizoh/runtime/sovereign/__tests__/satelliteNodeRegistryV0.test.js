import { describe, expect, it, beforeEach, vi } from "vitest";
import { buildShadowCoherenceEdgesV0 } from "../shadowCoherenceGraphV0.js";
import {
  clearSatelliteNodeRegistryForTestsV0,
  listSatelliteNodesV0
} from "../satelliteNodeRegistryV0.js";
import { buildNonExecutiveTopologyMapV0 } from "../nonExecutiveTopologyMapV0.js";

describe("satelliteNodeRegistryV0 (phase 19)", () => {
  beforeEach(() => {
    clearSatelliteNodeRegistryForTestsV0();
    vi.stubGlobal("window", {});
  });

  it("seeds kadikoy and barcelona presets", () => {
    const nodes = listSatelliteNodesV0();
    expect(nodes.some((n) => n.nodeId === "node:kadikoy_satellite")).toBe(true);
    expect(nodes.some((n) => n.nodeId === "node:barcelona_satellite")).toBe(true);
  });

  it("shadow coherence edges are non-executive", () => {
    const edges = buildShadowCoherenceEdgesV0(listSatelliteNodesV0());
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.every((e) => e.executive === false)).toBe(true);
  });

  it("topology map has signature and no execution write", () => {
    const map = buildNonExecutiveTopologyMapV0();
    expect(map.executive).toBe(false);
    expect(map.executionWrite).toBe(false);
    expect(map.topologyMapSignature.startsWith("epi_topo_map_")).toBe(true);
  });

  it("kadikoy preset is local primary", () => {
    const kadikoy = listSatelliteNodesV0().find((n) => n.nodeId === "node:kadikoy_satellite");
    expect(kadikoy?.localPrimary).toBe(true);
    expect(kadikoy?.zone).toBe("local_primary");
  });
});
