import { describe, it, expect } from "vitest";
import {
  computeRhizohScenarioPhaseReadout,
  buildBootObservationProvenance
} from "./rhizohScenarioPhaseReadoutV1.js";
import { buildRhizohFirstTouchEpistemicBody } from "./rhizohWelcomeEpistemicV1.js";

describe("rhizohScenarioPhaseReadoutV1", () => {
  it("defaults to STABLE · RHIZOH with quiet field", () => {
    const r = computeRhizohScenarioPhaseReadout({});
    expect(r.readoutVersion).toBe("rhizoh-scenario-readout-v1");
    expect(r.phase).toBe("STABLE");
    expect(r.scenario).toBe("RHIZOH");
    expect(r.fieldSnapshot.entropy).toBeLessThanOrEqual(0.65);
  });

  it("FROZEN governance → CHAOS", () => {
    const r = computeRhizohScenarioPhaseReadout({ governanceState: "FROZEN", realityState: "WORLD_STABLE" });
    expect(r.phase).toBe("CHAOS");
  });

  it("WORLD_TRANSITION → BIFURCATION band", () => {
    const r = computeRhizohScenarioPhaseReadout({
      governanceState: "NORMAL",
      realityState: "WORLD_TRANSITION"
    });
    expect(r.phase).toBe("BIFURCATION");
  });

  it("buildBootObservationProvenance degraded → UNKNOWN + readoutDegraded true", () => {
    const p = buildBootObservationProvenance({ readoutDegraded: true });
    expect(p.phase).toBe("UNKNOWN");
    expect(p.scenario).toBe("UNKNOWN");
    expect(p.driftState).toBe(null);
    expect(p.readoutDegraded).toBe(true);
  });

  /**
   * Golden invariant: frozen-core boundary — if this fails, phase leaked into primary semantics.
   */
  it("buildBootObservationProvenance CHAOS → driftState chaos_band; primary identical to STABLE (provenance does not alter semantics)", () => {
    const stable = buildBootObservationProvenance({
      governanceState: "NORMAL",
      realityState: "WORLD_STABLE"
    });
    const chaos = buildBootObservationProvenance({
      governanceState: "FROZEN",
      realityState: "WORLD_STABLE"
    });
    expect(stable.driftState).toBe(null);
    expect(stable.readoutDegraded).toBe(false);
    expect(chaos.driftState).toBe("chaos_band");
    expect(chaos.readoutDegraded).toBe(false);
    expect(buildRhizohFirstTouchEpistemicBody(null, stable).primary).toBe(
      buildRhizohFirstTouchEpistemicBody(null, chaos).primary
    );
  });
});
