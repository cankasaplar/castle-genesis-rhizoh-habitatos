import { describe, expect, it, beforeEach } from "vitest";
import {
  projectRcalCrystalTopologyV0,
  CRYSTAL_NODE_ROLE_V0
} from "../rhizohRcalCrystalTopologyV0.js";
import { syncCognitiveAttentionAfterPresenceV0, resetCognitiveAttentionForTestV0 } from "../rhizohCognitiveAttentionLayerV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";

describe("rhizohRcalCrystalTopologyV0", () => {
  beforeEach(() => {
    resetCognitiveAttentionForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  it("maps focus_lock and drift_anchor nodes", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 1000, voiceListening: true });
    const cog = syncCognitiveAttentionAfterPresenceV0({ presence: p, nowMs: 1000 });
    const topo = projectRcalCrystalTopologyV0(cog);
    expect(topo.nodes.find((n) => n.role === CRYSTAL_NODE_ROLE_V0.FOCUS_LOCK)).toBeTruthy();
    expect(topo.nodes.find((n) => n.role === CRYSTAL_NODE_ROLE_V0.ANCHOR)).toBeTruthy();
    expect(topo.edges.some((e) => e.kind === "intent_drift")).toBe(true);
    expect(topo.cluster.primary).toBeTruthy();
  });

  it("documents archive mapping keys", () => {
    const topo = projectRcalCrystalTopologyV0(null);
    expect(topo.archiveMapping.crystal_node).toBe("attention_anchor");
    expect(topo.archiveMapping.connection_line).toBe("drift_vector_field");
  });
});
