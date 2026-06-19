import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../../ticket/mutationReasonCodeOntologyV1.js";
import {
  ingestChessDriftLaneV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import { resetCrossSpaceResourceGuardForTestV0 } from "../crossSpaceResourceContentionGuardV0.js";
import { resetCrossSpaceRecForTestV0 } from "../crossSpaceRecReconciliationV0.js";
import { resetCrossSpaceStabilizationForTestV0 } from "../crossSpaceStabilizationLayerV0.js";
import {
  EXECUTION_PHASE_COMMIT_EVENT_V0,
  INGESTION_LANE_V0,
  beginExecutionPhaseV0,
  commitExecutionPhaseV0,
  enqueuePhaseIngestionV0,
  resetExecutionPhaseSynchronizerForTestV0,
  runAlignedExecutionPhaseV0,
  runBootExecutionPhaseV0,
  schedulePhaseCommitV0
} from "../executionPhaseSynchronizerV0.js";
import { resetMultiArenaSchedulerForTestV0 } from "../multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "../sportsCausalSpaceV0.js";

vi.mock("../multiArenaSchedulerV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    selectActiveArenaFrameV0: vi.fn(() => ({
      primarySpaceId: CAUSAL_SPACE_ID_V0.CHESS,
      arbitrationReason: "chess_baseline_default",
      sportsBurstActive: false
    }))
  };
});

describe("executionPhaseSynchronizerV0", () => {
  beforeEach(() => {
    resetExecutionPhaseSynchronizerForTestV0();
    resetMultiArenaSchedulerForTestV0();
    resetCrossSpaceRecForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
    resetCrossSpaceResourceGuardForTestV0();
    resetCrossSpaceStabilizationForTestV0();
  });

  it("commits scheduler, fusion, stabilization, and arbitration in one phase", () => {
    ingestChessDriftLaneV0({ z: 0.5, category: MUTATION_REASON_CATEGORY_V1.SC });
    const aligned = runAlignedExecutionPhaseV0({ source: "test" });

    expect(aligned.phaseAligned).toBe(true);
    expect(aligned.commit.tick.phaseLock).toBe(true);
    expect(aligned.commit.fusion).toBeTruthy();
    expect(aligned.commit.projection.schema).toContain("projection");
    expect(aligned.commit.arbitration.schema).toContain("verdict");
    expect(aligned.commit.realityMutationPermitted).toBe(false);
    expect(aligned.commit.tick.atMs).toBe(aligned.commit.projection.atMs);
  });

  it("flushes ingestion window before commit", () => {
    beginExecutionPhaseV0({ source: "buffer_test" });
    enqueuePhaseIngestionV0(INGESTION_LANE_V0.CHESS_DRIFT, {
      z: 0.4,
      category: MUTATION_REASON_CATEGORY_V1.SC
    });

    const commit = commitExecutionPhaseV0({ source: "buffer_commit" });
    expect(commit.flush.count).toBe(1);
    expect(commit.fusion.epistemicUpdate.laneContributions.chess.present).toBe(true);
  });

  it("runBootExecutionPhaseV0 aligns boot gate context", () => {
    const boot = runBootExecutionPhaseV0({
      gate: { bootContext: { livingWorldId: "world_test", targetTick: 42 } }
    });
    expect(boot.commit.source).toBe("boot.post_gate");
    expect(boot.commit.phaseAligned).toBe(true);
  });

  it("schedulePhaseCommitV0 aligns sports ingest path", () => {
    const result = schedulePhaseCommitV0({
      source: "sports:score_delta",
      ingest: [
        {
          lane: INGESTION_LANE_V0.SPORTS,
          payload: {
            eventType: "score_delta",
            categoryShares: { ENTROPY_DRIFT: 0.5 },
            entropy01: 0.5
          }
        }
      ]
    });
    expect(result.phaseAligned).toBe(true);
    expect(result.commit.fusion.epistemicUpdate.laneContributions.sports.present).toBe(true);
  });

  it("dispatches phase commit event", () => {
    const handler = vi.fn();
    window.addEventListener(EXECUTION_PHASE_COMMIT_EVENT_V0, handler);
    runAlignedExecutionPhaseV0({ source: "event_test" });
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(EXECUTION_PHASE_COMMIT_EVENT_V0, handler);
  });
});
