import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../../ticket/mutationReasonCodeOntologyV1.js";
import {
  fuseCrossSpaceEpistemicV0,
  ingestChessDriftLaneV0,
  ingestCuxPerceptionLaneV0,
  ingestSportsEntropyLaneV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import { resetCrossSpaceResourceGuardForTestV0 } from "../crossSpaceResourceContentionGuardV0.js";
import {
  CROSS_SPACE_STABILIZATION_EVENT_V0,
  checkSeparabilityThresholdV0,
  fuseAndStabilizeCrossSpaceV0,
  normalizeFusionOutputV0,
  redistributeCrossSpaceLoadV0,
  resetCrossSpaceStabilizationForTestV0,
  stabilizeCrossSpaceFusionV0,
  SEPARABILITY_THRESHOLD_V0
} from "../crossSpaceStabilizationLayerV0.js";
import { resetCrossSpaceRecForTestV0 } from "../crossSpaceRecReconciliationV0.js";
import { CAUSAL_SPACE_ID_V0 } from "../sportsCausalSpaceV0.js";

vi.mock("../multiArenaSchedulerV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    selectActiveArenaFrameV0: vi.fn(() => ({
      primarySpaceId: CAUSAL_SPACE_ID_V0.CHESS,
      arbitrationReason: "chess_baseline_default"
    }))
  };
});

describe("crossSpaceStabilizationLayerV0", () => {
  beforeEach(() => {
    resetCrossSpaceCausalFusionForTestV0();
    resetCrossSpaceRecForTestV0();
    resetCrossSpaceResourceGuardForTestV0();
    resetCrossSpaceStabilizationForTestV0();
  });

  it("normalizes fusion shares to unit scale", () => {
    const normalized = normalizeFusionOutputV0({
      SC: 0.6,
      REC: 0.4,
      ENTROPY_DRIFT: 0.2
    });
    const sum = normalized.SC + normalized.REC + normalized.ENTROPY_DRIFT;
    expect(sum).toBeCloseTo(1, 5);
    expect(normalized._normalized).toBe(true);
  });

  it("redistributes load away from contended chess lane", () => {
    const weights = redistributeCrossSpaceLoadV0(
      { chessLoad: 0.7, sportsLoad: 0.1, totalLoad01: 0.8, overload: false },
      { chess: { weight: 0.55 }, sports: { weight: 0.25 }, cux: { weight: 0.12 } }
    );
    expect(weights.chess).toBeLessThan(0.55);
    expect(weights.sports + weights.cux).toBeGreaterThan(0.37);
  });

  it("checks separability threshold per lane", () => {
    const report = checkSeparabilityThresholdV0({
      separabilityPreserved: true,
      chess: { present: true, raw: { shares: { SC: 0.5 } } },
      sports: { present: true, raw: { shares: { ENTROPY_DRIFT: 0.01 } } },
      cux: { present: false }
    });
    expect(report.separabilityOk).toBe(true);
    expect(report.lanes[0].aboveThreshold).toBe(true);
    expect(report.lanes[1].aboveThreshold).toBe(false);
  });

  it("produces admission-safe projection from fusion", () => {
    ingestChessDriftLaneV0({ z: 0.6, category: MUTATION_REASON_CATEGORY_V1.SC });
    ingestSportsEntropyLaneV0({ entropy01: 0.7 });
    ingestCuxPerceptionLaneV0({ perception01: 0.5 });

    const result = fuseAndStabilizeCrossSpaceV0();
    expect(result.projection.schema).toContain("projection");
    expect(result.admissionSafe).toBe(true);
    expect(result.projection.projectionTrustClass).toBe("admission_safe");
    expect(result.projection.stabilizedShares.SC).toBeGreaterThan(0);
    expect(result.projection.separability.separabilityOk).toBe(true);
  });

  it("holds projection when fusion deferred", () => {
    const projection = stabilizeCrossSpaceFusionV0({
      deferred: true,
      schema: "castle.rhizoh.cross_space_causal_fusion.v0.deferred",
      reason: "epistemic_overload"
    });
    expect(projection.admissionSafe).toBe(false);
    expect(projection.holdReason).toBe("epistemic_overload");
  });

  it("dispatches stabilization event on fuse", () => {
    const handler = vi.fn();
    window.addEventListener(CROSS_SPACE_STABILIZATION_EVENT_V0, handler);
    ingestChessDriftLaneV0({ z: 0.4 });
    fuseAndStabilizeCrossSpaceV0();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(CROSS_SPACE_STABILIZATION_EVENT_V0, handler);
  });

  it("uses configured separability threshold constant", () => {
    expect(SEPARABILITY_THRESHOLD_V0).toBeGreaterThan(0);
    expect(SEPARABILITY_THRESHOLD_V0).toBeLessThan(1);
  });
});
