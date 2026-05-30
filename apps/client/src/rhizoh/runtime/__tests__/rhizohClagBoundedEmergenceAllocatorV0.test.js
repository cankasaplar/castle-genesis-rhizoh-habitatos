import { describe, it, expect, beforeEach } from "vitest";
import { allocateBoundedEmergenceV0 } from "../rhizohClagBoundedEmergenceAllocatorV0.js";
import { resetTemporalBeaStateV0 } from "../rhizohClagTemporalBeaV0.js";
import {
  ingestClagTurnContextV0,
  resetClagGraphV0,
  CLAG_NODE_KIND_V0
} from "../rhizohCrossLayerAwarenessGraphV0.js";
import { CLAG_ACTIVE_RUNTIME_NODE_ID_V0 } from "../rhizohClagNodeRegistryV0.js";
import { RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 } from "../../spatial/geographicAnchorsV0.js";

describe("rhizohClagBoundedEmergenceAllocatorV0", () => {
  it("allocates sovereign cross-resonance between two active nodes", () => {
    const bea = allocateBoundedEmergenceV0({
      nodes: [
        {
          kind: CLAG_NODE_KIND_V0.REAL_LIFE,
          meta: {
            registryRole: "active_runtime",
            registryId: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA
          }
        },
        {
          kind: CLAG_NODE_KIND_V0.REAL_LIFE,
          meta: {
            registryRole: "active_runtime",
            registryId: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY
          }
        }
      ],
      edges: [],
      graphContamination: { detected: false }
    });
    expect(bea.controlledResonance.length).toBeGreaterThanOrEqual(1);
    expect(bea.controlledResonance[0].label).toBe("sovereign_cross_resonance");
    expect(bea.emergenceBudgetRemaining).toBeLessThan(bea.resonanceBudget01);
    expect(bea.executionApplied).toBe(false);
  });

  it("halves budget under contamination regime", () => {
    const clean = allocateBoundedEmergenceV0({ nodes: [], graphContamination: { detected: false } });
    const dirty = allocateBoundedEmergenceV0({ nodes: [], graphContamination: { detected: true } });
    expect(dirty.resonanceBudget01).toBeLessThan(clean.resonanceBudget01);
    expect(dirty.regime).toBe("contaminated_capped");
  });
});

describe("CLAG graph includes BEA", () => {
  beforeEach(() => resetClagGraphV0());

  it("attaches boundedEmergence to graph build", () => {
    const graph = ingestClagTurnContextV0({
      calibrationAnchorReference: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
    });
    expect(graph.boundedEmergence?.schema).toContain("bounded_emergence");
    expect(graph.boundedEmergence?.controlledResonance?.length).toBeGreaterThan(0);
    expect(graph.boundedEmergence?.temporal?.schema).toContain("temporal");
  });
});
