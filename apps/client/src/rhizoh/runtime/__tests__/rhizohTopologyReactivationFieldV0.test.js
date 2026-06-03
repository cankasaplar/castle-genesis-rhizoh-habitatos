import { describe, expect, it, beforeEach } from "vitest";
import {
  deriveTopologyReactivationV0,
  TRF_REACTIVATION_CAUSE_V0,
  resetTopologyReactivationForTestV0
} from "../rhizohTopologyReactivationFieldV0.js";
import { projectRcalCrystalTopologyV0 } from "../rhizohRcalCrystalTopologyV0.js";
import {
  syncCognitiveAttentionAfterPresenceV0,
  resetCognitiveAttentionForTestV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { T0_INTENT_EXPLORE_V0 } from "../t0ContextStripV0.js";

describe("rhizohTopologyReactivationFieldV0", () => {
  beforeEach(() => {
    resetTopologyReactivationForTestV0();
    resetCognitiveAttentionForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  it("initial crystallize is active", () => {
    const topo = projectRcalCrystalTopologyV0(null);
    const trf = deriveTopologyReactivationV0(topo);
    expect(trf.active).toBe(true);
    expect(trf.cause).toBe(TRF_REACTIVATION_CAUSE_V0.INITIAL_CRYSTALLIZE);
    expect(trf.cluster_reweight.length).toBe(0);
  });

  it("detects reactivation on focus shift", () => {
    const p0 = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const cog0 = syncCognitiveAttentionAfterPresenceV0({ presence: p0, nowMs: 0 });
    const topo0 = window.__rhizoh?.rcalCrystalTopology || projectRcalCrystalTopologyV0(cog0);

    const p1 = deriveRhizohPresenceStateV0({ nowMs: 3000, fieldState: "EXECUTING", lastUserActivityMs: 2990 });
    const cog1 = syncCognitiveAttentionAfterPresenceV0({
      presence: p1,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      routerIntent: "DEPLOY",
      nowMs: 3000
    });
    const topo1 = window.__rhizoh?.rcalCrystalTopology || projectRcalCrystalTopologyV0(cog1);
    const trf = deriveTopologyReactivationV0(topo1, cog1);

    expect(trf.reactivation01).toBeGreaterThan(0.1);
    expect(trf.cluster_reweight.length).toBeGreaterThan(0);
    expect(trf.why_reshaped.label_tr).toBeTruthy();
    expect(topo0.nodes.length).toBeGreaterThan(0);
  });

  it("quiescent when topology unchanged", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 1000 });
    const cog = syncCognitiveAttentionAfterPresenceV0({ presence: p, nowMs: 1000 });
    const topo = projectRcalCrystalTopologyV0(cog);
    deriveTopologyReactivationV0(topo, cog);
    const trf2 = deriveTopologyReactivationV0(topo, cog);
    expect(trf2.cause).toBe(TRF_REACTIVATION_CAUSE_V0.QUIESCENT);
    expect(trf2.reactivation01).toBeLessThan(0.15);
  });
});
