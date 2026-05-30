import { describe, it, expect, beforeEach } from "vitest";
import {
  applyWorldDriftCalibrationV0,
  readPerceptualEntropyBudgetV0,
  DRIFT_INTENSITY_CAP_PER_ACTION_V0,
  PERCEPTUAL_ENTROPY_BUDGET_V0,
  clearDriftCalibrationForTestV0
} from "../worldDriftCalibrationV0.js";
import {
  recordWorldMutationV0,
  clearWorldMutationForTestV0,
  WORLD_MUTATION_ACTION_V0
} from "../worldMutationFeedbackV0.js";
import { bindIdentityDriftContextV0 } from "../identityDriftBindingV0.js";
import { clearEntropyEconomyForTestV0 } from "../perceptualEntropyEconomyV0.js";
import { clearSelfSignatureForTestV0 } from "../identityDriftBindingV0.js";

const WI = "wi_drift_cal";

const baseLedger = () => ({
  schema: "castle.rhizoh.world_mutation_feedback.v0",
  worldInstanceId: WI,
  observationImprint: 0.5,
  castleAffinity: 0.5,
  atmosphereShift: 0.5,
  mutationGeneration: 3,
  lastAction: null,
  lastActionAtMs: 0,
  observeCount: 3,
  enterCastleCount: 0
});

describe("worldDriftCalibrationV0", () => {
  beforeEach(() => {
    clearDriftCalibrationForTestV0(WI);
    clearWorldMutationForTestV0(WI);
  });

  it("caps per-action drift intensity", () => {
    const prev = baseLedger();
    const proposed = {
      ...prev,
      observationImprint: prev.observationImprint + 0.5,
      castleAffinity: prev.castleAffinity + 0.5
    };
    const { ledger, calibration } = applyWorldDriftCalibrationV0({
      prev,
      proposed,
      action: WORLD_MUTATION_ACTION_V0.OBSERVE
    });
    expect(ledger.observationImprint - prev.observationImprint).toBeLessThanOrEqual(
      DRIFT_INTENSITY_CAP_PER_ACTION_V0 + 0.001
    );
    expect(calibration.intensityCapped).toBe(true);
  });

  it("throttles when entropy budget exhausted", () => {
    clearSelfSignatureForTestV0();
    const id = bindIdentityDriftContextV0({ worldInstanceId: "wi_throttle", locale: "tr" });
    clearEntropyEconomyForTestV0(id.selfSignature, id.sessionIdentity);
    clearWorldMutationForTestV0("wi_throttle");
    const prev = { ...baseLedger(), worldInstanceId: "wi_throttle", observationImprint: 0, castleAffinity: 0, atmosphereShift: 0 };
    let spent = 0;
    while (spent < PERCEPTUAL_ENTROPY_BUDGET_V0) {
      const r = recordWorldMutationV0({
        worldInstanceId: "wi_throttle",
        action: WORLD_MUTATION_ACTION_V0.OBSERVE,
        identityBinding: id
      });
      if (!r.ok) break;
      spent = r.economy?.spent ?? spent + 0.22;
    }
    const blocked = recordWorldMutationV0({
      worldInstanceId: "wi_throttle",
      action: WORLD_MUTATION_ACTION_V0.OBSERVE,
      identityBinding: id
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.throttled).toBe(true);
  });
});
