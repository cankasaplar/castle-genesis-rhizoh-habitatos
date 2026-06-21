import { describe, expect, it, beforeEach } from "vitest";
import {
  applyBehavioralInfluenceToNarrativesV0,
  computeBehaviorWeightV0,
  computeCrossLensAgreementV0,
  MAX_BEHAVIOR_WEIGHT_V0
} from "../behavioralInfluenceLayerV0.js";
import {
  clearAttentionSedimentForTestV0,
  refreshAttentionSedimentFromTraceV0,
  SEDIMENT_INPUT_SOURCE_V0
} from "../attentionSedimentationBufferV0.js";
import {
  clearObserverTraceForTestV0,
  injectObserverTraceEntriesForTestV0
} from "../observerReadOnlyHookV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "../narrativeProjectionEngineV0.js";

const TRACE = [
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_99", meta: { surface: "map", focus: 0.4 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } }
];

describe("behavioralInfluenceLayerV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearAttentionSedimentForTestV0();
  });

  it("computes capped soft behavior weight", () => {
    const w = computeBehaviorWeightV0({
      frequency: 4,
      salienceDecay: 0.3,
      source: SEDIMENT_INPUT_SOURCE_V0.MAP,
      clusterDensity: 0.4,
      constraintAnchor: false
    });
    expect(w).toBeGreaterThan(1);
    expect(w).toBeLessThanOrEqual(MAX_BEHAVIOR_WEIGHT_V0);
  });

  it("boosts repeated pin ranking without causal write flags", () => {
    injectObserverTraceEntriesForTestV0(TRACE);
    refreshAttentionSedimentFromTraceV0();

    const narrative = resolveNarrativeFromObserverTraceV0({ locale: "en" });
    expect(narrative.behavioralInfluence.active).toBe(true);
    expect(narrative.temporalSediment.influencesSelection).toBe(true);
    expect(narrative.behavioralInfluence.influencesCausalGraph).toBe(false);
    expect(narrative.primaryFocus?.entityId).toBe("42");
    expect(narrative.primaryFocus?.influencedSalience).toBeGreaterThan(
      narrative.primaryFocus?.baseSalience ?? 0
    );
  });

  it("cross-lens agreement adds weak confirmation boost", () => {
    const cross = computeCrossLensAgreementV0([
      { source: SEDIMENT_INPUT_SOURCE_V0.MAP, frequency: 2 },
      { source: SEDIMENT_INPUT_SOURCE_V0.CHESS, frequency: 2, constraintAnchor: true }
    ]);
    expect(cross.confirmed).toBe(true);
    expect(cross.boost).toBeGreaterThan(0);
  });

  it("stays inactive without sediment refresh", () => {
    injectObserverTraceEntriesForTestV0(TRACE);
    const out = applyBehavioralInfluenceToNarrativesV0(
      [{ entityId: "pin_42", salience: 0.5 }],
      { enabled: true }
    );
    expect(out.influencesSelection).toBe(false);
  });
});
