import { describe, expect, it, beforeEach } from "vitest";
import { coupleCrossTowerBiasV0, computeBiasScalarV0 } from "../crossTowerBiasCouplerV0.js";
import {
  clearAttentionSedimentForTestV0,
  refreshAttentionSedimentFromTraceV0
} from "../attentionSedimentationBufferV0.js";
import { clearObserverTraceForTestV0, injectObserverTraceEntriesForTestV0 } from "../observerReadOnlyHookV0.js";

const TRACE = [
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } },
  { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } }
];

describe("crossTowerBiasCouplerV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearAttentionSedimentForTestV0();
  });

  it("exposes bias scalar as multiplier offset (1 + bias)", () => {
    expect(computeBiasScalarV0({ frequency: 4, salienceDecay: 0.3, source: "map_attention_field", clusterDensity: 0.3, constraintAnchor: false })).toBeGreaterThan(0);
  });

  it("couples map and narrative towers without learning flags", () => {
    injectObserverTraceEntriesForTestV0(TRACE);
    refreshAttentionSedimentFromTraceV0();
    const coupled = coupleCrossTowerBiasV0({ locale: "en" });
    expect(coupled.learns).toBe(false);
    expect(coupled.biasNotLearning).toBe(true);
    expect(coupled.influencesCausalGraph).toBe(false);
    expect(coupled.chessTower.anchorLocked).toBe(true);
    expect(coupled.couplingStrength).toBeGreaterThan(0);
    expect(coupled.meaningStability).toBeGreaterThan(0);
  });
});
