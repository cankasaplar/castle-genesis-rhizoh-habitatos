import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../../ticket/mutationReasonCodeOntologyV1.js";
import {
  CROSS_SPACE_FUSION_EVENT_V0,
  FUSION_LANE_V0,
  fuseCrossSpaceEpistemicV0,
  ingestCalendarContinuityLaneV0,
  ingestChessDriftLaneV0,
  ingestCuxPerceptionLaneV0,
  ingestSportsEntropyLaneV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import { CAUSAL_SPACE_ID_V0 } from "../sportsCausalSpaceV0.js";
import { resetCrossSpaceRecForTestV0 } from "../crossSpaceRecReconciliationV0.js";

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

describe("crossSpaceCausalFusionV0", () => {
  beforeEach(() => {
    resetCrossSpaceCausalFusionForTestV0();
    resetCrossSpaceRecForTestV0();
  });

  it("fuses chess drift + sports entropy + cux perception lanes", () => {
    ingestChessDriftLaneV0({ z: 0.6, category: MUTATION_REASON_CATEGORY_V1.SC });
    ingestSportsEntropyLaneV0({
      entropy01: 0.8,
      categoryShares: { ENTROPY_DRIFT: 2, REC: 1 }
    });
    ingestCuxPerceptionLaneV0({
      perception01: 0.7,
      categoryShares: { SC: 0.3, REC: 0.2 }
    });

    const fusion = fuseCrossSpaceEpistemicV0();
    expect(fusion.epistemicUpdate.updateKind).toBe("unified_epistemic_observation");
    expect(fusion.epistemicUpdate.laneContributions.chess.present).toBe(true);
    expect(fusion.epistemicUpdate.laneContributions.sports.present).toBe(true);
    expect(fusion.epistemicUpdate.laneContributions.cux.present).toBe(true);
    expect(fusion.epistemicUpdate.fusedShares.ENTROPY_DRIFT).toBeGreaterThan(0);
    expect(fusion.epistemicUpdate.cubeStateCommit).toBe(false);
    expect(fusion.laneAudit?.separabilityPreserved).toBe(true);
    expect(fusion.fusionReliability?.reliability01).toBeGreaterThan(0);
  });

  it("marks realitiesIntegrated when chess and sports lanes both present", () => {
    ingestChessDriftLaneV0({ z: 0.4 });
    ingestSportsEntropyLaneV0({ entropy01: 0.5 });
    const fusion = fuseCrossSpaceEpistemicV0();
    expect(fusion.epistemicUpdate.realitiesIntegrated).toBe(true);
  });

  it("dispatches fusion event", () => {
    const handler = vi.fn();
    window.addEventListener(CROSS_SPACE_FUSION_EVENT_V0, handler);
    ingestChessDriftLaneV0({ z: 0.2 });
    fuseCrossSpaceEpistemicV0();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(CROSS_SPACE_FUSION_EVENT_V0, handler);
  });

  it("tags lanes with fusion lane ids", () => {
    const chess = ingestChessDriftLaneV0({ z: 0.1 });
    const sports = ingestSportsEntropyLaneV0({ entropy01: 0.2 });
    expect(chess.lane).toBe(FUSION_LANE_V0.CHESS_DRIFT);
    expect(sports.lane).toBe(FUSION_LANE_V0.SPORTS_ENTROPY);
  });

  it("merges calendar continuity lane into fusedShares when present", () => {
    ingestCalendarContinuityLaneV0({
      eventId: "evt_team_sync",
      eventType: "scheduled",
      foxSignals: { continuitySignal01: 0.65, noveltySignal01: 0.2, worldSignal01: 0.25 }
    });

    const fusion = fuseCrossSpaceEpistemicV0();
    expect(fusion.epistemicUpdate.laneContributions.calendar.present).toBe(true);
    expect(fusion.epistemicUpdate.laneContributions.calendar.weight).toBe(0.1);
    expect(fusion.epistemicUpdate.fusedShares.SC).toBeGreaterThan(0);
    expect(fusion.epistemicUpdate.laneContributions.calendar.shares.SC).toBeGreaterThan(0);
  });
});
