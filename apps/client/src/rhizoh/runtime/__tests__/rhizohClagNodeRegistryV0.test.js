import { describe, it, expect, beforeEach } from "vitest";
import {
  CLAG_ACTIVE_RUNTIME_NODE_ID_V0,
  CLAG_SIMULATION_NODE_ID_V0,
  getClagActiveNodeRegistryV0,
  getClagFullNodeRegistryV0,
  isClagSimulationGeographicAnchorIdV0,
  filterClagGraphToActiveRuntimeV0,
  resolveClagPrimaryActiveSovereignNodeV0
} from "../rhizohClagNodeRegistryV0.js";
import { ingestClagTurnContextV0, resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 } from "../../spatial/geographicAnchorsV0.js";

describe("rhizohClagNodeRegistryV0", () => {
  it("active registry has exactly two sovereign nodes", () => {
    const active = getClagActiveNodeRegistryV0();
    expect(active).toHaveLength(2);
    expect(active.map((n) => n.id)).toEqual([
      CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA,
      CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY
    ]);
  });

  it("full registry includes Sarıyer as simulation only", () => {
    const full = getClagFullNodeRegistryV0();
    const sariyer = full.find((n) => n.id === CLAG_SIMULATION_NODE_ID_V0.SARIYER_CALIBRATION);
    expect(sariyer?.role).toBe("simulation_calibration");
    expect(isClagSimulationGeographicAnchorIdV0(RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0)).toBe(true);
  });

  it("filters simulation nodes out of runtime graph", () => {
    const view = filterClagGraphToActiveRuntimeV0({
      nodes: [
        {
          id: "real_life:metehan_ankara",
          kind: "real_life",
          meta: { registryId: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA, registryRole: "active_runtime" }
        },
        {
          id: "real_life:anchor_sariyer_stability",
          kind: "real_life",
          meta: {
            registryId: CLAG_SIMULATION_NODE_ID_V0.SARIYER_CALIBRATION,
            registryRole: "simulation_calibration",
            anchor: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
          }
        }
      ],
      edges: [],
      attemptedGeographicAnchor: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
    });
    expect(view.nodes).toHaveLength(1);
    expect(view.graphContamination.detected).toBe(true);
    expect(view.activeSovereignNodeCount).toBe(2);
  });

  it("resolves Metehan persona to Ankara primary", () => {
    const p = resolveClagPrimaryActiveSovereignNodeV0({ persona: { firstName: "Metehan" } });
    expect(p?.id).toBe(CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA);
  });
});

describe("CLAG ingest runtime boundary", () => {
  beforeEach(() => resetClagGraphV0());

  it("runtime graph exposes only active sovereign real_life nodes", () => {
    const graph = ingestClagTurnContextV0({
      calibrationAnchorReference: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0,
      geographicAnchor: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
    });
    const sovereign = graph.nodes.filter((n) => n.kind === "real_life");
    expect(sovereign).toHaveLength(2);
    expect(sovereign.every((n) => n.meta?.registryRole === "active_runtime")).toBe(true);
    expect(sovereign.some((n) => n.label.includes("Sarıyer"))).toBe(false);
    expect(graph.graphContamination.detected).toBe(true);
    expect(graph.activeSovereignNodeCount).toBe(2);
  });
});
