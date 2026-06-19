import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../../ticket/mutationReasonCodeOntologyV1.js";
import {
  CROSS_SPACE_REC_EVENT_V0,
  INTERFERENCE_KIND_V0,
  ingestSpaceDriftSignalV0,
  reconcileCrossSpaceRecV0,
  resetCrossSpaceRecForTestV0
} from "../crossSpaceRecReconciliationV0.js";
import { CAUSAL_SPACE_ID_V0 } from "../sportsCausalSpaceV0.js";
import { ARENA_ARBITRATION_REASON_V0 } from "../multiArenaSchedulerV0.js";

vi.mock("../multiArenaSchedulerV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    selectActiveArenaFrameV0: vi.fn(() => ({
      primarySpaceId: CAUSAL_SPACE_ID_V0.CHESS,
      arbitrationReason: ARENA_ARBITRATION_REASON_V0.CHESS_BASELINE_DEFAULT,
      baselineSpaceId: CAUSAL_SPACE_ID_V0.CHESS
    })),
    listArenaFramesV0: vi.fn(() =>
      Object.freeze([
        Object.freeze({
          spaceId: CAUSAL_SPACE_ID_V0.CHESS,
          resourceQuota: 0.6,
          recAffinity: "deterministic_rec"
        }),
        Object.freeze({
          spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
          resourceQuota: 0.35,
          recAffinity: "stochastic_rec"
        })
      ])
    )
  };
});

describe("crossSpaceRecReconciliationV0", () => {
  beforeEach(() => {
    resetCrossSpaceRecForTestV0();
  });

  it("ingests space-tagged drift into isolated slices", () => {
    ingestSpaceDriftSignalV0({
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
      category: MUTATION_REASON_CATEGORY_V1.REC,
      strength: 0.8,
      recAffinity: "stochastic_rec"
    });
    const rec = reconcileCrossSpaceRecV0();
    expect(rec.sliceReports[CAUSAL_SPACE_ID_V0.SPORTS]?.epochSeq).toBe(1);
    expect(rec.globalEpochId).toContain("rec_global_");
  });

  it("prevents sports REC from bleeding into reconciled chess-primary epoch", () => {
    ingestSpaceDriftSignalV0({
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
      category: MUTATION_REASON_CATEGORY_V1.REC,
      strength: 2,
      recAffinity: "stochastic_rec"
    });
    ingestSpaceDriftSignalV0({
      spaceId: CAUSAL_SPACE_ID_V0.CHESS,
      category: MUTATION_REASON_CATEGORY_V1.REC,
      strength: 1,
      recAffinity: "deterministic_rec"
    });

    const rec = reconcileCrossSpaceRecV0();
    expect(rec.primarySpaceId).toBe(CAUSAL_SPACE_ID_V0.CHESS);
    expect(rec.spaceBlindLeakagePrevented).toBe(true);
    expect(rec.interference.some((row) => row.kind === INTERFERENCE_KIND_V0.REC_CATEGORY_BLEED)).toBe(
      true
    );
    expect(rec.reconciledShares.REC).toBeGreaterThan(0);
  });

  it("marks realitiesInteract when cross-space interference exists", () => {
    ingestSpaceDriftSignalV0({
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
      category: MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT,
      strength: 1.5
    });
    const rec = reconcileCrossSpaceRecV0();
    expect(rec.realitiesInteract).toBe(true);
    expect(rec.interferenceCount).toBeGreaterThan(0);
  });

  it("dispatches reconciliation event", () => {
    const handler = vi.fn();
    window.addEventListener(CROSS_SPACE_REC_EVENT_V0, handler);
    reconcileCrossSpaceRecV0();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(CROSS_SPACE_REC_EVENT_V0, handler);
  });
});
