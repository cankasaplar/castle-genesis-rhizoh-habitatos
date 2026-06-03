import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { compileExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { runStudioExecutionLoopV0, resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
import { resetRhizohWorldActionLogForTestV0 } from "../rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import { resetRhizohStudioOutputPackForTestV0 } from "../rhizohStudioOutputPackV0.js";
import { resetRhizohPetCitizenForTestV0 } from "../rhizohPetCitizenRuntimeV0.js";
import { resetRhizohStudioProductionOrganismForTestV0 } from "../rhizohStudioProductionOrganismV0.js";
import { resetRhizohCastleProjectionForTestV0 } from "../rhizohCastleProjectionLayerV0.js";
import { resetRhizohCoPresenceForTestV0 } from "../rhizohMultiInhabitantCoPresenceV0.js";
import { resetRhizohStudioCastleMappingForTestV0 } from "../rhizohStudioCastleMappingV0.js";
import { resetRhizohCastleCoherenceHardeningForTestV0 } from "../rhizohCastleCoherenceHardeningV0.js";
import { resetRhizohAgentCognitionBoundaryForTestV0 } from "../rhizohAgentCognitionBoundaryV0.js";
import { resetRhizohStudioPerceptualLockForTestV0 } from "../rhizohStudioPerceptualLockV0.js";
import { resetRhizohOrganismStabilizationForTestV0 } from "../rhizohOrganismStabilizationV0.js";
import { resetRhizohPerceptualContinuitySmoothingForTestV0 } from "../rhizohPerceptualContinuitySmoothingV0.js";
import { resetRhizohIdentityConsistencyLayerForTestV0 } from "../rhizohIdentityConsistencyLayerV0.js";
import { resetRhizohWorldWalPersistenceForTestV0 } from "../rhizohWorldWalPersistenceV0.js";
import {
  createInMemoryWorldWalIdbBackendV0,
  __setWorldWalIdbBackendForTestV0,
  __resetWorldWalIdbForTestV0
} from "../rhizohWorldActionLogIdbV0.js";
import { runProductionRhythmStressTestV0, resetRhizohProductionRhythmStressForTestV0 } from "../rhizohProductionRhythmStressTestV0.js";
import {
  evaluatePreDeployGatesV0,
  captureWorldIdentitySnapshotV0,
  startOrganismHeartbeatV0,
  stopOrganismHeartbeatV0,
  freezeWorldWriteV0,
  unfreezeWorldWriteV0,
  isWorldWriteFrozenV0,
  executeProductionDeploymentV0,
  executeProductionRollbackV0,
  detectProductionAnomaliesV0,
  readProductionMonitoringDashboardV0,
  publishProductionLiveMonitorV0,
  evaluateDeploySuccessConditionV0,
  refreshIdentityConsistencyForDeployGateV0,
  DEPLOY_ANOMALY_V0,
  resetRhizohProductionDeploymentRunbookForTestV0
} from "../rhizohProductionDeploymentRunbookV0.js";
import { persistWorldWalEntryV0 } from "../rhizohWorldWalPersistenceV0.js";
import { getLastWorldActionLogEntryV0 } from "../rhizohWorldActionLogV0.js";

function resetDeployStackV0() {
  resetRhizohProductionDeploymentRunbookForTestV0();
  __resetWorldWalIdbForTestV0();
  __setWorldWalIdbBackendForTestV0(createInMemoryWorldWalIdbBackendV0());
  resetRhizohProductionRhythmStressForTestV0();
  resetRhizohOrganismStabilizationForTestV0();
  resetRhizohPerceptualContinuitySmoothingForTestV0();
  resetRhizohIdentityConsistencyLayerForTestV0();
  resetRhizohWorldWalPersistenceForTestV0();
  resetRhizohAgentCognitionBoundaryForTestV0();
  resetRhizohCastleCoherenceHardeningForTestV0();
  resetRhizohStudioPerceptualLockForTestV0();
  resetRhizohCoPresenceForTestV0();
  resetRhizohCastleProjectionForTestV0();
  resetRhizohStudioCastleMappingForTestV0();
  resetRhizohStudioProductionOrganismForTestV0();
  resetRhizohStudioExecutionLoopForTestV0();
  resetRhizohWorldActionLogForTestV0();
  resetRhizohArtifactRegistryForTestV0();
  resetRhizohSurfaceBindingsForTestV0();
  resetRhizohSurfaceSingularityForTestV0();
  resetRhizohSurfaceCitizenshipForTestV0();
  resetRhizohStudioOutputPackForTestV0();
  resetRhizohPetCitizenForTestV0();
  window.__rhizoh = {};
}

function runOneStudioTickV0(nowMs) {
  const cognitive = {
    attention_inertia: {
      mcib: { causes: [{ id: "deploy" }], superposition01: 0.18 },
      ccf: { experiential_now_id: "en_deploy", collapse_mode: "singular" }
    }
  };
  const frame = buildT0UnifiedPresenceFrameV0(
    { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
    { orbModulation: { breathe: true }, transitionFeel: {} },
    null,
    nowMs
  );
  window.__rhizoh.presenceFrame = frame;
  window.__rhizoh.cognitiveAttention = cognitive;
  window.__rhizoh.presenceState = { rhizoh_is_present: true, rhizoh_attention: "focused" };
  const ecc = compileExperienceContinuityV0({
    presence: { rhizoh_is_present: true, silence_form: "listening" },
    resl: { orbModulation: { breathe: true } },
    cognitive,
    nowMs
  });
  window.__rhizoh.experienceContinuity = ecc;
  const run = runStudioExecutionLoopV0({ ecc, frame, cognitive, resl: { orbModulation: {} } });
  return { ecc, frame, run };
}

async function primeGateStackV0() {
  runProductionRhythmStressTestV0({ ticks: 48, startMs: 1_700_000_400_000 });
  runOneStudioTickV0(1_700_000_401_000);
  await refreshIdentityConsistencyForDeployGateV0();
}

describe("rhizohProductionDeploymentRunbookV0", () => {
  beforeEach(resetDeployStackV0);

  it("passes all pre-deploy gates after stress + studio + ICL", async () => {
    await primeGateStackV0();

    const gates = evaluatePreDeployGatesV0();
    expect(gates.ok).toBe(true);
    expect(gates.deploy_ready).toBe(true);
    expect(gates.gates.rhythm_stability.ok).toBe(true);
    expect(gates.gates.identity_consistency.same_world).toBe(true);
    expect(gates.gates.coherence_hardening.ok).toBe(true);
    expect(gates.gates.organism_stability.ok).toBe(true);
  });

  it("executes safe activation order in 5 steps", async () => {
    await primeGateStackV0();

    const report = await executeProductionDeploymentV0({
      skipGateCheck: false,
      studioLoopCtx: {
        ecc: compileExperienceContinuityV0({
          presence: { rhizoh_is_present: true, silence_form: "listening" },
          resl: { orbModulation: { breathe: true } },
          cognitive: window.__rhizoh.cognitiveAttention,
          nowMs: 1_700_000_412_000
        }),
        frame: window.__rhizoh.presenceFrame,
        cognitive: window.__rhizoh.cognitiveAttention
      },
      runStudioLoop: (ctx) => runStudioExecutionLoopV0(ctx)
    });

    expect(report.ok).toBe(true);
    expect(report.steps.length).toBe(5);
    expect(window.__rhizoh.productionDeploy?.active).toBe(true);
    expect(captureWorldIdentitySnapshotV0().chain_head_hash).toBeTruthy();
  });

  it("freezes WAL writes and blocks studio loop append", async () => {
    runOneStudioTickV0(1_700_000_420_000);
    await persistWorldWalEntryV0(getLastWorldActionLogEntryV0());
    const snap = captureWorldIdentitySnapshotV0();
    freezeWorldWriteV0("test");
    expect(isWorldWriteFrozenV0()).toBe(true);

    const frozenRun = runOneStudioTickV0(1_700_000_421_000);
    expect(frozenRun.run?.code).toBe("world_write_frozen");

    unfreezeWorldWriteV0();
    expect(isWorldWriteFrozenV0()).toBe(false);
    expect(snap.world_identity_id).toBeTruthy();
  });

  it("detects A1 identity fracture anomaly", () => {
    window.__rhizoh.worldIdentityConsistency = {
      equivalence: { same_world: false, live_matches_wal: false, chain_ok: false },
      drift: { drift_class: "identity_break" }
    };
    const report = detectProductionAnomaliesV0();
    expect(report.ok).toBe(false);
    expect(report.anomalies.some((a) => a.code === DEPLOY_ANOMALY_V0.A1_IDENTITY_FRACTURE)).toBe(true);
  });

  it("rollback restores WAL snapshot and stops heartbeat", async () => {
    runOneStudioTickV0(1_700_000_430_000);
    await persistWorldWalEntryV0(getLastWorldActionLogEntryV0());
    runOneStudioTickV0(1_700_000_431_000);
    await persistWorldWalEntryV0(getLastWorldActionLogEntryV0());
    const snap = captureWorldIdentitySnapshotV0();
    startOrganismHeartbeatV0({ mode: "production", interval: false });

    const rollback = await executeProductionRollbackV0({ snapshot: snap, skipIcl: true });
    expect(rollback.ok).toBe(true);
    expect(isWorldWriteFrozenV0()).toBe(true);
    expect(window.__rhizoh.productionDeploy?.heartbeat_active).toBe(false);
    stopOrganismHeartbeatV0();
  });

  it("publishes liveMonitor observability object", () => {
    runOneStudioTickV0(1_700_000_440_000);
    const monitor = publishProductionLiveMonitorV0();
    expect(monitor.schema).toContain("live_monitor");
    expect(window.__rhizoh.liveMonitor).toBeDefined();
    expect(monitor.rhythm).toBeDefined();
    expect(monitor.pet).toBeDefined();
  });

  it("evaluates deploy success condition", async () => {
    await primeGateStackV0();
    const success = evaluateDeploySuccessConditionV0();
    expect(success.same_world).toBe(true);
    expect(success.wal_chain_ok).toBe(true);
  });
});
