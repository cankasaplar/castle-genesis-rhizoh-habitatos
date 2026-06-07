import { describe, expect, it, beforeEach } from "vitest";
import { buildCausalMapLayerV0 } from "../rhizohCausalMapLayerV0.js";
import { replayCausalChainV0, replaySpatialTrailV0 } from "../rhizohSpatialReplayEngineV0.js";
import { detectLiveConflictsV0, detectTensorContradictionsV0 } from "../rhizohLiveConflictDetectorV0.js";
import { runDomainGateForPathV0 } from "../rhizohDomainNervousSystemV0.js";
import {
  emitSpatialEventFromDomainV0,
  emitSpatialEventImmediateV0
} from "../rhizohSpatialEventEmitterV0.js";
import { SPATIAL_NODE_TIER_V0 } from "../rhizohSpatialNodeLayerV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainCoreStoreV0.js";
import { mapIntentToActionV0 } from "../rhizohTensorBridgeV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetTruthTraceForTestV0, __forceTruthTraceEnabledForTestV0 } from "../rhizohTruthTraceLayerV0.js";
import { __resetExplanationLayerForTestV0 } from "../rhizohExplanationLayerV0.js";
import { __resetLiveConsistencyAuditForTestV0 } from "../rhizohLiveConsistencyAuditV0.js";
import { __resetSpatialReadyGateForTestV0 } from "../rhizohSpatialReadyGateV0.js";

function resetAll() {
  __resetRhizohDomainCoreStoreForTestV0();
  __resetDomainAdapterRegistryForTestV0();
  __resetDomainHealthForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetControlPlaneForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetTruthTraceForTestV0();
  __resetExplanationLayerForTestV0();
  __resetLiveConsistencyAuditForTestV0();
  __resetSpatialReadyGateForTestV0();
  __forceTruthTraceEnabledForTestV0(true);
}

describe("rhizohCausalRuntimeV0", () => {
  beforeEach(resetAll);

  it("builds causal map from gate + tensor + spatial chain", () => {
    runDomainGateForPathV0("/world/space");
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "open_world_map" });
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.TEMPORAL,
      nodeId: "trail-test-1",
      kind: "test_trail"
    });

    const map = buildCausalMapLayerV0();
    expect(map.influencesExecution).toBe(false);
    expect(map.nodeCount).toBeGreaterThan(0);
    expect(map.compressed).toBe(true);
    expect(map.selfNarrative).toContain("Compressed causal graph");
  });

  it("replays causal chain without execution side effects", () => {
    runDomainGateForPathV0("/world/space");
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "open_world_map" });
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.TEMPORAL,
      nodeId: "trail-replay-1",
      kind: "replay_trail"
    });

    const replay = replayCausalChainV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map");
    expect(replay.influencesExecution).toBe(false);
    expect(replay.tensor.replay).toBe(true);
    expect(replay.tensor.dryRun).toBe(true);
    expect(replay.spatial.replay).toBe(true);
  });

  it("detects no tensor contradiction for deterministic replay", () => {
    runDomainGateForPathV0("/world/space");
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "open_world_map" });
    const check = detectTensorContradictionsV0();
    expect(check.conflictCount).toBe(0);
  });

  it("live conflict detector passes on aligned /settings path", () => {
    runDomainGateForPathV0("/settings");
    const report = detectLiveConflictsV0("/settings");
    expect(report.domainCoherence.pass).toBe(true);
    expect(report.influencesExecution).toBe(false);
  });

  it("spatial trail replay returns dry-run steps", () => {
    emitSpatialEventImmediateV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.TEMPORAL,
      nodeId: "trail-step-1",
      kind: "step",
      payload: { sourceDomain: RHIZOH_DOMAIN_ID_V0.WORLD }
    });
    const spatial = replaySpatialTrailV0({ domain: RHIZOH_DOMAIN_ID_V0.WORLD });
    expect(spatial.dryRun).toBe(true);
    expect(spatial.stepCount).toBeGreaterThanOrEqual(1);
  });
});
