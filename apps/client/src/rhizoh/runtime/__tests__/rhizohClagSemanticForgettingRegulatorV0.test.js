import { describe, it, expect, beforeEach } from "vitest";
import { applySemanticForgettingRegulatorV0 } from "../rhizohClagSemanticForgettingRegulatorV0.js";
import {
  persistInterPhaseMemoryV0,
  resetInterPhaseMemoryV0,
  INTER_PHASE_CARRIER_KIND_V0
} from "../rhizohClagInterPhaseMemoryV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "../rhizohClagTemporalBeaV0.js";
import { ingestClagTurnContextV0, resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { resetTemporalBeaStateV0 } from "../rhizohClagTemporalBeaV0.js";

describe("rhizohClagSemanticForgettingRegulatorV0", () => {
  beforeEach(() => resetInterPhaseMemoryV0());

  it("forgets weak carriers and resolves surprise in accumulate", () => {
    const ipm = persistInterPhaseMemoryV0({
      sessionId: "sess-sfr",
      phaseCouplingGraph: {
        currentPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE,
        phaseTransition: "release_to_accumulate"
      },
      boundedEmergence: { controlledSurpriseInjected: true },
      memoryShapingHints: {
        openThreadsBoost: ["t1"],
        activeSovereignNodes: [{ registryId: "a", label: "A", isPrimary: true }]
      }
    });
    const carriers = ipm.semanticCarriers.map((c) =>
      c.kind === INTER_PHASE_CARRIER_KIND_V0.SURPRISE_RESIDUE
        ? { ...c, strength01: 0.4 }
        : { ...c }
    );
    const out = applySemanticForgettingRegulatorV0(
      { ...ipm, semanticCarriers: carriers },
      { sessionId: "sess-sfr", graphContamination: { detected: false } }
    );
    expect(out.semanticForgetting.summary.forgottenCount).toBeGreaterThan(0);
    expect(
      out.semanticForgetting.forgottenCarriers.some((f) =>
        String(f.reason).includes("surprise")
      )
    ).toBe(true);
  });

  it("compresses multiple sovereign echoes", () => {
    const ipm = {
      currentPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE,
      phaseTransition: "bootstrap",
      semanticCarriers: [
        {
          id: "c1",
          kind: INTER_PHASE_CARRIER_KIND_V0.SOVEREIGN_ECHO,
          payload: "Metehan Ankara",
          strength01: 0.35,
          persistsToPhases: [TEMPORAL_BEA_PHASE_V0.ACCUMULATE],
          bornPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE
        },
        {
          id: "c2",
          kind: INTER_PHASE_CARRIER_KIND_V0.SOVEREIGN_ECHO,
          payload: "Beşiktaş Serencebey",
          strength01: 0.3,
          persistsToPhases: [TEMPORAL_BEA_PHASE_V0.ACCUMULATE],
          bornPhase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE
        }
      ],
      explicitMeaningTransfer: {
        carriedIntoThisPhase: [],
        bornThisTick: [],
        implicitBefore: false,
        explicitNow: true
      }
    };
    const out = applySemanticForgettingRegulatorV0(ipm, { sessionId: "sess-compress" });
    expect(out.semanticForgetting.summary.compressedCount).toBe(1);
    expect(out.semanticCarriers.some((c) => String(c.kind).startsWith("compressed"))).toBe(
      true
    );
  });
});

describe("CLAG graph semantic forgetting", () => {
  beforeEach(() => {
    resetClagGraphV0();
    resetTemporalBeaStateV0();
    resetInterPhaseMemoryV0();
  });

  it("attaches semanticForgetting on graph build", () => {
    const g = ingestClagTurnContextV0({ sessionId: "sess-sfr-graph" });
    expect(g.semanticForgetting?.schema).toContain("forgetting_regulator");
    expect(g.semanticForgetting.summary.retainedCount).toBeGreaterThanOrEqual(0);
  });
});
