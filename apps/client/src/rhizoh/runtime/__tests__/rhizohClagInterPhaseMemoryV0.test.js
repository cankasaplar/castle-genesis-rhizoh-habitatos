import { describe, it, expect, beforeEach } from "vitest";
import {
  persistInterPhaseMemoryV0,
  resetInterPhaseMemoryV0,
  INTER_PHASE_CARRIER_KIND_V0
} from "../rhizohClagInterPhaseMemoryV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "../rhizohClagTemporalBeaV0.js";
import { ingestClagTurnContextV0, resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { resetTemporalBeaStateV0 } from "../rhizohClagTemporalBeaV0.js";

describe("rhizohClagInterPhaseMemoryV0", () => {
  beforeEach(() => resetInterPhaseMemoryV0());

  it("makes meaning transfer explicit across ticks", () => {
    const m1 = persistInterPhaseMemoryV0({
      sessionId: "sess-ipm",
      revision: 1,
      phaseCouplingGraph: {
        currentPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE,
        phaseTransition: "bootstrap",
        previousPhase: null
      },
      memoryShapingHints: {
        openThreadsBoost: ["thread-a"],
        spatialEcho: "Beşiktaş Serencebey",
        primaryRoute: { chainId: "conversation_memory_shaping" },
        activeSovereignNodes: [
          { registryId: "clag_node:metehan_ankara", label: "Metehan Ankara" }
        ]
      }
    });
    expect(m1.explicitMeaningTransfer.implicitBefore).toBe(false);
    expect(m1.explicitMeaningTransfer.explicitNow).toBe(true);
    expect(m1.semanticCarriers.length).toBeGreaterThan(0);

    const m2 = persistInterPhaseMemoryV0({
      sessionId: "sess-ipm",
      revision: 2,
      phaseCouplingGraph: {
        currentPhase: TEMPORAL_BEA_PHASE_V0.CONSERVE,
        phaseTransition: "accumulate_to_conserve",
        previousPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE
      },
      memoryShapingHints: { openThreadsBoost: ["thread-a"] }
    });
    expect(m2.explicitMeaningTransfer.carriedIntoThisPhase.length).toBeGreaterThan(0);
    expect(m2.phaseMemoryLedger.length).toBe(2);
  });

  it("persists surprise residue after release", () => {
    persistInterPhaseMemoryV0({
      sessionId: "sess-surp",
      phaseCouplingGraph: {
        currentPhase: TEMPORAL_BEA_PHASE_V0.RELEASE,
        phaseTransition: "accumulate_to_release"
      },
      boundedEmergence: { controlledSurpriseInjected: true },
      memoryShapingHints: {}
    });
    const next = persistInterPhaseMemoryV0({
      sessionId: "sess-surp",
      phaseCouplingGraph: {
        currentPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE,
        phaseTransition: "release_to_accumulate",
        previousPhase: TEMPORAL_BEA_PHASE_V0.RELEASE
      },
      memoryShapingHints: {}
    });
    const residue = next.semanticCarriers.filter(
      (c) => c.kind === INTER_PHASE_CARRIER_KIND_V0.SURPRISE_RESIDUE
    );
    expect(residue.length).toBeGreaterThan(0);
  });
});

describe("CLAG graph interPhaseMemory", () => {
  beforeEach(() => {
    resetClagGraphV0();
    resetTemporalBeaStateV0();
    resetInterPhaseMemoryV0();
  });

  it("attaches interPhaseMemory on graph build", () => {
    const g = ingestClagTurnContextV0({ sessionId: "sess-graph-ipm" });
    expect(g.interPhaseMemory?.schema).toContain("inter_phase_memory");
    expect(g.interPhaseMemory?.explicitMeaningTransfer.explicitNow).toBe(true);
  });
});
