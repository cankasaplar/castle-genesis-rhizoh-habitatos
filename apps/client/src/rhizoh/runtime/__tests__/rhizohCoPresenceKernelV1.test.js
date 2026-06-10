import { describe, expect, it, beforeEach } from "vitest";
import {
  ACTION_PLAN_SCHEMA_V1,
  PRESENCE_KERNEL_MODE_V1,
  __resetCoPresenceKernelForTestV1,
  decideCoPresenceV1,
  processPresenceKernelIngressV1,
  resolvePresenceKernelModeV1,
  setPresenceKernelModeOverrideV1
} from "../rhizohCoPresenceKernelV1.js";
import { SPIKE_TYPE_V1 } from "../../../castlePerception/castleSpikeEngineV1.js";
import { __resetCoPresenceRuntimeForTestV1 } from "../rhizohCoPresenceRuntimeV1.js";
import { __resetExperienceFabricForTestV1 } from "../rhizohExperienceFabricV1.js";
import { __resetFusionBusForTestV1 } from "../../../castlePerception/castleMultiStreamFusionBusV1.js";
import { __resetCastleAttentionFieldForTestV1 } from "../../../castlePerception/castleAttentionFieldV1.js";
import { __resetSpikeEngineForTestV1 } from "../../../castlePerception/castleSpikeEngineV1.js";
import { __resetExecutionLayerForTestV1 } from "../../../castlePerception/castleExecutionLayerV1.js";
import { __resetExecutionStateForTestV1 } from "../../../castlePerception/castleExecutionStateV1.js";
import { __resetRealtimeArbitrationForTestV1 } from "../../../castlePerception/castleRealtimeArbitrationV1.js";
import { __resetTemporalCoherenceForTestV1 } from "../../../castlePerception/castleTemporalCoherenceV1.js";
import { __resetStreamingAttentionGateForTestV0 } from "../rhizohStreamingAttentionGateV0.js";
import {
  clearVoiceAttentionModeOverrideV0,
  setVoiceAttentionModeOverrideV0,
  VOICE_ATTENTION_MODE_V0
} from "../voiceAttentionContextV0.js";

describe("rhizohCoPresenceKernelV1 ActionPlan", () => {
  beforeEach(() => {
    __resetCoPresenceKernelForTestV1();
    __resetCoPresenceRuntimeForTestV1();
    __resetExperienceFabricForTestV1();
    __resetFusionBusForTestV1();
    __resetCastleAttentionFieldForTestV1();
    __resetSpikeEngineForTestV1();
    __resetExecutionLayerForTestV1();
    __resetExecutionStateForTestV1();
    __resetRealtimeArbitrationForTestV1();
    __resetTemporalCoherenceForTestV1();
    __resetStreamingAttentionGateForTestV0();
    clearVoiceAttentionModeOverrideV0();
    setVoiceAttentionModeOverrideV0(VOICE_ATTENTION_MODE_V0.CO_PRESENCE);
  });

  it("decideCoPresence returns deterministic ActionPlanV1 contract", () => {
    const plan = decideCoPresenceV1({
      modeProfile: resolvePresenceKernelModeV1({ explicitMode: PRESENCE_KERNEL_MODE_V1.EMERGENCY }),
      spikes: [{ type: SPIKE_TYPE_V1.EMERGENCY, salienceScore: 0.95, preview: "yardım" }],
      field: { userStreamPriority: 0.5, intentMass: 0.9, narrativeMass: 0.1 },
      graph: { tickId: 1, nodes: [], resonanceZones: [] }
    });
    expect(plan.schema).toBe(ACTION_PLAN_SCHEMA_V1);
    expect(plan.deterministic).toBe(true);
    expect(plan.speak).toBe(true);
    expect(plan.priority).toBe(100);
    expect(plan.latencyBudgetMs).toBe(500);
  });

  it("ambient observer never speaks — shadowWrite or memoryWrite", () => {
    setPresenceKernelModeOverrideV1(PRESENCE_KERNEL_MODE_V1.AMBIENT_OBSERVER);
    const result = processPresenceKernelIngressV1({
      source: "mic",
      text: "Rhizoh şu bölümde ne oldu?"
    });
    expect(result.actionPlan.speak).toBe(false);
    expect(result.actionPlan.shadowWrite || result.actionPlan.memoryWrite).toBe(true);
  });

  it("co-presence speaks on collapsed spike via execution layer", () => {
    setPresenceKernelModeOverrideV1(PRESENCE_KERNEL_MODE_V1.CO_PRESENCE);
    const result = processPresenceKernelIngressV1({
      source: "mic",
      text: "Rhizoh şu pozisyonu açıkla",
      confidence: 0.6
    });
    expect(result.actionPlan.speak).toBe(true);
    expect(result.voiceSpike.respond).toBe(true);
    expect(result.execution.effects).toContain("tts_dispatch");
  });

  it("companion lower threshold vs co-presence", () => {
    const spike = { type: SPIKE_TYPE_V1.INTENT, salienceScore: 0.45, preview: "hello?" };
    const base = {
      spikes: [spike],
      field: { userStreamPriority: 0.5, intentMass: 0.4, narrativeMass: 0.1 },
      graph: { tickId: 2, nodes: [], resonanceZones: [{ mass: 0.3, nodeIds: ["a"] }] }
    };
    const coPlan = decideCoPresenceV1({
      ...base,
      modeProfile: resolvePresenceKernelModeV1({ explicitMode: PRESENCE_KERNEL_MODE_V1.CO_PRESENCE })
    });
    const companionPlan = decideCoPresenceV1({
      ...base,
      modeProfile: resolvePresenceKernelModeV1({ explicitMode: PRESENCE_KERNEL_MODE_V1.COMPANION })
    });
    expect(companionPlan.speak).toBe(true);
    expect(coPlan.speak).toBe(false);
  });
});
