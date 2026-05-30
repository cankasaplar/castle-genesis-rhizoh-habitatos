import { describe, it, expect, beforeEach } from "vitest";
import { buildPhaseCouplingGraphV0 } from "../rhizohClagPhaseCouplingGraphV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "../rhizohClagTemporalBeaV0.js";
import { ingestClagTurnContextV0, resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { resetTemporalBeaStateV0 } from "../rhizohClagTemporalBeaV0.js";

describe("rhizohClagPhaseCouplingGraphV0", () => {
  it("maps release phase to higher sovereign coupling", () => {
    const release = buildPhaseCouplingGraphV0({
      boundedEmergence: {
        temporal: {
          strategicFlow: { phase: TEMPORAL_BEA_PHASE_V0.RELEASE },
          tickHistory: [
            { phase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE },
            { phase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE }
          ]
        }
      },
      nodes: [
        {
          id: "real_life:metehan_ankara",
          kind: "real_life",
          label: "Metehan Ankara",
          meta: { registryId: "clag_node:metehan_ankara", registryRole: "active_runtime" }
        },
        {
          id: "real_life:besiktas_serencebey",
          kind: "real_life",
          label: "Beşiktaş Serencebey",
          meta: {
            registryId: "clag_node:besiktas_serencebey",
            registryRole: "active_runtime",
            isPrimary: true
          }
        },
        { id: "narrative:story", kind: "narrative", label: "scene" }
      ]
    });
    expect(release.currentPhase).toBe(TEMPORAL_BEA_PHASE_V0.RELEASE);
    expect(release.phaseTransition).toBe("accumulate_to_release");
    const cross = release.phaseCouplingEdges.find(
      (e) => e.label === "sovereign_cross_phase_coupling"
    );
    expect(cross?.weight).toBeGreaterThan(0.1);
    expect(release.systemBreath.exhale).toBe(TEMPORAL_BEA_PHASE_V0.RELEASE);
  });
});

describe("CLAG includes phase coupling graph", () => {
  beforeEach(() => {
    resetClagGraphV0();
    resetTemporalBeaStateV0();
  });

  it("attaches phaseCouplingGraph on ingest", () => {
    const graph = ingestClagTurnContextV0({ sessionId: "sess-pcg" });
    expect(graph.phaseCouplingGraph?.schema).toContain("phase_coupling");
    expect(graph.phaseCouplingGraph?.nodeAffinities?.length).toBeGreaterThan(0);
  });
});
