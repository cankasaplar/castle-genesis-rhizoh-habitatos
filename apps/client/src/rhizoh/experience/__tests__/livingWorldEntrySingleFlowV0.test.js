import { describe, it, expect, beforeEach } from "vitest";
import { buildRhizohLivingWorldEntryModelV0 } from "../rhizohLivingWorldEntryOrchestratorV0.js";
import {
  openLivingWorldBrowserSessionV0,
  touchLivingWorldPersistenceTickV0,
  sealLivingWorldSessionSnapshotV0,
  clearLivingWorldPersistenceForTestV0,
  clearBrowserSessionActiveForTestV0,
  readLivingWorldPersistenceV0
} from "../livingWorldPersistenceUxV0.js";
import { deriveCollectivePresenceFeelingV0 } from "../livingWorldCollectivePulseV0.js";
import {
  recordWorldMutationV0,
  sealWorldMutationLedgerV0,
  buildWorldMutationFeedbackV0,
  clearWorldMutationForTestV0,
  WORLD_MUTATION_ACTION_V0
} from "../worldMutationFeedbackV0.js";
import { clearDriftCalibrationForTestV0 } from "../worldDriftCalibrationV0.js";
import { clearCrossSessionCoherenceForTestV0 } from "../crossSessionWorldCoherenceV0.js";
import { bindIdentityDriftContextV0, clearSelfSignatureForTestV0 } from "../identityDriftBindingV0.js";
import { clearEntropyEconomyForTestV0 } from "../perceptualEntropyEconomyV0.js";

const WI = "wi_single_flow_test";

describe("livingWorldEntrySingleFlowV0", () => {
  beforeEach(() => {
    clearSelfSignatureForTestV0();
    const id = bindIdentityDriftContextV0({ worldInstanceId: WI, locale: "tr" });
    clearEntropyEconomyForTestV0(id.selfSignature, id.sessionIdentity);
    clearLivingWorldPersistenceForTestV0();
    clearBrowserSessionActiveForTestV0(WI);
    clearWorldMutationForTestV0(WI);
    clearDriftCalibrationForTestV0(WI);
    clearCrossSessionCoherenceForTestV0(WI);
  });

  const identityBinding = () =>
    bindIdentityDriftContextV0({ worldInstanceId: WI, timeZone: "Europe/Istanbul", locale: "tr" });

  it("single flow: first visit → seal → return feels world changed", () => {
    const firstTouch = openLivingWorldBrowserSessionV0({ worldInstanceId: WI });
    touchLivingWorldPersistenceTickV0({
      worldInstanceId: WI,
      weatherType: "clear",
      atmosphereLead: "öğle — açık gökyüzü",
      castleAffordanceId: "castle.interact.rest"
    });

    const firstModel = buildRhizohLivingWorldEntryModelV0({
      worldInstance: { instanceId: WI, timeZone: "Europe/Istanbul", locale: "tr" },
      livingFrame: {
        ribbon: { atmosphereLead: "öğle — açık gökyüzü", worldEcho: "wi echo" },
        castle: { affordanceId: "castle.interact.rest", metabolicPulse: 0.3, surfaceReady: true },
        atmosphere: { state: { ambient: { weatherType: "clear" } } }
      },
      sessionTouch: firstTouch
    });

    expect(firstModel.screenMode).toBe("living_world_entry_castle_first");
    expect(firstModel.continuityStrip.yesterday).toMatch(/İlk açılış|İlk kez|dün yok/i);
    expect(firstModel.humanLayer?.ftue?.active).toBe(true);
    expect(firstModel.actionSurface.observe.href).toBe("/academy/observe");
    expect(firstModel.actionSurface.createCastle.disabled).toBe(true);
    expect(firstModel.actionSurface.createCastle.laterTrack).toBe("spiral_mmo");

    recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.OBSERVE,
      identityBinding: identityBinding()
    });
    sealLivingWorldSessionSnapshotV0(WI);
    sealWorldMutationLedgerV0(WI);
    clearBrowserSessionActiveForTestV0(WI);

    recordWorldMutationV0({
      worldInstanceId: WI,
      action: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE,
      identityBinding: identityBinding()
    });

    const returnTouch = openLivingWorldBrowserSessionV0({ worldInstanceId: WI });
    expect(returnTouch.isReturnVisit).toBe(true);

    const mutation = buildWorldMutationFeedbackV0({ worldInstanceId: WI, returning: true });
    const returnModel = buildRhizohLivingWorldEntryModelV0({
      worldInstance: { instanceId: WI, timeZone: "Europe/Istanbul", locale: "tr" },
      livingFrame: {
        ribbon: { atmosphereLead: "akşam — yağışlı çevre", worldEcho: "wi echo" },
        castle: { affordanceId: "castle.interact.focus", metabolicPulse: 0.7, surfaceReady: true },
        atmosphere: { state: { ambient: { weatherType: "rain" } } }
      },
      sessionTouch: returnTouch,
      mutationFeedback: mutation
    });

    expect(returnModel.returning).toBe(true);
    expect(returnModel.continuityStrip.memoryEcho).toMatch(/Sen yokken|Son ziyaret/i);
    expect(returnModel.continuityStrip.todayChanged).toMatch(/değişti|hava|Castle|küçük|Castle teması/i);
    expect(mutation.returnDeltaLine || mutation.recentActionLine).toBeTruthy();
    expect(returnModel.worldState.collectiveFeeling.primary.length).toBeGreaterThan(10);
    expect(readLivingWorldPersistenceV0(WI)?.visitCount).toBeGreaterThanOrEqual(2);
  });

  it("three fixed zones always present", () => {
    const model = buildRhizohLivingWorldEntryModelV0({
      worldInstance: { instanceId: WI, timeZone: "UTC", locale: "en" },
      livingFrame: null,
      sessionTouch: null
    });
    expect(model.continuityStrip.yesterday).toBeTruthy();
    expect(model.continuityStrip.todayChanged).toBeTruthy();
    expect(model.continuityStrip.whyHere).toMatch(/buradasın|Buradasın|You are here/i);
    expect(model.worldState.castlePresence).toBeTruthy();
    expect(model.worldState.worldInstance.instanceId).toBe(WI);
    expect(model.actionSurface.enterCastle.anchor).toBe("#rhizoh-castle-presence");
  });

  it("collective feeling has no numeric metrics exposed", () => {
    const f = deriveCollectivePresenceFeelingV0(WI);
    expect(f.primary).not.toMatch(/\d+/);
    expect(f.tone).toBe("yalniz_degilsin");
  });
});
