import { describe, expect, it, beforeEach } from "vitest";
import {
  isLearningActivationEnabledV0,
  resetRhizohObservationPhaseForTestV0,
  RHIZOH_OBSERVATION_PHASE_V0,
  setRhizohObservationPhaseForTestV0
} from "../rhizohObservationPhaseV0.js";
import { runRhizohChessLearningLoopV0 } from "../chessLearningLoopV0.js";

describe("rhizohObservationPhaseV0", () => {
  beforeEach(() => {
    resetRhizohObservationPhaseForTestV0();
  });

  it("defaults to silent observer — learning disabled", () => {
    expect(isLearningActivationEnabledV0()).toBe(false);
  });

  it("enables learning only in phase 3", () => {
    setRhizohObservationPhaseForTestV0(RHIZOH_OBSERVATION_PHASE_V0.LEARNING_ACTIVATION);
    expect(isLearningActivationEnabledV0()).toBe(true);
  });
});

describe("chessLearningLoopV0 phase gate", () => {
  beforeEach(() => {
    resetRhizohObservationPhaseForTestV0();
  });

  it("does not apply weight corrections in silent observer phase", async () => {
    const result = await runRhizohChessLearningLoopV0({
      moves: [],
      localColor: "w"
    });
    expect(result.learningGated).toBe(true);
    expect(result.weightDelta.aggressionBias).toBe(0);
    expect(result.weightDelta.winForcingWeight).toBe(0);
    expect(result.weightDelta.riskPenaltyWeight).toBe(0);
  });
});
