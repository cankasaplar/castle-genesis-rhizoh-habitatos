import { describe, it, expect, beforeEach } from "vitest";
import {
  recordWorldMutationV0,
  readWorldMutationLedgerV0,
  sealWorldMutationLedgerV0,
  readSealedWorldMutationLedgerV0,
  buildWorldMutationFeedbackV0,
  applyMutationToCastlePresenceV0,
  clearWorldMutationForTestV0,
  WORLD_MUTATION_ACTION_V0
} from "../worldMutationFeedbackV0.js";
import { buildRhizohLivingWorldEntryModelV0 } from "../rhizohLivingWorldEntryOrchestratorV0.js";
import { clearLivingWorldPersistenceForTestV0, clearBrowserSessionActiveForTestV0 } from "../livingWorldPersistenceUxV0.js";
import { clearDriftCalibrationForTestV0 } from "../worldDriftCalibrationV0.js";
import { bindIdentityDriftContextV0 } from "../identityDriftBindingV0.js";
import { clearSelfSignatureForTestV0 } from "../identityDriftBindingV0.js";
import { clearEntropyEconomyForTestV0 } from "../perceptualEntropyEconomyV0.js";

const WI = "wi_mutation_test";

function testIdentityBinding() {
  return bindIdentityDriftContextV0({
    worldInstanceId: WI,
    timeZone: "Europe/Istanbul",
    locale: "tr"
  });
}

describe("worldMutationFeedbackV0", () => {
  beforeEach(() => {
    clearSelfSignatureForTestV0();
    const binding = testIdentityBinding();
    clearEntropyEconomyForTestV0(binding.selfSignature, binding.sessionIdentity);
    clearWorldMutationForTestV0(WI);
    clearDriftCalibrationForTestV0(WI);
    clearLivingWorldPersistenceForTestV0(WI);
    clearBrowserSessionActiveForTestV0(WI);
  });

  const binding = () => testIdentityBinding();

  it("observe deepens world instance imprint", () => {
    const r = recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.OBSERVE,
      identityBinding: binding()
    });
    expect(r.ok).toBe(true);
    expect(r.ledger.observationImprint).toBeGreaterThan(0.1);
    expect(r.feedbackLine).toMatch(/Gözlem izi/);
  });

  it("enter castle shifts atmosphere and castle affinity", () => {
    recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.OBSERVE,
      identityBinding: binding()
    });
    const r = recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE,
      identityBinding: binding()
    });
    expect(r.ok).toBe(true);
    expect(r.ledger.castleAffinity).toBeGreaterThan(0.1);
    expect(r.feedbackLine).toMatch(/Castle teması|ölçülü/i);
  });

  it("return visit feels small differences after seal", () => {
    recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.OBSERVE,
      identityBinding: binding()
    });
    sealWorldMutationLedgerV0(WI);
    expect(readSealedWorldMutationLedgerV0(WI)?.mutationGeneration).toBe(1);

    const enter = recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE,
      identityBinding: binding()
    });
    expect(enter.ok).toBe(true);
    const feedback = buildWorldMutationFeedbackV0({ worldInstanceId: WI, returning: true });

    expect(feedback.sealed).not.toBeNull();
    expect(feedback.delta.hasDelta).toBe(true);
    expect(feedback.returnDeltaLine).toMatch(/küçük farklar|Geri döndüğünde|değişim küçük/i);
  });

  it("applyMutationToCastlePresenceV0 raises pulse after castle entry", () => {
    const base = applyMutationToCastlePresenceV0({
      basePulse: 0.4,
      ledger: readWorldMutationLedgerV0(WI)
    });
    recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE,
      identityBinding: binding()
    });
    const after = applyMutationToCastlePresenceV0({
      basePulse: 0.4,
      ledger: readWorldMutationLedgerV0(WI)
    });
    expect(after.pulse01).toBeGreaterThan(base.pulse01);
  });

  it("orchestrator merges mutation into continuity strip", () => {
    recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE,
      identityBinding: binding()
    });
    const mutation = buildWorldMutationFeedbackV0({ worldInstanceId: WI, returning: false });
    const model = buildRhizohLivingWorldEntryModelV0({
      worldInstance: { instanceId: WI, timeZone: "Europe/Istanbul", locale: "tr" },
      livingFrame: {
        castle: { affordanceId: "castle.interact.focus", metabolicPulse: 0.5, surfaceReady: true },
        atmosphere: { state: { ambient: { weatherType: "clear" } } }
      },
      sessionTouch: null,
      mutationFeedback: mutation
    });
    expect(model.worldState.castlePresence.pulse01).toBeGreaterThan(0.45);
    expect(model.continuityStrip.mutationEcho || model.mutationFeedback.recentActionLine).toBeTruthy();
  });
});
