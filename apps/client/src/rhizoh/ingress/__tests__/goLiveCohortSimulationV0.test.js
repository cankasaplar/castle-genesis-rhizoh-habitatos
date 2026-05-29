import { describe, expect, it } from "vitest";
import {
  DEFAULT_GO_LIVE_THRESHOLDS_V0,
  evaluateGoLiveCohortDecisionV0,
  GO_LIVE_DECISION_V0,
  runGoLiveCohortSimulationV0,
  buildGoLiveCohortExportBundleV0
} from "../goLiveCohortSimulationV0.js";
import { simulateGoLiveCohortV0 } from "../closedUserAdmissionEngineV0.js";

describe("goLiveCohortSimulationV0", () => {
  it("runs 50-node simulation with decision pack", () => {
    const run = runGoLiveCohortSimulationV0({ nodeCount: 50, seed: 1 });
    expect(run.nodes.length).toBe(50);
    expect(run.decision.decision).toMatch(/proceed|hold|abort/);
    expect(run.decision.admitRate).toBeGreaterThan(0);
  });

  it("exports JSON-serializable bundle", () => {
    const run = runGoLiveCohortSimulationV0({ nodeCount: 10, seed: 2 });
    const bundle = buildGoLiveCohortExportBundleV0(run);
    expect(bundle.version).toBe("1.0");
    expect(bundle.metrics.histogram).toBeDefined();
    expect(JSON.parse(JSON.stringify(bundle))).toBeTruthy();
  });

  it("ABORT when admit rate below hold floor", () => {
    const sim = simulateGoLiveCohortV0({ nodeCount: 20, seed: 99 });
    const d = evaluateGoLiveCohortDecisionV0(sim, {
      minAdmitRateHold: 1.1,
      minAdmitRate: 1.2
    });
    expect(d.decision).toBe(GO_LIVE_DECISION_V0.ABORT);
  });

  it("PROCEED when metrics within default thresholds", () => {
    const sim = {
      nodeCount: 100,
      admitRate: 0.7,
      verdictCounts: { admit: 70, hold: 25, reject: 5 },
      histogram: {
        invariant_keeper: 25,
        systems_engineer: 25,
        edge_builder: 25,
        human_explorer: 25
      }
    };
    const d = evaluateGoLiveCohortDecisionV0(sim);
    expect(d.decision).toBe(GO_LIVE_DECISION_V0.PROCEED);
    expect(DEFAULT_GO_LIVE_THRESHOLDS_V0.minAdmitRate).toBe(0.55);
  });
});
