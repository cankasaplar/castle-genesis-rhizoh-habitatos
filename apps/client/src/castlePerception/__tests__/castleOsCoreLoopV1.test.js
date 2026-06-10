import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetCastleOsCoreForTestV1,
  runCastleOsFieldTickV1,
  runCastleOsLoopV1
} from "../castleOsCoreLoopV1.js";
import { __resetCastleAttentionFieldForTestV1 } from "../castleAttentionFieldV1.js";
import { __resetFusionBusForTestV1, initCastleRoomV1 } from "../castleMultiStreamFusionBusV1.js";
import { __resetSpikeEngineForTestV1 } from "../castleSpikeEngineV1.js";
import { __resetExecutionLayerForTestV1 } from "../castleExecutionLayerV1.js";
import { __resetExecutionStateForTestV1 } from "../castleExecutionStateV1.js";
import { __resetRealtimeArbitrationForTestV1 } from "../castleRealtimeArbitrationV1.js";
import { __resetTemporalCoherenceForTestV1 } from "../castleTemporalCoherenceV1.js";
import { __resetCoPresenceKernelForTestV1 } from "../../rhizoh/runtime/rhizohCoPresenceKernelV1.js";
import { __resetExperienceFabricForTestV1 } from "../../rhizoh/runtime/rhizohExperienceFabricV1.js";
import { __resetContextualIdentityForTestV1_3 } from "../castleContextualIdentityV1_3.js";
import { __resetAttentionInertiaForTestV1_4 } from "../castleAttentionInertiaV1_4.js";
import { __resetAdaptiveInteractionForTestV1_5 } from "../castleAdaptiveInteractionV1_5.js";
import { __resetRealityPhaseForTestV1_5 } from "../castleRealityPhaseEngineV1_5.js";
import { __resetRealityStabilityForTestV1_5 } from "../castleRealityStabilityGovernorV1_5.js";
import { __resetStabilityCoGovernorForTestV1_6 } from "../castleStabilityCoGovernorV1_6.js";
import { __resetStabilityLifecycleLoopForTestV1_8 } from "../castleStabilityLifecycleLoopV1_8.js";
import { __resetStabilityLifecycleLoopForTestV1_9 } from "../castleStabilityLifecycleLoopV1_9.js";
import { __resetStabilityCloudSyncForTestV1_9 } from "../castleStabilityCloudSyncV1_9.js";
import { __resetStabilityLearningTraceForTestV1_8 } from "../castleStabilityLearningTraceV1_8.js";
import { __resetImplicitBiasForTestV1_8 } from "../castleImplicitBiasLearningV1_8.js";
import { __clearPhysicsLifecycleStorageForTestV1_8 } from "../castleStabilityPhysicsLifecycleV1_8.js";
import { __resetStabilityHumanLoopForTestV1_6 } from "../castleStabilityHumanLoopV1_6.js";
import { __resetStabilityMemoryGraphForTestV1_7 } from "../castleStabilityMemoryGraphV1_7.js";

describe("castleOsCoreLoopV1", () => {
  beforeEach(() => {
    __resetCastleOsCoreForTestV1();
    __resetCastleAttentionFieldForTestV1();
    __resetFusionBusForTestV1();
    __resetSpikeEngineForTestV1();
    __resetExecutionLayerForTestV1();
    __resetExecutionStateForTestV1();
    __resetRealtimeArbitrationForTestV1();
    __resetTemporalCoherenceForTestV1();
    __resetCoPresenceKernelForTestV1();
    __resetExperienceFabricForTestV1();
    __resetContextualIdentityForTestV1_3();
    __resetAttentionInertiaForTestV1_4();
    __resetAdaptiveInteractionForTestV1_5();
    __resetRealityPhaseForTestV1_5();
    __resetRealityStabilityForTestV1_5();
    __resetStabilityHumanLoopForTestV1_6();
    __resetStabilityLifecycleLoopForTestV1_8();
    __resetStabilityLifecycleLoopForTestV1_9();
    __resetStabilityCloudSyncForTestV1_9();
    __resetStabilityLearningTraceForTestV1_8();
    __resetImplicitBiasForTestV1_8();
    __clearPhysicsLifecycleStorageForTestV1_8();
    __resetStabilityMemoryGraphForTestV1_7();
    __resetStabilityCoGovernorForTestV1_6();
    initCastleRoomV1({ roomId: "os_room" });
  });

  it("full loop: bus → field → spike → kernel → execution", () => {
    const result = runCastleOsLoopV1({
      source: "mic",
      text: "Rhizoh şu pozisyonu açıkla",
      atMs: 5000
    });
    expect(result.bus.normalized.schema).toBe("castle.normalized_event.v1");
    expect(result.graph.nodes.length).toBeGreaterThan(0);
    expect(result.actionPlan.schema).toBe("rhizoh.action_plan.v1");
    expect(result.arbitration.schema).toBe("castle.realtime_arbitration.v1");
    expect(result.roomArbitration.schema).toBe("castle.room_arbitration.v1.2");
    expect(result.realityComposition.schema).toBe("castle.reality_composition.v1.3");
    expect(result.realityDynamics.schema).toBe("castle.reality_dynamics.v1.4");
    expect(result.realityStability.schema).toBe("castle.reality_stability.v1.5");
    expect(result.realityGovernance.schema).toBe("castle.stability_lifecycle_loop.v1.9");
    expect(result.coGovernance.schema).toBe("castle.stability_co_governor.v1.6");
    expect(result.stabilityMemory).toBeDefined();
    expect(result.learningTrace).toBeDefined();
    expect(result.traceStrip).toBeDefined();
    expect(result.schema).toBe("castle.os.core.v1.9");
    expect(result.execution.schema).toBe("castle.execution_layer.v1.3");
  });

  it("field tick increments monotonic tickId", () => {
    runCastleOsLoopV1({ source: "mic", text: "Rhizoh?", atMs: 1000 });
    const t1 = runCastleOsFieldTickV1(2000);
    const t2 = runCastleOsFieldTickV1(3000);
    expect(t2.fieldTickId).toBeGreaterThan(t1.fieldTickId);
  });
});
